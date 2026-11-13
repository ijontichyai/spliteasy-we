import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth-card";
import { useI18n } from "@/lib/i18n/context";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña | SplitEasy" },
      { name: "description", content: "Elige una nueva contraseña para tu cuenta de SplitEasy." },
      { property: "og:title", content: "Nueva contraseña | SplitEasy" },
      { property: "og:description", content: "Elige una nueva contraseña para tu cuenta de SplitEasy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session && isRecovery) setReady(true);
      else if (!isRecovery) setInvalid(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return void toast.error(error.code === "weak_password" ? t("auth.errorWeakPassword") : t("auth.errorGeneric"));
    toast.success(t("reset.done"));
    navigate({ to: "/app" });
  }

  return (
    <AuthCard title={t("reset.title")}>
      {invalid && !ready ? (
        <p className="text-sm text-muted-foreground">{t("reset.invalid")}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
          </div>
          <Button type="submit" className="w-full" disabled={busy || !ready}>{t("reset.save")}</Button>
        </form>
      )}
    </AuthCard>
  );
}
