import { describe, expect, it } from "vitest";
import { translate } from "@/lib/i18n/dictionaries";
describe("participant count wording", () => {
  it("es singular/plural", () => {
    expect(translate("es", "app.memberOne")).toBe("1 participante");
    expect(translate("es", "app.members", { n: 2 })).toBe("2 participantes");
  });
  it("en singular/plural", () => {
    expect(translate("en", "app.memberOne")).toBe("1 participant");
    expect(translate("en", "app.members", { n: 2 })).toBe("2 participants");
  });
});
