import { useI18n } from "@/lib/i18n/context";

const clientToken = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

export function PaymentTestModeBanner() {
  const { t } = useI18n();
  if (clientToken?.startsWith("pk_live_")) return null;
  return (
    <div role="note" className="w-full rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-center text-sm text-foreground">
      {clientToken ? t("billing.testMode") : t("billing.notConfigured")}
    </div>
  );
}
