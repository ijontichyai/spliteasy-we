import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supportInput, type SupportResult } from "./support-schema";

export const supportPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(supportInput)
  .handler(async ({ data, context }): Promise<SupportResult> => {
    const { data: result, error } = await context.supabase.rpc("support_portal", {
      _action: data.action, _id: data.id, _target: data.target ?? "account",
      _plan: data.plan, _token: data.token, _topic: data.topic,
    });
    if (error) return { ok: false, error: "UNAVAILABLE" };
    return result as unknown as SupportResult;
  });