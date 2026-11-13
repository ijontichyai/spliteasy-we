import { describe, expect, it } from "vitest";
import { isTheme, resolveTheme } from "@/lib/theme";

describe("theme", () => {
  it("system follows the OS preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
  it("explicit choice ignores the OS", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
  it("rejects unknown stored values", () => {
    expect(isTheme("blue")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});
