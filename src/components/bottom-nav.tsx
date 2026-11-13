import { Link } from "@tanstack/react-router";
import { Compass, Home, LayoutList, Plus, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const item =
  "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium text-muted-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:text-primary";

// Mobile-only bottom bar (hidden from sm up). The root layout reserves pb-safe-nav so it never covers content.
export function BottomNav() {
  const { t } = useI18n();
  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-1/95 pb-[env(safe-area-inset-bottom)] shadow-elevation-3 backdrop-blur sm:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-center gap-1 px-2">
        <Link to="/" className={item} activeOptions={{ exact: true }}>
          <Home className="size-5" aria-hidden />
          {t("nav.home")}
        </Link>
        <Link to="/discover" className={item}>
          <Compass className="size-5" aria-hidden />
          {t("nav.discover")}
        </Link>
        <div className="flex flex-1 justify-center">
          <Link
            to="/app"
            search={{ new: true }}
            aria-label={t("nav.newPlan")}
            className="-mt-7 flex size-14 items-center justify-center rounded-full bg-premium text-primary-foreground shadow-elevation-2 ring-4 ring-background transition-transform duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-ring"
          >
            <Plus className="size-6" aria-hidden />
          </Link>
        </div>
        <Link to="/app" className={item} activeOptions={{ includeSearch: false }}>
          <LayoutList className="size-5" aria-hidden />
          {t("nav.plans")}
        </Link>
        <Link to="/profile" className={item}>
          <UserRound className="size-5" aria-hidden />
          {t("nav.profile")}
        </Link>
      </div>
    </nav>
  );
}
