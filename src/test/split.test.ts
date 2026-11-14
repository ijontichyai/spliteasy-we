import { describe, expect, it } from "vitest";
import { allocateByWeights, computeSplit, type SplitMeta } from "@/lib/split";
import { computeBalances } from "@/lib/money";

const noTip: SplitMeta["tip"] = { mode: "none", percentBp: 0, fixedCents: 0, sharers: [] };
const meta = (values: Record<string, number>, tip = noTip, participants = ["a", "b", "c"]): SplitMeta => ({ participants, values, tip });
const sum = (r: Record<string, number>) => Object.values(r).reduce((x, y) => x + y, 0);

describe("split methods", () => {
  it("equal: 10,00 € among 3 is 3,34/3,33/3,33", () => {
    expect(computeSplit("equal", 1000, meta({})).shares).toEqual({ a: 334, b: 333, c: 333 });
  });
  it("items: each pays own consumption plus an equal part of the shared rest", () => {
    const r = computeSplit("items", 3000, meta({ a: 1200, b: 800, c: 400 }));
    expect(r.shares).toEqual({ a: 1400, b: 1000, c: 600 });
    expect(r.valid).toBe(true);
  });
  it("items: consumption above the amount is invalid", () => {
    expect(computeSplit("items", 1000, meta({ a: 800, b: 400 })).valid).toBe(false);
  });
  it("percent: 33.33/33.33/33.34 of 100,00 € sums exactly", () => {
    const r = computeSplit("percent", 10000, meta({ a: 3333, b: 3333, c: 3334 }));
    expect(r.shares).toEqual({ a: 3333, b: 3333, c: 3334 });
  });
  it("percent: must total 100%", () => {
    expect(computeSplit("percent", 10000, meta({ a: 5000, b: 4000 })).valid).toBe(false);
  });
  it("percent rounding: 10,00 € at 1/3 each by largest remainder", () => {
    expect(allocateByWeights(1000, { c: 1, a: 1, b: 1 })).toEqual({ a: 334, b: 333, c: 333 });
  });
  it("custom: must match the amount exactly", () => {
    expect(computeSplit("custom", 1000, meta({ a: 500, b: 400 })).diff).toBe(100);
    expect(computeSplit("custom", 1000, meta({ a: 500, b: 500 })).valid).toBe(true);
  });
});

describe("tips", () => {
  it("10% suggested tip on 45,00 € adds 4,50 € split among chosen people only", () => {
    const r = computeSplit("equal", 4500, meta({}, { mode: "percent", percentBp: 1000, fixedCents: 0, sharers: ["a", "b"] }));
    expect(r.tipCents).toBe(450);
    expect(r.totalCents).toBe(4950);
    expect(r.shares).toEqual({ a: 1725, b: 1725, c: 1500 });
  });
  it("custom 12.5% tip rounds to the cent", () => {
    expect(computeSplit("equal", 1001, meta({}, { mode: "percent", percentBp: 1250, fixedCents: 0, sharers: ["a"] })).tipCents).toBe(125);
  });
  it("fixed tip of 5,00 € among 3 sums exactly", () => {
    const r = computeSplit("equal", 3000, meta({}, { mode: "fixed", percentBp: 0, fixedCents: 500, sharers: ["a", "b", "c"] }));
    expect(sum(r.shares)).toBe(3500);
  });
  it("a tip with nobody to share it is invalid", () => {
    expect(computeSplit("equal", 3000, meta({}, { mode: "fixed", percentBp: 0, fixedCents: 500, sharers: [] })).valid).toBe(false);
  });
});

describe("editing recalculates balances", () => {
  it("changing payer and participants of an expense updates balances and keeps zero sum", () => {
    const before = computeBalances(["a", "b", "c"], [{ paidBy: "a", shares: computeSplit("equal", 900, meta({})).shares }]);
    expect(before).toEqual({ a: 600, b: -300, c: -300 });
    const after = computeBalances(["a", "b", "c"], [{ paidBy: "b", shares: computeSplit("equal", 900, meta({}, noTip, ["a", "c"])).shares }]);
    expect(after).toEqual({ a: -450, b: 900, c: -450 });
    expect(sum(after)).toBe(0);
  });
});
