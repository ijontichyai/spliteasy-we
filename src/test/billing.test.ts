import { describe, expect, it } from "vitest";
import { PREMIUM_PLANS, isPremiumActive, isPremiumPriceId, checkoutSessionParams, safeOrigin, checkoutReturnUrl, portalReturnUrl } from "@/lib/billing";

const now = new Date("2026-11-14T12:00:00Z");
describe("billing rules", () => {
  it("prices are 1.49/3.99/29.99 EUR per week/month/year", () => {
    expect(PREMIUM_PLANS.map((p) => [p.cents, p.interval])).toEqual([[149, "week"], [399, "month"], [2999, "year"]]);
  });
  it("cancelled renewal keeps Premium until period end", () => {
    expect(isPremiumActive({ status: "active", price_id: "premium_monthly", cancel_at_period_end: true, current_period_end: "2026-11-20T00:00:00Z" }, now)).toBe(true);
    expect(isPremiumActive({ status: "canceled", price_id: "premium_monthly", cancel_at_period_end: true, current_period_end: "2026-11-13T00:00:00Z" }, now)).toBe(false);
  });
  it("unpaid/incomplete never grants Premium", () => {
    expect(isPremiumActive({ status: "incomplete", price_id: "premium_weekly", cancel_at_period_end: false, current_period_end: "2027-01-01T00:00:00Z" }, now)).toBe(false);
    expect(isPremiumActive(null, now)).toBe(false);
  });
  it("only the three plans are purchasable", () => {
    expect(isPremiumPriceId("premium_annual")).toBe(true);
    expect(isPremiumPriceId("free_forever")).toBe(false);
  });
});

describe("checkout sin recargos", () => {
  it("no activa gestión integral ni impuestos automáticos", () => {
    const p = checkoutSessionParams({ stripePriceId: "price_x", returnUrl: "https://x", customerId: "cus", userId: "u" }) as Record<string, unknown>;
    expect(p["managed_payments"]).toBeUndefined();
    expect(p["automatic_tax"]).toBeUndefined();
  });
});

describe("Stripe return destinations", () => {
  it("checkout returns only to SplitEasy's confirmation page", () => {
    expect(checkoutReturnUrl(safeOrigin("https://evil.example"))).toBe("https://spliteasy-we.lovable.app/checkout/return?session_id={CHECKOUT_SESSION_ID}");
    expect(checkoutReturnUrl(safeOrigin("https://spliteasy-we.lovable.app.evil.com"))).toBe("https://spliteasy-we.lovable.app/checkout/return?session_id={CHECKOUT_SESSION_ID}");
    expect(checkoutReturnUrl(safeOrigin("https://spliteasy-we.lovable.app"))).toBe("https://spliteasy-we.lovable.app/checkout/return?session_id={CHECKOUT_SESSION_ID}");
  });
  it("subscription management returns only to SplitEasy's Premium page", () => {
    expect(portalReturnUrl(safeOrigin("https://evil.example"))).toBe("https://spliteasy-we.lovable.app/premium");
    expect(portalReturnUrl(safeOrigin(undefined))).toBe("https://spliteasy-we.lovable.app/premium");
    expect(portalReturnUrl(safeOrigin("http://localhost:8080"))).toBe("http://localhost:8080/premium");
  });
});
