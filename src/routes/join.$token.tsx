import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth-card";
import { useI18n } from "@/lib/i18n/context";
import { useSession } from "@/hooks/use-session";
import { errorKey } from "@/lib/errors";

export const PENDING_JOIN_KEY = "spliteasy.pendingJoin";

export const Route = createFileRoute("/join/$token")({
  head: () => ({
    meta: [
      { title: "Únete al plan | SplitEasy" },
      { name: "description", content: "Te han invitado a un plan compartido en SplitEasy." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Únete al plan | SplitEasy" },
      { property: "og:description", content: "Te han invitado a un plan compartido en SplitEasy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { token } = Route.useParams();
  const { t } = useI18n();
  const { session, ready } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("accept_invitation", { _token: token });
    setBusy(false);
    if (error) return void toast.error(t(errorKey(error)));
    toast.success(t("join.done"));
    navigate({ to: "/plans/$planId", params: { planId: data as unknown as string } });
  };

  return (
    <AuthCard title={t("join.title")}>
      <p className="text-muted-foreground">{t("join.text")}</p>
      <div className="mt-6">
        {!ready ? null : session ? (
          <Button className="w-full" onClick={accept} disabled={busy}>{t("join.accept")}</Button>
        ) : (
          <Button asChild className="w-full">
            <Link to="/auth" onClick={() => sessionStorage.setItem(PENDING_JOIN_KEY, token)}>{t("join.signIn")}</Link>
          </Button>
        )}
      </div>
    </AuthCard>
  );
}
