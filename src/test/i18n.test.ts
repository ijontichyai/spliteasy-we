import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, dictionaries, translate } from "@/lib/i18n/dictionaries";

describe("i18n", () => {
  it("defaults to Spanish", () => {
    expect(DEFAULT_LOCALE).toBe("es");
  });
  it("supports Spanish and English", () => {
    expect([...LOCALES]).toEqual(["es", "en"]);
  });
  it("every language has the same keys as Spanish", () => {
    const base = Object.keys(dictionaries.es).sort();
    for (const l of LOCALES) expect(Object.keys(dictionaries[l]).sort()).toEqual(base);
  });
  it("interpolates variables", () => {
    expect(translate("es", "app.hello", { name: "Ana" })).toBe("Hola, Ana");
  });
});
