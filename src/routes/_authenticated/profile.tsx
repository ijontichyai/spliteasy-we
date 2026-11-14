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
      <Button asChild variant="outline" className="mt-4"><Link to="/support">{t("support.title")}</Link></Button>
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
