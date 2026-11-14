import { z } from "zod";

export const supportInput = z.object({
  action: z.enum(["workspace", "admin", "request", "accept", "authorize", "approve", "reject", "revoke", "start", "view", "exit"]),
  id: z.string().uuid().optional(),
  target: z.enum(["account", "plan"]).optional(),
  plan: z.string().uuid().optional(),
  token: z.string().max(128).optional(),
  topic: z.string().trim().min(1).max(500).optional(),
});
export type SupportInput = z.infer<typeof supportInput>;
export type SupportGrant = {
  id: string; request_id: string; user_id: string; staff_id: string; target: "account" | "plan";
  plan_id: string | null; needs_organizer: boolean; organizer_approved_at: string | null;
  start_deadline: string; started_at: string | null; expires_at: string | null;
  ended_at: string | null; revoked_at: string | null;
};
export type SupportRequest = { id: string; user_id: string; topic?: string; status: string; assigned_to: string | null; created_at: string; providers?: string[] };
export type ProtectedView = {
  plan?: string; type?: string; status?: string; archived?: boolean;
  active_plans_member?: number; active_plans_owned?: number;
  members?: { label: string; role: "owner" | "admin" | "member"; status: string }[];
  places?: { label: string; category: string; status: string }[];
  expenses_count?: number; shares_consistent?: boolean;
};
export type SupportResult = {
  ok: boolean; error?: string; admin?: boolean; user_id?: string;
  requests?: SupportRequest[]; grants?: SupportGrant[]; plans?: { id: string; name: string }[];
  notifications?: { id: string; grant_id: string; starts_at: string; ends_at: string }[];
  grant_id?: string; token?: string; protected?: boolean; view?: ProtectedView;
};
export function grantOpen(g: SupportGrant, now: number) {
  return !g.ended_at && !g.revoked_at && Date.parse(g.expires_at ?? g.start_deadline) > now;
}
export function sessionSeconds(expires: string | null, now: number) {
  return expires ? Math.max(0, Math.ceil((Date.parse(expires) - now) / 1000)) : 0;
}