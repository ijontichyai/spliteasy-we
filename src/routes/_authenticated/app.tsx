import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Compass, Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import { errorKey } from "@/lib/errors";
import { freeLimitsQuery, myProfileQuery } from "@/lib/profile";
import { myPlansQuery } from "@/lib/plans";
import { PLAN_TYPES, type PlanType } from "@/components/plan/types";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Mis planes | SplitEasy" },
      { name: "description", content: "Tus planes compartidos en SplitEasy." },
      { property: "og:title", content: "Mis planes | SplitEasy" },
      { property: "og:description", content: "Tus planes compartidos en SplitEasy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { go?: "places" | "expenses" } =>
    s.go === "places" || s.go === "expenses" ? { go: s.go } : {},
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(myProfileQuery()),
      context.queryClient.ensureQueryData(freeLimitsQuery()),
      context.queryClient.ensureQueryData(myPlansQuery()),
    ]),
  errorComponent: ({ error }) => <p className="p-8 text-destructive">{error instanceof Error ? error.message : String(error)}</p>,
  notFoundComponent: () => <p className="p-8">404</p>,
  component: AppHome,
});

const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function AppHome() {
  const { t } = useI18n();
  const { data: profile } = useSuspenseQuery(myProfileQuery());
  const { data: limits } = useSuspenseQuery(freeLimitsQuery());
  const { data: plans } = useSuspenseQuery(myPlansQuery());
  const { go } = Route.useSearch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const activePlans = plans.filter((p) => !p.archived);
  // Coming from a home card with exactly one active plan: open that section directly.
  useEffect(() => {
    if (go && activePlans.length === 1) {
      navigate({ to: "/plans/$planId", params: { planId: activePlans[0].id }, search: { tab: go }, replace: true });
    }
  }, [go, activePlans, navigate]);
  const activeOwned = plans.filter((p) => p.ownerId === profile.id && !p.archived).length;
  const atLimit = limits.max_active_owned_plans != null && activeOwned >= limits.max_active_owned_plans;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("app.hello", { name: profile.display_name })}</p>
          <h1 className="mt-1 text-3xl font-bold">{t("app.title")}</h1>
        </div>
        {!open && <Button onClick={() => setOpen(true)} disabled={atLimit}><Plus className="size-4" />{t("app.newPlan")}</Button>}
      </div>
      {atLimit && <p className="mt-3 text-sm text-muted-foreground">{t("app.limitReached")}</p>}
      {open && <CreatePlan onDone={() => setOpen(false)} />}
      {go && activePlans.length > 1 && !open && (
        <p role="status" className="mt-6 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          {t(go === "places" ? "app.pickPlanPlaces" : "app.pickPlanExpenses")}
        </p>
      )}

      {plans.length === 0 && !open ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Compass className="size-10 text-accent" aria-hidden />
          <p className="mt-4 max-w-sm text-muted-foreground">{t(go ? "app.noPlanForSection" : "app.empty")}</p>
          {!atLimit && <Button className="mt-5" onClick={() => setOpen(true)}><Plus className="size-4" />{t("app.createFirst")}</Button>}
          <p className="mt-6 rounded-full bg-secondary px-4 py-1.5 text-xs text-secondary-foreground">
            {t("app.freeLimits", { plans: limits.max_active_owned_plans ?? "∞", members: limits.max_members_per_plan ?? "∞" })}
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {plans.map((p) => (
            <li key={p.id}>
              <Link to="/plans/$planId" params={{ planId: p.id }} search={go ? { tab: go } : {}} className={`block rounded-3xl border border-border bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${p.archived ? "opacity-60" : ""}`}>
                <p className="text-xs font-medium uppercase tracking-wider text-accent">{t(`type.${p.type}`)}{p.city ? ` · ${p.city}` : ""}</p>
                <h2 className="mt-1 text-xl font-semibold">{p.name}</h2>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4" aria-hidden />{t("app.members", { n: p.memberCount })}
                  {p.archived && <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">{t("app.archived")}</span>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function CreatePlan({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", type: "getaway" as PlanType, start: "", end: "", city: "", budget: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.rpc("create_plan", {
      _name: f.name, _type: f.type, _start: f.start || null, _end: f.end || null, _city: f.city, _budget: f.budget ? Number(f.budget) : null,
    } as never);
    setBusy(false);
    if (error) return void toast.error(t(errorKey(error)));
    await qc.invalidateQueries({ queryKey: ["plans"] });
    toast.success(t("plan.created"));
    onDone();
    navigate({ to: "/plans/$planId", params: { planId: data as unknown as string } });
  };
  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="pn">{t("plan.name")}</Label><Input id="pn" required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="pt">{t("plan.type")}</Label>
        <select id="pt" className={selectCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as PlanType })}>
          {PLAN_TYPES.map((x) => <option key={x} value={x}>{t(`type.${x}`)}</option>)}
        </select></div>
      <div className="space-y-1.5"><Label htmlFor="pc">{t("plan.city")}</Label><Input id="pc" maxLength={120} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="ps">{t("plan.start")}</Label><Input id="ps" type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="pe">{t("plan.end")}</Label><Input id="pe" type="date" min={f.start || undefined} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="pb">{t("plan.budget")}</Label><Input id="pb" type="number" min="0" step="0.01" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></div>
      <div className="flex items-end gap-2"><Button type="submit" disabled={busy}>{t("plan.create")}</Button><Button type="button" variant="ghost" onClick={onDone}>{t("common.cancel")}</Button></div>
    </form>
  );
}
