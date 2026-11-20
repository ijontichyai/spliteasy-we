import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { INSPIRATION_PHOTOS } from "@/components/discover/inspiration-photos";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { PlaceSearch } from "@/components/discover/place-search";

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

function Discover() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t("home.eyebrow")}</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t("discover.title")}</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">{t("discover.subtitle")}</p>
      <PlaceSearch />
      <h2 className="mt-10 text-2xl font-bold">{t("discover.ideas")}</h2>
      <p role="note" className="mt-5 flex items-start gap-2 rounded-2xl border border-border bg-surface-3 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        {t("discover.inspirationNote")}
      </p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {INSPIRATION_PHOTOS.map(({ n, image, small, photographer, source }) => (
          <li key={n} className="group overflow-hidden rounded-3xl border border-border bg-surface-1 shadow-elevation-1">
            <div className="relative aspect-[16/10] overflow-hidden bg-surface-3">
              <span className="absolute right-3 top-3 z-10 rounded-full bg-surface-1/90 px-2.5 py-0.5 text-[11px] font-medium text-foreground">{t("discover.illustrative")}</span>
              <img
                src={image.url}
                srcSet={`${small.url} 600w, ${image.url} 1200w`}
                sizes="(min-width: 1024px) 480px, (min-width: 640px) calc((100vw - 52px) / 2), calc(100vw - 32px)"
                alt={t(`discover.photo${n}` as MessageKey)}
                width={1200}
                height={750}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold">{t(`discover.c${n}` as MessageKey)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`discover.c${n}t` as MessageKey)}</p>
              {/* Reserved for Places UI Kit (ADR-003): nothing of ours is drawn over Google's card. */}
              <div data-google-slot />
              <Link
                to="/app"
                search={{ go: "places" }}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("discover.use")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {t("discover.photoCredit")} {" "}
                <a href={source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {photographer} · Pexels
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
