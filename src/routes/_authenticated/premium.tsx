import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { useI18n } from "@/lib/i18n/context";
import { PREMIUM_PLANS, isPremiumActive, type PremiumPriceId } from "@/lib/billing";
import { createCheckoutSession, createPortalSession, getMySubscription } from "@/lib/billing.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({
    meta: [
      { title: "Premium | SplitEasy" },
      { name: "description", content: "Elige tu plan Premium de SplitEasy: semanal, mensual o anual." },
      { property: "og:title", content: "Premium | SplitEasy" },
      { property: "og:description", content: "Elige tu plan Premium de SplitEasy: semanal, mensual o anual." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PremiumPage,
});

const euro = (cents: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);

function PremiumPage() {
  const { t, locale } = useI18n();
  const getSub = useServerFn(getMySubscription);
  const startCheckout = useServerFn(createCheckoutSession);
  const openPortal = useServerFn(createPortalSession);
  const [selected, setSelected] = useState<PremiumPriceId | null>(null);
  const env = getStripeEnvironment();
  const { data: sub } = useQuery({
    queryKey: ["subscription", env],
    queryFn: () => getSub({ data: { environment: env } }),
    refetchInterval: 5000,
  });
  const active = isPremiumActive(sub ?? null);
  const plan = PREMIUM_PLANS.find((p) => p.priceId === sub?.price_id);

  const fetchClientSecret = useCallback(async () => {
    if (!selected) throw new Error("No plan");
    const r = await startCheckout({ data: {
      priceId: selected, environment: env,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    } });
    if ("error" in r) {
      toast.error(r.error === "ALREADY_SUBSCRIBED" ? t("billing.already") : r.error);
      throw new Error(r.error);
    }
    return r.clientSecret;
  }, [selected, env, startCheckout, t]);

  async function manage() {
    const r = await openPortal({ data: { environment: env, returnUrl: window.location.href } });
    if ("error" in r) return void toast.error(r.error);
    window.open(r.url, "_blank", "noopener");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PaymentTestModeBanner />
      <h1 className="text-3xl font-bold">{t("billing.title")}</h1>

      <section aria-live="polite" className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-semibold">{t("billing.status")}</h2>
        {active && sub ? (
          <div className="mt-2 space-y-1 text-sm">
            <p>{t("billing.activeOn")} <strong>{plan?.name ?? sub.price_id}</strong></p>
            <p className="text-muted-foreground">
              {sub.cancel_at_period_end || sub.status === "canceled" ? t("billing.endsOn") : t("billing.renewsOn")}{" "}
              {new Date(sub.current_period_end!).toLocaleDateString(locale)}
            </p>
            {sub.status === "past_due" && <p className="text-destructive">{t("billing.pastDue")}</p>}
            <Button variant="outline" className="mt-3" onClick={manage}>{t("billing.manage")}</Button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("billing.free")}</p>
        )}
      </section>

      {!active && !selected && (
        <Carousel opts={{ align: "start" }} className="mx-10">
          <CarouselContent>
            {PREMIUM_PLANS.map((p) => (
              <CarouselItem key={p.priceId} className="sm:basis-1/2 lg:basis-1/3">
                <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-3 text-3xl font-bold tabular-nums">{euro(p.cents, locale)}</p>
                  <p className="text-sm text-muted-foreground">{t(`billing.per.${p.interval}`)}</p>
                  <p className="mt-3 flex-1 text-sm">{t("billing.upfront")}</p>
                  <Button className="mt-5" onClick={() => setSelected(p.priceId)}>{t("billing.choose")}</Button>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}

      {selected && !active && (
        <section className="space-y-3">
          <div className="rounded-3xl border border-border bg-card p-2">
            <EmbeddedCheckoutProvider key={selected} stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
          <Button asChild variant="ghost"><Link to="/checkout/cancel">{t("billing.cancelCheckout")}</Link></Button>
        </section>
      )}
    </main>
  );
}
