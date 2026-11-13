import { describe, expect, it } from "vitest";
import { computeBalances, simplifyDebts, splitEqual } from "@/lib/money";

describe("money rules", () => {
  it("splits 10,00 € between 3 people as 3,34 / 3,33 / 3,33", () => {
    expect(Object.values(splitEqual(1000, ["c", "a", "b"])).sort().reverse()).toEqual([334, 333, 333]);
  });
  it("equal split always sums exactly to the total", () => {
    const s = splitEqual(12001, ["a", "b", "c", "d", "e", "f", "g"]);
    expect(Object.values(s).reduce((x, y) => x + y, 0)).toBe(12001);
  });
  it("leftover cents go deterministically by id order", () => {
    expect(splitEqual(1000, ["b", "a", "c"])).toEqual({ a: 334, b: 333, c: 333 });
  });
  it("balances of a plan always sum to zero", () => {
    const b = computeBalances(["a", "b", "c", "d"], [
      { paidBy: "a", shares: splitEqual(12000, ["a", "b", "c", "d"]) },
      { paidBy: "b", shares: splitEqual(1000, ["a", "b", "c"]) },
    ]);
    expect(Object.values(b).reduce((x, y) => x + y, 0)).toBe(0);
    expect(b).toEqual({ a: 8667, b: -2333, c: -3334, d: -3000 });
  });
  it("only confirmed settlements change balances", () => {
    const exp = [{ paidBy: "a", shares: { a: 500, b: 500 } }];
    expect(computeBalances(["a", "b"], exp, [{ from: "b", to: "a", cents: 500, confirmed: false }]).b).toBe(-500);
    expect(computeBalances(["a", "b"], exp, [{ from: "b", to: "a", cents: 500, confirmed: true }]).b).toBe(0);
  });
  it("suggested transfers settle everyone", () => {
    const b = { a: 8667, b: -2333, c: -3334, d: -3000 };
    const t = simplifyDebts(b);
    for (const x of t) { b[x.from as keyof typeof b] += x.cents; b[x.to as keyof typeof b] -= x.cents; }
    expect(Object.values(b).every((v) => v === 0)).toBe(true);
    expect(t.length).toBe(3);
  });
});
