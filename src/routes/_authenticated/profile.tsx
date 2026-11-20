import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { myProfileQuery } from "@/lib/profile";
import { PageError, PagePending } from "@/components/route-states";
import { useNavigate } from "@tanstack/react-router";
import { Globe, LogOut, Sun, LifeBuoy, Crown, ChevronRight } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LocaleSwitch } from "@/components/site-header";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Tu perfil | SplitEasy" },
      { name: "description", content: "Edita tu nombre e idioma en SplitEasy." },
      { property: "og:title", content: "Tu perfil | SplitEasy" },
      { property: "og:description", content: "Edita tu nombre e idioma en SplitEasy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myProfileQuery()),
  pendingMs: 0,
  pendingComponent: PagePending,
  errorComponent: PageError,
  notFoundComponent: () => <p className="p-8">404</p>,
  component: ProfilePage,
});

function ProfilePage() {
  const { t, setLocale } = useI18n();
  const qc = useQueryClient();
  const { data: profile } = useSuspenseQuery(myProfileQuery());
  const [name, setName] = useState(profile.display_name);
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [lang, setLang] = useState<Locale>(isLocale(profile.locale) ? profile.locale : "es");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim(), avatar_url: avatar.trim() || null, locale: lang })
      .eq("id", profile.id);
    setBusy(false);
    if (error) return void toast.error(t("auth.errorGeneric"));
    setLocale(lang);
    await qc.invalidateQueries({ queryKey: ["profile", "me"] });
    toast.success(t("profile.saved"));
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
      <div className="mt-6 flex flex-col items-center text-center">
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt="" className="size-24 rounded-full object-cover ring-4 ring-surface-3" />
          : <span aria-hidden className="flex size-24 items-center justify-center rounded-full bg-surface-3 text-3xl font-bold text-primary">{initials(profile.display_name)}</span>}
        <p className="mt-3 text-2xl font-bold">{profile.display_name}</p>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>
      <h2 className="sr-only">{t("profile.settings")}</h2>
      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface-1 shadow-elevation-1">
        <li className="flex min-h-14 items-center gap-3 px-5"><Globe className="size-5 text-muted-foreground" aria-hidden /><span className="flex-1 font-medium">{t("profile.language")}</span><LocaleSwitch /></li>
        <li className="flex min-h-14 items-center gap-3 px-5"><Sun className="size-5 text-muted-foreground" aria-hidden /><span className="flex-1 font-medium">{t("profile.appearance")}</span><ThemeSwitcher /></li>
        <li><Link to="/premium" className="flex min-h-14 items-center gap-3 px-5 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Crown className="size-5 text-muted-foreground" aria-hidden /><span className="flex-1 font-medium">{t("billing.title")}</span><ChevronRight className="size-4" aria-hidden /></Link></li>
        <li><Link to="/support" className="flex min-h-14 items-center gap-3 px-5 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LifeBuoy className="size-5 text-muted-foreground" aria-hidden /><span className="flex-1 font-medium">{t("support.title")}</span><ChevronRight className="size-4" aria-hidden /></Link></li>
      </ul>
      <button type="button" onClick={signOut} className="mt-4 flex min-h-14 w-full items-center gap-3 rounded-3xl border border-border bg-surface-1 px-5 font-semibold text-destructive hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <LogOut className="size-5" aria-hidden />{t("nav.signOut")}
      </button>
      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label>{t("profile.email")}</Label>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("profile.displayName")}</Label>
          <Input id="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="avatar">{t("profile.avatar")}</Label>
          <Input id="avatar" type="url" pattern="https://.*" placeholder="https://" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lang">{t("profile.language")}</Label>
          <select
            id="lang" value={lang} onChange={(e) => isLocale(e.target.value) && setLang(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {LOCALES.map((l) => <option key={l} value={l}>{t(`lang.${l}`)}</option>)}
          </select>
        </div>
        <Button type="submit" disabled={busy}>{t("profile.save")}</Button>
      </form>
    </main>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}
