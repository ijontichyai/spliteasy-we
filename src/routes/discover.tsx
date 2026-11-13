import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { SceneIllustration, type Scene } from "@/components/discover/illustration";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Descubre | SplitEasy" },
      { name: "description", content: "Ideas para tu próximo plan en grupo: calas, mercados, miradores y cenas." },
      { property: "og:title", content: "Descubre | SplitEasy" },
      { property: "og:description", content: "Ideas para tu próximo plan en grupo: calas, mercados, miradores y cenas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Discover,
});

const CARDS: { scene: Scene; n: 1 | 2 | 3 | 4 }[] = [
  { scene: "cove", n: 1 },
  { scene: "market", n: 2 },
  { scene: "viewpoint", n: 3 },
  { scene: "dinner", n: 4 },
];

function Discover() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t("home.eyebrow")}</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t("discover.title")}</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">{t("discover.subtitle")}</p>
      <p role="note" className="mt-5 flex items-start gap-2 rounded-2xl border border-border bg-surface-3 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        {t("discover.illustrativeNote")}
      </p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {CARDS.map(({ scene, n }) => (
          <li key={scene} className="overflow-hidden rounded-3xl border border-border bg-surface-1 shadow-elevation-1">
            <div className="relative aspect-[16/10]">
              <SceneIllustration scene={scene} />
              <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-elevation-1">
                {t("discover.illustrative")}
              </span>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold">{t(`discover.c${n}` as MessageKey)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`discover.c${n}t` as MessageKey)}</p>
              {/* Reserved for Places UI Kit (ADR-003): nothing of ours is drawn over Google's card. */}
              <div data-google-slot className="mt-4 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                {t("discover.googleSlot")}
              </div>
              <Link
                to="/app"
                search={{ go: "places" }}
                className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("discover.use")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
