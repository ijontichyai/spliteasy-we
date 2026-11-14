import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { planQuery } from "@/lib/plans";
import { fromCents } from "@/lib/money";
import { PlanView } from "@/components/plan/plan-view";
import { isPlanTab, type PlanActions, type PlanTab } from "@/components/plan/types";

export const Route = createFileRoute("/_authenticated/plans/$planId")({
  head: () => ({
    meta: [
      { title: "Plan | SplitEasy" },
      { name: "description", content: "Grupo, lugares, gastos y balances de tu plan." },
      { property: "og:title", content: "Plan | SplitEasy" },
      { property: "og:description", content: "Grupo, lugares, gastos y balances de tu plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { tab?: PlanTab } =>
    isPlanTab(s["tab"]) ? { tab: s["tab"] } : {},
  loader: ({ context, params }) => context.queryClient.ensureQueryData(planQuery(params.planId)),
  errorComponent: ({ error }) => <p className="p-8 text-destructive">{error instanceof Error ? error.message : String(error)}</p>,
  notFoundComponent: () => <p className="p-8">404</p>,
  component: PlanPage,
});

async function rpc(fn: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw error;
  return data as unknown;
}

const sharesArg = (shares: Record<string, number>) =>
  Object.entries(shares).filter(([, c]) => c > 0).map(([user_id, c]) => ({ user_id, amount: fromCents(c) }));

function PlanPage() {
  const { planId } = Route.useParams();
  const { tab } = Route.useSearch();
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(planQuery(planId));
  const refresh = () => qc.invalidateQueries({ queryKey: ["plan", planId] });

  const actions: PlanActions = {
    addPlace: async (p) => { await rpc("add_place_to_plan", { _plan: planId, _name: p.name, _category: p.category, _address: p.address, _url: p.url, _note: p.note }); await refresh(); },
    setPlaceStatus: async (id, s) => { await rpc("set_plan_place_status", { _plan_place: id, _status: s }); await refresh(); },
    addExpense: async (e) => {
      await rpc("save_expense", {
        _plan: planId, _description: e.description, _category: e.category, _amount: fromCents(e.amountCents), _paid_by: e.paidBy,
        _split: e.method === "equal" ? "equal" : "custom", _shares: sharesArg(e.shares),
        _idempotency_key: e.idempotencyKey ?? crypto.randomUUID(), _date: e.date, _method: e.method, _tip: fromCents(e.tipCents), _meta: e.meta,
      });
      await refresh();
    },
    updateExpense: async (id, e) => {
      const prev = data.expenses.find((x) => x.id === id);
      await rpc("update_expense", {
        _expense: id, _expected_updated_at: prev?.updatedAt ?? null, _description: e.description, _category: e.category,
        _amount: fromCents(e.amountCents), _paid_by: e.paidBy, _shares: sharesArg(e.shares), _date: e.date,
        _method: e.method, _tip: fromCents(e.tipCents), _meta: e.meta,
      });
      await refresh();
    },
    deleteExpense: async (id) => { await rpc("delete_expense", { _expense: id }); await refresh(); },
    proposeSettlement: async (to, cents) => { await rpc("propose_settlement", { _plan: planId, _to: to, _amount: fromCents(cents), _idempotency_key: crypto.randomUUID() }); await refresh(); },
    respondSettlement: async (id, s) => { await rpc("respond_settlement", { _id: id, _status: s }); await refresh(); },
    createInvite: async () => { const token = (await rpc("create_invitation", { _plan: planId })) as string; await refresh(); return token; },
    revokeInvite: async (id) => { await rpc("revoke_invitation", { _id: id }); await refresh(); },
    setArchived: async (archived) => { await rpc("archive_plan", { _plan: planId, _archive: archived }); await refresh(); await qc.invalidateQueries({ queryKey: ["plans"] }); },
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <Link to="/app" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" />{t("plan.back")}</Link>
      <PlanView data={data} actions={actions} initialTab={tab} />
    </main>
  );
}
