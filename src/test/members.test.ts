import { describe, expect, it } from "vitest";
import { canRemoveMember } from "@/lib/members";
import { computeBalances } from "@/lib/money";

describe("participants leaving and removal", () => {
  it("a member can leave with zero balance", () => expect(canRemoveMember("member", { id: "b", role: "member" }, "b", 0)).toBe("ok"));
  it("nobody leaves owing or being owed", () => expect(canRemoveMember("member", { id: "b", role: "member" }, "b", -500)).toBe("BALANCE_NOT_ZERO"));
  it("the organizer cannot leave or be removed", () => expect(canRemoveMember("owner", { id: "a", role: "owner" }, "a", 0)).toBe("OWNER_CANNOT_LEAVE"));
  it("a member cannot remove another member", () => expect(canRemoveMember("member", { id: "c", role: "member" }, "b", 0)).toBe("FORBIDDEN"));
  it("an admin cannot remove another admin", () => expect(canRemoveMember("admin", { id: "c", role: "admin" }, "b", 0)).toBe("FORBIDDEN"));
  it("the organizer can remove anyone else", () => expect(canRemoveMember("owner", { id: "c", role: "admin" }, "a", 0)).toBe("ok"));
  it("an outsider cannot remove", () => expect(canRemoveMember(undefined, { id: "c", role: "member" }, "x", 0)).toBe("FORBIDDEN"));
  it("old expenses keep balances after a settled member leaves; new ones split among active", () => {
    const old = [{ paidBy: "a", shares: { a: 2000, b: 2000 } }];
    const st = [{ from: "b", to: "a", cents: 2000, confirmed: true }];
    const before = computeBalances(["a", "b"], old, st);
    expect(before["b"]).toBe(0);
    const after = computeBalances(["a", "c"], [...old, { paidBy: "c", shares: { a: 500, c: 500 } }], st);
    expect(after["a"]).toBe(-500);
    expect(after["c"]).toBe(500);
  });
});
