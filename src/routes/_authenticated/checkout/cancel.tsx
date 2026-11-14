import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export const Route = createFileRoute("/_authenticated/checkout/cancel")({
  head: () => ({
    meta: [
      { title: "Pago cancelado | SplitEasy" },
      { name: "description", content: "No se ha realizado ningún cargo. Puedes volver a elegir plan." },
      { property: "og:title", content: "Pago cancelado | SplitEasy" },
      { property: "og:description", content: "No se ha realizado ningún cargo. Puedes volver a elegir plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => {
    const { t } = useI18n();
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">{t("billing.cancelTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("billing.cancelBody")}</p>
        <Button asChild className="mt-6"><Link to="/premium">{t("billing.title")}</Link></Button>
      </main>
    );
  },
});
