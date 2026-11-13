import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { freeLimitsQuery, myProfileQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Mis planes | SplitEasy" },
      { name: "description", content: "Tus planes compartidos en SplitEasy." },
      { property: "og:title", content: "Mis planes | SplitEasy" },
      { property: "og:description", content: "Tus planes compartidos en SplitEasy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(myProfileQuery()),
      context.queryClient.ensureQueryData(freeLimitsQuery()),
    ]),
  component: AppHome,
});

function AppHome() {
  const { t } = useI18n();
  const { data: profile } = useSuspenseQuery(myProfileQuery());
  const { data: limits } = useSuspenseQuery(freeLimitsQuery());
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm text-muted-foreground">{t("app.hello", { name: profile.display_name })}</p>
      <h1 className="mt-1 text-3xl font-bold">{t("app.title")}</h1>
      <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <Compass className="size-10 text-accent" aria-hidden />
        <p className="mt-4 max-w-sm text-muted-foreground">{t("app.empty")}</p>
        <p className="mt-6 rounded-full bg-secondary px-4 py-1.5 text-xs text-secondary-foreground">
          {t("app.freeLimits", { plans: limits.max_active_owned_plans ?? "∞", members: limits.max_members_per_plan ?? "∞" })}
        </p>
      </div>
    </main>
  );
}
