import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, Compass, Plus, Users } from "lucide-react";
import { INSPIRATION_PHOTOS } from "@/components/discover/inspiration-photos";
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
  validateSearch: (s: Record<string, unknown>): { go?: "places" | "expenses"; new?: boolean; placeId?: string; placeName?: string } => ({
    ...(s["go"] === "places" || s["go"] === "expenses" ? { go: s["go"] } : {}),
    ...(s["new"] === true || s["new"] === "true" ? { new: true } : {}),
    ...(typeof s["placeId"] === "string" && s["placeId"].length <= 300 ? { placeId: s["placeId"] } : {}),
    ...(typeof s["placeName"] === "string" ? { placeName: s["placeName"].slice(0, 120) } : {}),
  }),
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

const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AppHome() {
  const { t } = useI18n();
  const { data: profile } = useSuspenseQuery(myProfileQuery());
  const { data: limits } = useSuspenseQuery(freeLimitsQuery());
  const { data: plans } = useSuspenseQuery(myPlansQuery());
  const { go, new: wantsNew, placeName } = Route.useSearch();
  const [suggestedName, setSuggestedName] = useState("");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"active" | "archived">("active");
  // "+ Plan" in the bottom bar lands here with ?new=true: open the wizard once.
  useEffect(() => {
    if (wantsNew) {
      setOpen(true);
      if (placeName) setSuggestedName(placeName);
      navigate({ to: "/app", search: go ? { go } : {}, replace: true });
    }
  }, [wantsNew, go, placeName, navigate]);
  const activePlans = plans.filter((p) => !p.archived);
  // Coming from a home card with exactly one active plan: open that section directly.
  useEffect(() => {
    const only = activePlans.length === 1 ? activePlans[0] : undefined;
    if (go && only) {
      navigate({ to: "/plans/$planId", params: { planId: only.id }, search: { tab: go }, replace: true });
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
      {open && <CreatePlan key={suggestedName} initialName={suggestedName} onDone={() => setOpen(false)} />}
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
        <>
        <div role="tablist" aria-label={t("app.title")} className="mt-8 grid max-w-sm grid-cols-2 gap-1 rounded-2xl bg-surface-3 p-1">
          {(["active", "archived"] as const).map((k) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`min-h-10 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tab === k ? "bg-surface-1 text-primary shadow-elevation-1" : "text-muted-foreground hover:text-foreground"}`}>
              {t(k === "active" ? "app.tabActive" : "app.tabArchived")}
            </button>
          ))}
        </div>
        {plans.filter((p) => (tab === "archived") === p.archived).length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">{t("app.noneInTab")}</p>
        )}
        <ul className="mt-6 grid gap-5 sm:grid-cols-2">
          {plans.filter((p) => (tab === "archived") === p.archived).map((p) => {
            const photo = coverFor(p.type);
            return (
            <li key={p.id}>
              <Link to="/plans/$planId" params={{ planId: p.id }} search={go ? { tab: go } : {}} className={`group block overflow-hidden motion-lift rounded-3xl border border-border bg-surface-1 shadow-elevation-1 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevation-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${p.archived ? "opacity-70" : ""}`}>
                <div className="relative aspect-[16/7] overflow-hidden bg-surface-3">
                  <img src={photo.small.url} alt="" loading="lazy" decoding="async" width={600} height={375} className="h-full w-full object-cover transition-transform duration-200 motion-safe:group-hover:scale-[1.03]" />
                  <span className="absolute right-3 top-3 rounded-full bg-surface-1/90 px-2.5 py-0.5 text-[11px] font-medium text-foreground">{t("discover.illustrative")}</span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t(`type.${p.type}`)}{p.city ? ` · ${p.city}` : ""}</p>
                  <h2 className="mt-1 text-xl font-bold">{p.name}</h2>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="size-4" aria-hidden />{t("app.members", { n: p.memberCount })}
                      {p.archived && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{t("app.archived")}</span>}
                    </span>
                    <span className="inline-flex min-h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
                      {t("app.viewPlan")}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
        </>
      )}
    </main>
  );
}

// Illustrative cover per plan type (editorial photos, labelled; never a real place).
function coverFor(type: PlanType) {
  const idx = type === "dinner" || type === "celebration" ? 3 : type === "activity" ? 2 : type === "trip" ? 1 : 0;
  return INSPIRATION_PHOTOS[idx] ?? INSPIRATION_PHOTOS[0];
}

function CreatePlan({ onDone, initialName = "" }: { onDone: () => void; initialName?: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ name: initialName, type: "getaway" as PlanType, start: "", end: "", city: "", budget: "" });
  const [busy, setBusy] = useState(false);
  const steps = [t("wizard.idea"), t("wizard.dates"), t("wizard.invite")];
  const create = async (invite: boolean) => {
    if (!f.name.trim()) return setStep(1);
    setBusy(true);
    const { data, error } = await supabase.rpc("create_plan", {
      _name: f.name.trim(), _type: f.type, _start: f.start || null, _end: f.end || null, _city: f.city, _budget: f.budget ? Number(f.budget) : null,
    } as never);
    setBusy(false);
    if (error) return void toast.error(t(errorKey(error)));
    await qc.invalidateQueries({ queryKey: ["plans"] });
    toast.success(t("plan.created"));
    onDone();
    navigate({ to: "/plans/$planId", params: { planId: data as unknown as string }, search: invite ? { tab: "people" } : {} });
  };
  const next = (e: FormEvent) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else void create(true);
  };
  return (
    <form onSubmit={next} className="mt-6 rounded-3xl border border-border bg-surface-1 p-5 shadow-elevation-2 sm:p-6">
      <ol className="flex gap-2" aria-label={t("wizard.step", { n: step })}>
        {steps.map((label, i) => (
          <li key={label} aria-current={step === i + 1 ? "step" : undefined} className="flex-1">
            <span className={`block h-1.5 rounded-full ${i < step ? "bg-premium" : "bg-surface-3"}`} />
            <span className={`mt-1.5 block text-xs font-semibold ${i + 1 === step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{t("wizard.step", { n: step })} · {t(step === 1 ? "wizard.ideaHint" : step === 2 ? "wizard.datesHint" : "wizard.inviteHint")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {step === 1 && (
          <>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="pn">{t("plan.name")}</Label><Input id="pn" autoFocus required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="h-11" /></div>
            <div className="space-y-1.5"><Label htmlFor="pt">{t("plan.type")}</Label>
              <select id="pt" className={selectCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as PlanType })}>
                {PLAN_TYPES.map((x) => <option key={x} value={x}>{t(`type.${x}`)}</option>)}
              </select></div>
            <div className="space-y-1.5"><Label htmlFor="pc">{t("plan.city")}</Label><Input id="pc" maxLength={120} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="space-y-1.5"><Label htmlFor="ps">{t("plan.start")}</Label><Input id="ps" type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="pe">{t("plan.end")}</Label><Input id="pe" type="date" min={f.start || undefined} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="pb">{t("plan.budget")}</Label><Input id="pb" type="number" min="0" step="0.01" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></div>
          </>
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy || !f.name.trim()} className="h-11 rounded-full bg-premium px-6">
          {step < 3 ? t("wizard.next") : t("wizard.createInvite")}
        </Button>
        <Button type="button" variant="outline" disabled={busy || !f.name.trim()} className="h-11 rounded-full" onClick={() => void create(false)}>
          {step === 1 ? t("plan.create") : t("wizard.later")}
        </Button>
        {step > 1 && <Button type="button" variant="ghost" className="h-11" onClick={() => setStep(step - 1)}>{t("wizard.back")}</Button>}
        <Button type="button" variant="ghost" className="ml-auto h-11" onClick={onDone}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
