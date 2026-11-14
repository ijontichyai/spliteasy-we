/** Premium plans (BILLING-001). Price IDs are the Stripe lookup keys. */
export const PREMIUM_PLANS = [
  { priceId: "premium_weekly", name: "Weekly Explorer", cents: 149, interval: "week" },
  { priceId: "premium_monthly", name: "Monthly Adventurer", cents: 399, interval: "month" },
  { priceId: "premium_annual", name: "Annual Voyager", cents: 2999, interval: "year" },
] as const;
export type PremiumPriceId = (typeof PREMIUM_PLANS)[number]["priceId"];
export const isPremiumPriceId = (v: string): v is PremiumPriceId =>
  PREMIUM_PLANS.some((p) => p.priceId === v);

export interface SubscriptionRow {
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/** Premium stays until the paid period ends, even after cancelling renewal. */
export function isPremiumActive(sub: SubscriptionRow | null, now = new Date()): boolean {
  if (!sub?.current_period_end) return false;
  if (!["active", "trialing", "past_due", "canceled"].includes(sub.status)) return false;
  return new Date(sub.current_period_end) > now;
}

/** Checkout session body. Prices are final consumer amounts (VAT included):
 * no managed payments and no automatic tax, so nothing is added at checkout. */
export function checkoutSessionParams(o: { stripePriceId: string; returnUrl: string; customerId: string; userId: string }) {
  return {
    line_items: [{ price: o.stripePriceId, quantity: 1 }],
    mode: "subscription" as const,
    ui_mode: "embedded_page" as const,
    return_url: o.returnUrl,
    customer: o.customerId,
    metadata: { userId: o.userId },
    subscription_data: { metadata: { userId: o.userId } },
  };
}

const TRUSTED_ORIGINS = [/^https:\/\/spliteasy-we\.lovable\.app$/, /^https:\/\/[a-z0-9-]+--306db1f6-82ab-49c3-a246-dc7ba7faa244\.lovable\.app$/, /^https:\/\/306db1f6-82ab-49c3-a246-dc7ba7faa244\.lovableproject\.com$/, /^http:\/\/localhost(:\d+)?$/];
export const DEFAULT_ORIGIN = "https://spliteasy-we.lovable.app";
/** Only SplitEasy's own origins; anything else falls back to the published domain. */
export const safeOrigin = (origin: string | undefined): string =>
  origin && TRUSTED_ORIGINS.some((r) => r.test(origin)) ? origin : DEFAULT_ORIGIN;
export const checkoutReturnUrl = (origin: string) => `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
export const portalReturnUrl = (origin: string) => `${origin}/premium`;
