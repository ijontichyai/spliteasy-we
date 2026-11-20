import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/money";
import { myPlansQuery } from "@/lib/plans";
import { aggregateSummary, plansSummaryQuery } from "@/lib/summary";
import { INSPIRATION_PHOTOS } from "@/components/discover/inspiration-photos";
import type { PlanType } from "@/components/plan/types";

// Illustrative cover per plan type (editorial photos, labelled; never a real place).
export function coverFor(type: PlanType) {
  const idx = type === "dinner" || type === "celebration" ? 3 : type === "activity" ? 2 : type === "trip" ? 1 : 0;
  return INSPIRATION_PHOTOS[idx] ?? INSPIRATION_PHOTOS[0];
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
      {t("common.loadError")}
      <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">{t("common.retry")}</button>
    </p>
  );
}

/** Signed-in home block: active plan card + personal totals from plan_balances. */
export function HomeActivePlan() {
  const { t, locale } = useI18n();
  const plans = useQuery(myPlansQuery());
  const active = (plans.data ?? []).filter((p) => !p.archived);
  const summary = useQuery(plansSummaryQuery(active.map((p) => p.id)));
  const first = active[0];
  const agg = aggregateSummary(Object.values(summary.data ?? {}));
  const money = (c: number) => formatMoney(c, locale);

  const amountClass = (c: number, tone: "debt" | "credit" | "plain") =>
    c === 0 ? "text-muted-foreground" : tone === "debt" ? "text-destructive" : tone === "credit" ? "text-primary" : "text-foreground";

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-6">
      <section aria-labelledby="active-plan">
        <div className="flex items-center justify-between">
          <h2 id="active-plan" className="text-2xl font-bold">{t("home.activePlan")}</h2>
          <Link to="/app" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent">{t("home.seeAll")}<ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        {plans.isPending ? (
          <div aria-busy className="mt-3 h-56 animate-pulse rounded-2xl bg-surface-3"><span className="sr-only">{t("common.loading")}</span></div>
        ) : plans.isError ? (
          <div className="mt-3"><LoadError onRetry={() => plans.refetch()} /></div>
        ) : !first ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface-1 p-6 text-center">
            <p className="text-muted-foreground">{t("home.noActive")}</p>
          </div>
        ) : (
          <article className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-elevation-1">
            <div className="relative h-40 overflow-hidden bg-surface-3 sm:h-[220px]">
              <img src={coverFor(first.type).small.url} alt="" width={600} height={220} className="h-full w-full object-cover" />
              <span className="absolute right-3 top-3 rounded-full bg-surface-1/90 px-2.5 py-0.5 text-[11px] font-medium text-foreground">{t("discover.illustrative")}</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3 p-5">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold">{first.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Users className="size-4" aria-hidden />{(first.memberCount === 1 ? t("app.memberOne") : t("app.members", { n: first.memberCount }))}{first.city ? ` · ${first.city}` : ""}</p>
              </div>
              <Button asChild className="rounded-full"><Link to="/plans/$planId" params={{ planId: first.id }}>{t("app.viewPlan")}</Link></Button>
            </div>
          </article>
        )}
      </section>

      {active.length > 0 && (
        <section aria-labelledby="plans-summary" className="rounded-2xl border border-border bg-surface-1 p-5 shadow-elevation-1">
          <h2 id="plans-summary" className="text-xl font-bold">{t("home.summaryTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.summaryNote")}</p>
          <div className="mt-4">
            {summary.isPending ? (
              <p aria-busy className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : summary.isError ? (
              <LoadError onRetry={() => summary.refetch()} />
            ) : (
              <dl className="grid grid-cols-1 gap-4 tabular-nums sm:grid-cols-3">
                <div><dt className="text-sm text-muted-foreground">{t("home.paid")}</dt><dd className={`mt-1 text-3xl font-bold ${amountClass(agg.paidCents, "plain")}`}>{money(agg.paidCents)}</dd></div>
                <div className="border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"><dt className="text-sm text-muted-foreground">{t("home.youOwe")}</dt><dd className={`mt-1 text-3xl font-bold ${amountClass(agg.oweCents, "debt")}`}>{money(agg.oweCents)}</dd></div>
                <div className="border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"><dt className="text-sm text-muted-foreground">{t("home.owedToYou")}</dt><dd className={`mt-1 text-3xl font-bold ${amountClass(agg.owedCents, "credit")}`}>{money(agg.owedCents)}</dd></div>
              </dl>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
