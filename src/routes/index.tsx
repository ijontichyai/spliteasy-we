import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarHeart, MapPin, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useSession } from "@/hooks/use-session";

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
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t("home.eyebrow")}</p>
          <h1 className="mt-3 max-w-3xl text-[clamp(2.5rem,6vw,4.75rem)] font-bold leading-[1.02]">{t("home.title")}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("home.subtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to={session ? "/app" : "/auth"}>{session ? t("home.ctaSignedIn") : t("home.cta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link to="/demo">{t("home.demo")}</Link>
            </Button>
          </div>
          </div>
          <ProductMock />
        </div>
      </section>
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

// Illustrative product preview built with tokens only (no imagery); figures are static sample values.
function ProductMock() {
  const { t } = useI18n();
  const people = [
    { n: "AN", v: "+86,67", pos: true },
    { n: "BR", v: "−23,33", pos: false },
    { n: "CA", v: "−33,34", pos: false },
    { n: "DI", v: "−30,00", pos: false },
  ];
  return (
    <div aria-label={t("home.mockLabel")} role="img" className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-premium opacity-20 blur-2xl" />
      <div className="rounded-[2rem] border border-border bg-surface-1 p-5 shadow-elevation-3">
        <div className="rounded-2xl bg-premium p-5 text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{t("type.getaway")}</p>
          <p className="mt-1 font-display text-2xl font-bold">{t("home.mockPlan")}</p>
          <p className="mt-4 text-xs opacity-80">{t("home.mockSpent")}</p>
          <p className="money font-display text-3xl font-bold">420,00 €<span className="ml-2 text-sm font-medium opacity-80">{t("home.mockOf", { total: "600 €" })}</span></p>
          <div className="mt-3 h-2 rounded-full bg-primary-foreground/25"><div className="h-2 w-[70%] rounded-full bg-primary-foreground" /></div>
        </div>
        <ul className="mt-4 space-y-2">
          {people.map((p) => (
            <li key={p.n} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-surface-3 text-xs font-bold">{p.n}</span>
              <span className="h-1.5 flex-1 rounded-full bg-surface-3">
                <span className={`block h-1.5 rounded-full ${p.pos ? "w-4/5 bg-primary" : "w-1/4 bg-accent"}`} />
              </span>
              <span className={`money w-16 text-right text-sm font-semibold ${p.pos ? "text-primary" : "text-foreground"}`}>{p.v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs font-semibold text-muted-foreground">✓ {t("home.mockSettled")}</p>
      </div>
    </div>
  );
}
