import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth-card";
import { useI18n } from "@/lib/i18n/context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | SplitEasy" },
      { name: "description", content: "Inicia sesión o crea tu cuenta de SplitEasy." },
      { property: "og:title", content: "Entrar | SplitEasy" },
      { property: "og:description", content: "Inicia sesión o crea tu cuenta de SplitEasy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return void toast.error(t("auth.errorCredentials"));
        navigate({ to: "/app" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim(), locale } },
        });
        if (error) return void toast.error(error.code === "weak_password" ? t("auth.errorWeakPassword") : t("auth.errorGeneric"));
        setNotice(t("auth.checkEmail"));
      } else {
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        setNotice(t("auth.resetSent"));
      }
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? t("auth.signInTitle") : mode === "signup" ? t("auth.signUpTitle") : t("auth.forgotTitle");

  return (
    <AuthCard title={title}>
      {notice ? (
        <div className="space-y-4">
          <p role="status" className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">{notice}</p>
          <Button variant="outline" className="w-full" onClick={() => { setNotice(null); setMode("signin"); }}>
            {t("auth.back")}
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("auth.displayName")}</Label>
              <Input id="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password" type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              {mode === "signup" && <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "signin" ? t("auth.signIn") : mode === "signup" ? t("auth.signUp") : t("auth.forgotSend")}
          </Button>
          <div className="flex flex-col items-center gap-2 pt-2 text-sm">
            {mode === "signin" && (
              <>
                <button type="button" className="text-primary hover:underline" onClick={() => setMode("signup")}>{t("auth.toSignUp")}</button>
                <button type="button" className="text-muted-foreground hover:underline" onClick={() => setMode("forgot")}>{t("auth.forgot")}</button>
              </>
            )}
            {mode !== "signin" && (
              <button type="button" className="text-primary hover:underline" onClick={() => setMode("signin")}>{t("auth.toSignIn")}</button>
            )}
          </div>
        </form>
      )}
    </AuthCard>
  );
}
