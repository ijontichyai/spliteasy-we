import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      // Remember where the user was going so sign-in can continue there.
      sessionStorage.setItem("spliteasy.afterLogin", location.href);
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
