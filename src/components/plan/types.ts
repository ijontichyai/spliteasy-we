import type { SplitMeta, SplitMethod } from "@/lib/split";
export type Role = "owner" | "admin" | "member";
export type PlaceCategory = "restaurant" | "activity" | "lodging" | "sight" | "transport" | "other";
export type PlaceStatus = "proposed" | "chosen" | "discarded";
export type ExpenseCategory = "food" | "transport" | "lodging" | "tickets" | "other";
export type SettlementStatus = "proposed" | "confirmed" | "rejected" | "cancelled";
export type PlanType = "dinner" | "getaway" | "trip" | "celebration" | "activity" | "other";

export const PLAN_TYPES: PlanType[] = ["getaway", "dinner", "trip", "celebration", "activity", "other"];
export const PLACE_CATEGORIES: PlaceCategory[] = ["restaurant", "activity", "lodging", "sight", "transport", "other"];
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ["food", "transport", "lodging", "tickets", "other"];

export type PlanVM = {
  id: string; name: string; type: PlanType; city: string | null;
  startDate: string | null; endDate: string | null; budgetCents: number | null;
  archived: boolean; currency: string;
};
export type MemberVM = { id: string; name: string; role: Role };
export type PlaceVM = { id: string; name: string; category: PlaceCategory; address: string | null; url: string | null; note: string | null; status: PlaceStatus; addedBy: string };
export type ExpenseVM = {
  id: string; description: string; category: ExpenseCategory; amountCents: number; paidBy: string; date: string; shares: Record<string, number>; createdBy: string;
  splitMethod?: SplitMethod; tipCents?: number; meta?: SplitMeta | null; updatedAt?: string; locked?: boolean;
};
export type SettlementVM = { id: string; from: string; to: string; cents: number; status: SettlementStatus };
export type InvitationVM = { id: string; state: "pending" | "used" | "revoked" | "expired"; expiresAt: string };

export type NewPlace = { name: string; category: PlaceCategory; address: string; url: string; note: string };
export type NewExpense = { description: string; category: ExpenseCategory; amountCents: number; paidBy: string; date: string; method: SplitMethod; tipCents: number; meta: SplitMeta; shares: Record<string, number>; idempotencyKey?: string };

export type PlanActions = {
  addPlace: (p: NewPlace) => Promise<void>;
  setPlaceStatus: (id: string, s: PlaceStatus) => Promise<void>;
  addExpense: (e: NewExpense) => Promise<void>;
  updateExpense: (id: string, e: NewExpense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  proposeSettlement: (to: string, cents: number) => Promise<void>;
  respondSettlement: (id: string, s: SettlementStatus) => Promise<void>;
  createInvite?: () => Promise<string>;
  revokeInvite?: (id: string) => Promise<void>;
  setArchived?: (archived: boolean) => Promise<void>;
};

export type PlanData = {
  me: string; plan: PlanVM; members: MemberVM[]; places: PlaceVM[]; expenses: ExpenseVM[];
  settlements: SettlementVM[]; invitations?: InvitationVM[]; memberLimit: number | null;
};

export const PLAN_TABS = ["people", "places", "expenses", "balances"] as const;
export type PlanTab = (typeof PLAN_TABS)[number];
export function isPlanTab(v: unknown): v is PlanTab {
  return typeof v === "string" && (PLAN_TABS as readonly string[]).includes(v);
}
