import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarHeart, MapPin, Receipt } from "lucide-react";
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
    { icon: CalendarHeart, title: t("home.plan"), text: t("home.planText") },
    { icon: MapPin, title: t("home.go"), text: t("home.goText") },
    { icon: Receipt, title: t("home.share"), text: t("home.shareText") },
  ];
  return (
    <main>
      <section className="bg-hero">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:pt-24">
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] sm:text-6xl">{t("home.title")}</h1>
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
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-14 sm:grid-cols-3">
        {pillars.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <Icon className="size-6 text-accent" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
