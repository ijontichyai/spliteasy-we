import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const myProfileQuery = () =>
  queryOptions({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, locale")
        .eq("id", u.user.id)
        .single();
      if (error) throw error;
      return { ...data, email: u.user.email ?? "" };
    },
  });

export const freeLimitsQuery = () =>
  queryOptions({
    queryKey: ["plan_limits", "free"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_limits")
        .select("max_active_owned_plans, max_members_per_plan")
        .eq("tier", "free")
        .single();
      if (error) throw error;
      return data;
    },
  });
