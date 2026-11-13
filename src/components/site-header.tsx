import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function SiteHeader() {
  const { session } = useSession();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const onAuth = useLocation({ select: (l) => l.pathname === "/auth" });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 shadow-elevation-1 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-primary">SplitEasy</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">{t("brand.tagline")}</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <LocaleSwitch />
            <ThemeSwitcher />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 sm:hidden" aria-label={t("nav.settings")}>
                <Settings2 aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-auto flex-col items-start gap-3 shadow-elevation-3">
              <LocaleSwitch />
              <ThemeSwitcher />
            </PopoverContent>
          </Popover>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/discover">{t("nav.discover")}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/demo">{t("nav.demo")}</Link>
          </Button>
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/app">{t("nav.myPlans")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/profile">{t("nav.profile")}</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                {t("nav.signOut")}
              </Button>
            </>
          ) : onAuth ? null : (
            <Button asChild size="sm">
              <Link to="/auth">{t("nav.signIn")}</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

function LocaleSwitch() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div className="flex rounded-full border border-border p-0.5 text-xs" role="group" aria-label={t("profile.language")}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2.5 py-1 font-medium uppercase transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
