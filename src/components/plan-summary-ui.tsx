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

  return (
    <section aria-labelledby="active-plan" className="mx-auto max-w-3xl px-4 pt-10">
      <div className="flex items-center justify-between">
        <h2 id="active-plan" className="text-2xl font-bold">{t("home.activePlan")}</h2>
        <Link to="/app" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent">{t("home.seeAll")}<ArrowRight className="size-4" aria-hidden /></Link>
      </div>
      {plans.isPending ? (
        <div aria-busy className="mt-4 h-64 animate-pulse rounded-3xl bg-surface-3" ><span className="sr-only">{t("common.loading")}</span></div>
      ) : plans.isError ? (
        <div className="mt-4"><LoadError onRetry={() => plans.refetch()} /></div>
      ) : !first ? (
        <div className="mt-4 rounded-3xl border border-dashed border-border bg-surface-1 p-6 text-center">
          <p className="text-muted-foreground">{t("home.noActive")}</p>
          <Button asChild className="mt-4 rounded-full"><Link to="/app" search={{ new: true }}>{t("app.createFirst")}</Link></Button>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface-1 shadow-elevation-1">
          <Link to="/plans/$planId" params={{ planId: first.id }} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="relative aspect-[16/6] overflow-hidden bg-surface-3">
              <img src={coverFor(first.type).small.url} alt="" width={600} height={225} className="h-full w-full object-cover" />
              <span className="absolute right-3 top-3 rounded-full bg-surface-1/90 px-2.5 py-0.5 text-[11px] font-medium text-foreground">{t("discover.illustrative")}</span>
            </div>
            <div className="px-5 pt-4">
              <h3 className="text-xl font-bold">{first.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Users className="size-4" aria-hidden />{t("app.members", { n: first.memberCount })}{first.city ? ` · ${first.city}` : ""}</p>
            </div>
          </Link>
          <div className="m-5 mt-4 border-t border-border pt-4">
            {summary.isPending ? (
              <p aria-busy className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : summary.isError ? (
              <LoadError onRetry={() => summary.refetch()} />
            ) : (
              <dl className="grid grid-cols-3 gap-3 tabular-nums">
                <div><dt className="text-xs text-muted-foreground">{t("home.paid")}</dt><dd className="mt-0.5 text-lg font-bold">{money(agg.paidCents)}</dd></div>
                <div className="border-l border-border pl-3"><dt className="text-xs text-muted-foreground">{t("home.youOwe")}</dt><dd className="mt-0.5 text-lg font-bold text-destructive">{money(agg.oweCents)}</dd></div>
                <div className="border-l border-border pl-3"><dt className="text-xs text-muted-foreground">{t("home.owedToYou")}</dt><dd className="mt-0.5 text-lg font-bold text-primary">{money(agg.owedCents)}</dd></div>
              </dl>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
