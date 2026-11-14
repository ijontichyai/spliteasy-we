import type { Role } from "@/components/plan/types";

/** Mirrors remove_plan_member in the database: who may take whom out of a plan. */
export function canRemoveMember(myRole: Role | undefined, target: { id: string; role: Role }, me: string, balanceCents: number): "ok" | "FORBIDDEN" | "OWNER_CANNOT_LEAVE" | "BALANCE_NOT_ZERO" {
  if (!myRole) return "FORBIDDEN";
  if (target.role === "owner") return "OWNER_CANNOT_LEAVE";
  if (target.id !== me && !(myRole === "owner" || (myRole === "admin" && target.role === "member"))) return "FORBIDDEN";
  if (balanceCents !== 0) return "BALANCE_NOT_ZERO";
  return "ok";
}
