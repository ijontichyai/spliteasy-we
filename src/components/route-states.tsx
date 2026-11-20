import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

/** Shown immediately while a page loads (also SSR fallback for client-only private pages). */
export function PagePending() {
  const { t } = useI18n();
  return (
    <main aria-busy className="mx-auto max-w-xl px-4 py-10">
      <span className="sr-only" role="status">{t("common.loading")}</span>
      <div className="h-9 w-40 animate-pulse rounded-lg bg-surface-3" />
      <div className="mx-auto mt-8 size-24 animate-pulse rounded-full bg-surface-3" />
      <div className="mt-8 h-56 animate-pulse rounded-3xl bg-surface-3" />
    </main>
  );
}

export function PageError({ reset }: ErrorComponentProps) {
  const { t } = useI18n();
  const router = useRouter();
  const qReset = useQueryErrorResetBoundary();
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p role="alert" className="text-destructive">{t("common.loadError")}</p>
      <Button className="mt-4 rounded-full" onClick={() => { qReset.reset(); reset(); void router.invalidate(); }}>{t("common.retry")}</Button>
    </main>
  );
}
