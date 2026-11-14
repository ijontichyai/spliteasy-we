import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export const Route = createFileRoute("/_authenticated/checkout/return")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } =>
    typeof s["session_id"] === "string" ? { session_id: s["session_id"] } : {},
  head: () => ({
    meta: [
      { title: "Pago recibido | SplitEasy" },
      { name: "description", content: "Tu pago de SplitEasy Premium se está confirmando." },
      { property: "og:title", content: "Pago recibido | SplitEasy" },
      { property: "og:description", content: "Tu pago de SplitEasy Premium se está confirmando." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => {
    const { t } = useI18n();
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">{t("billing.successTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("billing.successBody")}</p>
        <Button asChild className="mt-6"><Link to="/premium">{t("billing.title")}</Link></Button>
      </main>
    );
  },
});
