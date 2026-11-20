import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toCents } from "@/lib/money";

export type PlanSummary = { totalCents: number; paidCents: number; balanceCents: number };

/** Per-plan totals for the signed-in user. Totals read expenses through RLS; balances come from the plan_balances DB function (single source of truth). */
export const plansSummaryQuery = (planIds: string[]) =>
  queryOptions({
    queryKey: ["plans", "summary", planIds],
    enabled: planIds.length > 0,
    retry: 1,
    queryFn: async (): Promise<Record<string, PlanSummary>> => {
      const { data: u } = await supabase.auth.getUser();
      const me = u.user?.id;
      if (!me) throw new Error("not signed in");
      const { data: exp, error } = await supabase.from("expenses").select("plan_id, amount").in("plan_id", planIds).is("deleted_at", null);
      if (error) throw error;
      const out: Record<string, PlanSummary> = {};
      for (const id of planIds) out[id] = { totalCents: 0, paidCents: 0, balanceCents: 0 };
      for (const e of exp) { const s = out[e.plan_id]; if (s) s.totalCents += toCents(e.amount); }
      const bal = await Promise.all(planIds.map((id) => supabase.rpc("plan_balances", { _plan: id })));
      bal.forEach((r, i) => {
        if (r.error) throw r.error;
        const mine = r.data?.find((row) => row.user_id === me);
        const s = out[planIds[i] ?? ""];
        if (s && mine) { s.paidCents = toCents(mine.paid); s.balanceCents = toCents(mine.balance); }
      });
      return out;
    },
  });

/** Aggregate across plans: positive balance = others owe you, negative = you owe. */
export function aggregateSummary(rows: PlanSummary[]) {
  let paid = 0, owe = 0, owed = 0;
  for (const r of rows) { paid += r.paidCents; if (r.balanceCents < 0) owe -= r.balanceCents; else owed += r.balanceCents; }
  return { paidCents: paid, oweCents: owe, owedCents: owed };
}
