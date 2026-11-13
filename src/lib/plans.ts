import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toCents } from "@/lib/money";
import type { InvitationVM, PlanData, PlanType } from "@/components/plan/types";

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("not signed in");
  return data.user.id;
}

export const myPlansQuery = () =>
  queryOptions({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, type, city, start_date, end_date, archived_at, owner_id, plan_members(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((p) => ({
        id: p.id, name: p.name, type: p.type as PlanType, city: p.city, startDate: p.start_date, endDate: p.end_date,
        archived: !!p.archived_at, ownerId: p.owner_id,
        memberCount: (p.plan_members as unknown as { count: number }[])[0]?.count ?? 0,
      }));
    },
  });

export const planQuery = (planId: string) =>
  queryOptions({
    queryKey: ["plan", planId],
    queryFn: async (): Promise<PlanData> => {
      const me = await uid();
      const [plan, members, places, expenses, settlements, invitations, limits] = await Promise.all([
        supabase.from("plans").select("*").eq("id", planId).maybeSingle(),
        supabase.from("plan_members").select("user_id, role, status").eq("plan_id", planId).eq("status", "active").order("joined_at"),
        supabase.from("plan_places").select("id, status, note, added_by, places(name, category, address, url)").eq("plan_id", planId).order("created_at"),
        supabase.from("expenses").select("id, description, category, amount, paid_by, expense_date, created_by, expense_shares(user_id, amount)").eq("plan_id", planId).is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("settlements").select("id, from_user, to_user, amount, status").eq("plan_id", planId).order("created_at", { ascending: false }),
        supabase.from("invitations").select("id, expires_at, max_uses, use_count, revoked_at").eq("plan_id", planId).order("created_at", { ascending: false }).limit(10),
        supabase.from("plan_limits").select("max_members_per_plan").eq("tier", "free").maybeSingle(),
      ]);
      for (const r of [plan, members, places, expenses, settlements, invitations]) if (r.error) throw r.error;
      if (!plan.data) throw new Error("NOT_FOUND");
      const ids = (members.data ?? []).map((m) => m.user_id);
      const { data: profiles, error: pe } = await supabase.from("profiles").select("id, display_name").in("id", ids);
      if (pe) throw pe;
      const name = (id: string) => profiles?.find((p) => p.id === id)?.display_name ?? "?";
      const now = Date.now();
      return {
        me,
        memberLimit: limits.data?.max_members_per_plan ?? null,
        plan: {
          id: plan.data.id, name: plan.data.name, type: plan.data.type as PlanType, city: plan.data.city,
          startDate: plan.data.start_date, endDate: plan.data.end_date,
          budgetCents: plan.data.estimated_budget == null ? null : toCents(plan.data.estimated_budget),
          archived: !!plan.data.archived_at, currency: plan.data.currency,
        },
        members: (members.data ?? []).map((m) => ({ id: m.user_id, name: name(m.user_id), role: m.role })),
        places: (places.data ?? []).map((pp) => {
          const pl = pp.places as unknown as { name: string; category: PlanData["places"][number]["category"]; address: string | null; url: string | null };
          return { id: pp.id, status: pp.status, note: pp.note, addedBy: pp.added_by, name: pl?.name ?? "?", category: pl?.category ?? "other", address: pl?.address ?? null, url: pl?.url ?? null };
        }),
        expenses: (expenses.data ?? []).map((e) => ({
          id: e.id, description: e.description, category: e.category, amountCents: toCents(e.amount), paidBy: e.paid_by,
          date: e.expense_date, createdBy: e.created_by,
          shares: Object.fromEntries((e.expense_shares ?? []).map((s) => [s.user_id, toCents(s.amount)])),
        })),
        settlements: (settlements.data ?? []).map((s) => ({ id: s.id, from: s.from_user, to: s.to_user, cents: toCents(s.amount), status: s.status })),
        invitations: (invitations.data ?? []).map((i): InvitationVM => ({
          id: i.id, expiresAt: i.expires_at,
          state: i.revoked_at ? "revoked" : i.use_count >= i.max_uses ? "used" : new Date(i.expires_at).getTime() < now ? "expired" : "pending",
        })),
      };
    },
  });
