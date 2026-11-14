import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isPremiumPriceId, checkoutSessionParams, safeOrigin, checkoutReturnUrl, portalReturnUrl, type SubscriptionRow } from "./billing";

async function trustedOrigin(): Promise<string> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const origin = getRequestHeader("origin") ?? "";
  return safeOrigin(origin);
}
async function trustedReturnUrl(): Promise<string> {
  return checkoutReturnUrl(await trustedOrigin());
}

type Env = "sandbox" | "live";
const envOk = (e: unknown): e is Env => e === "sandbox" || e === "live";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { priceId: string; returnUrl?: string; environment: Env }) => {
    if (!isPremiumPriceId(d.priceId)) throw new Error("Invalid plan");
    if (!envOk(d.environment)) throw new Error("Invalid environment");
    return { priceId: d.priceId, environment: d.environment };
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    const { createStripeClient, getStripeErrorMessage } = await import("./stripe.server");
    try {
      const { userId, supabase } = context;
      // Block a second active subscription.
      const { data: existing } = await supabase.from("subscriptions").select("status,current_period_end")
        .eq("user_id", userId).eq("environment", data.environment)
        .in("status", ["active", "trialing", "past_due"]).gt("current_period_end", new Date().toISOString()).limit(1);
      if (existing?.length) return { error: "ALREADY_SUBSCRIBED" };
      const { data: { user } } = await supabase.auth.getUser();
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const price = prices.data[0];
      if (!price) return { error: "Price not found" };

      let customerId: string | undefined;
      if (!/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error("Invalid userId");
      const found = await stripe.customers.search({ query: `metadata['userId']:'${userId}'`, limit: 1 });
      customerId = found.data[0]?.id;
      if (!customerId && user?.email) {
        const byEmail = await stripe.customers.list({ email: user.email, limit: 1 });
        const c = byEmail.data[0];
        if (c) {
          if (c.metadata?.["userId"] !== userId) await stripe.customers.update(c.id, { metadata: { ...c.metadata, userId } });
          customerId = c.id;
        }
      }
      if (!customerId) {
        customerId = (await stripe.customers.create({ ...(user?.email ? { email: user.email } : {}), metadata: { userId } })).id;
      }

      const session = await stripe.checkout.sessions.create(
        checkoutSessionParams({ stripePriceId: price.id, returnUrl: await trustedReturnUrl(), customerId, userId }),
      );
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const getMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: Env }) => { if (!envOk(d.environment)) throw new Error("Invalid environment"); return d; })
  .handler(async ({ data, context }): Promise<SubscriptionRow | null> => {
    const { data: row } = await context.supabase.from("subscriptions")
      .select("status,price_id,current_period_end,cancel_at_period_end")
      .eq("user_id", context.userId).eq("environment", data.environment)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return row ?? null;
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { returnUrl?: string; environment: Env }) => {
    if (!envOk(d.environment)) throw new Error("Invalid input");
    return { environment: d.environment };
  })
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { createStripeClient, getStripeErrorMessage } = await import("./stripe.server");
    const { data: sub } = await context.supabase.from("subscriptions").select("stripe_customer_id")
      .eq("user_id", context.userId).eq("environment", data.environment)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "NO_SUBSCRIPTION" };
    try {
      const portal = await createStripeClient(data.environment).billingPortal.sessions.create({
        customer: sub.stripe_customer_id, return_url: portalReturnUrl(await trustedOrigin()),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
