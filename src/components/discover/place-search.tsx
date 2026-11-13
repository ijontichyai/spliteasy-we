import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { getMapsBrowserKey } from "@/lib/maps.functions";

/* eslint-disable @typescript-eslint/no-explicit-any */
let loader: Promise<void> | null = null;
function loadMaps(key: string, lang: string): Promise<void> {
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const w = window as any;
    w.__speMapsReady = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&v=weekly&language=${lang}&region=ES&callback=__speMapsReady`;
    s.async = true;
    s.onerror = () => { loader = null; reject(new Error("maps")); };
    document.head.appendChild(s);
  });
  return loader;
}

/** Places UI Kit Essentials only: basic autocomplete + place details (ADR-003). */
export function PlaceSearch() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const acHost = useRef<HTMLDivElement>(null);
  const detailsHost = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [place, setPlace] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { key } = await getMapsBrowserKey();
        if (!key) throw new Error("no key");
        await loadMaps(key, locale);
        const g = (window as any).google;
        await g.maps.importLibrary("places");
        if (cancelled || !acHost.current) return;
        acHost.current.innerHTML = "";
        const ac = document.createElement("gmp-basic-place-autocomplete") as any;
        ac.style.width = "100%";
        ac.addEventListener("gmp-select", (e: any) => {
          const id = e.place?.id;
          if (!id || !detailsHost.current) return;
          setPlace({ id, name: "" });
          detailsHost.current.innerHTML = "";
          const det = document.createElement("gmp-place-details") as any;
          const req = document.createElement("gmp-place-details-place-request") as any;
          req.setAttribute("place", id);
          det.appendChild(req);
          det.appendChild(document.createElement("gmp-place-all-content"));
          det.addEventListener("gmp-load", () => {
            const name = det.place?.displayName ?? "";
            setPlace((p) => (p && p.id === id ? { id, name } : p));
          });
          det.addEventListener("gmp-error", () => setState("error"));
          detailsHost.current.appendChild(det);
        });
        ac.addEventListener("gmp-error", () => setState("error"));
        acHost.current.appendChild(ac);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [locale]);

  return (
    <section aria-labelledby="ps-title" className="mt-6 rounded-3xl border border-border bg-surface-1 p-5 shadow-elevation-1">
      <h2 id="ps-title" className="text-xl font-bold">{t("discover.searchTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("discover.searchHint")}</p>
      {state === "loading" && <p className="mt-4 text-sm text-muted-foreground" role="status">{t("discover.loading")}</p>}
      {state === "error" && <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground" role="alert">{t("discover.error")}</p>}
      <div ref={acHost} className="mt-4" />
      <div ref={detailsHost} data-google-slot className="mt-4 overflow-hidden rounded-2xl" />
      {place && state !== "error" && (
        <Button
          className="mt-4 h-11 rounded-full bg-premium px-6"
          onClick={() => navigate({ to: "/app", search: { new: true, placeId: place.id, ...(place.name ? { placeName: place.name } : {}) } })}
        >
          <Plus className="size-4" />{t("discover.createPlan")}
        </Button>
      )}
    </section>
  );
}
