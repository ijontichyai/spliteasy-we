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
