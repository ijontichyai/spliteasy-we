import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarHeart, MapPin, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useSession } from "@/hooks/use-session";
import { BrandLogo } from "@/components/brand-logo";
import { HomeActivePlan } from "@/components/plan-summary-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SplitEasy | Plan, Go & Share" },
      { name: "description", content: "Organiza planes en grupo, guarda lugares y reparte gastos sin complicaciones." },
      { property: "og:title", content: "SplitEasy | Plan, Go & Share" },
      { property: "og:description", content: "Organiza planes en grupo, guarda lugares y reparte gastos sin complicaciones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const { session } = useSession();
  const pillars = [
    { icon: CalendarHeart, title: t("home.plan"), text: t("home.planText"), search: {} },
    { icon: MapPin, title: t("home.go"), text: t("home.goText"), search: { go: "places" as const } },
    { icon: Receipt, title: t("home.share"), text: t("home.shareText"), search: { go: "expenses" as const } },
  ];
  return (
    <main>
      <section className="bg-hero">
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
          <div className="mb-8 flex justify-center"><BrandLogo className="h-20 sm:h-28" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t("home.eyebrow")}</p>
          <h1 className="mx-auto mt-4 max-w-2xl text-[clamp(2.5rem,6vw,4.75rem)] font-bold leading-[1.02]">{t("home.title")}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{t("home.subtitle")}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to={session ? "/app" : "/auth"}>{session ? t("home.ctaSignedIn") : t("home.cta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link to="/demo">{t("home.demo")}</Link>
            </Button>
          </div>
        </div>
      </section>
      {session && <HomeActivePlan />}
      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-20 pt-4 sm:grid-cols-3">
        {pillars.map(({ icon: Icon, title, text, search }) => (
          <Link
            key={title}
            to="/app"
            search={search}
            className="group block cursor-pointer motion-lift rounded-3xl border border-border bg-surface-1 p-6 shadow-elevation-1 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevation-2 hover:border-primary/60 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-3"><Icon className="size-5 text-accent" aria-hidden /></span>
            <h2 className="mt-5 text-2xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              {t("home.cardOpen")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1" aria-hidden />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
