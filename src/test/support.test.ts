import { describe, expect, it } from "vitest";
import { grantOpen, sessionSeconds, supportInput, type SupportGrant } from "@/lib/support-schema";

const g: SupportGrant = { id: "g", request_id: "r", user_id: "b", staff_id: "a", target: "account", plan_id: null, needs_organizer: false, organizer_approved_at: null, start_deadline: "2026-11-14T12:30:00Z", started_at: "2026-11-14T12:00:00Z", expires_at: "2026-11-14T12:15:00Z", ended_at: null, revoked_at: null };
describe("support session boundaries", () => {
  it("expires at the exact 15-minute boundary", () => {
    expect(sessionSeconds(g.expires_at, Date.parse("2026-11-14T12:00:00Z"))).toBe(900);
    expect(grantOpen(g, Date.parse("2026-11-14T12:14:59Z"))).toBe(true);
    expect(grantOpen(g, Date.parse("2026-11-14T12:15:00Z"))).toBe(false);
  });
  it("revocation blocks the view immediately", () => {
    expect(grantOpen({ ...g, revoked_at: "2026-11-14T12:01:00Z" }, Date.parse("2026-11-14T12:01:00Z"))).toBe(false);
  });
  it("ended sessions cannot reopen", () => {
    expect(grantOpen({ ...g, ended_at: "2026-11-14T12:01:00Z" }, Date.parse("2026-11-14T12:02:00Z"))).toBe(false);
  });
  it("rejects real-data mode and unsupported actions", () => {
    expect(supportInput.safeParse({ action: "authorize", target: "real" }).success).toBe(false);
    expect(supportInput.safeParse({ action: "impersonate" }).success).toBe(false);
  });
});