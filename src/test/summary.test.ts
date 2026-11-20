import { describe, expect, it } from "vitest";
import { aggregateSummary } from "@/lib/summary";

describe("aggregateSummary", () => {
  it("separates what you owe from what you are owed across plans", () => {
    const r = aggregateSummary([
      { totalCents: 10000, paidCents: 6000, balanceCents: 2500 },
      { totalCents: 4000, paidCents: 0, balanceCents: -1000 },
    ]);
    expect(r).toEqual({ paidCents: 6000, oweCents: 1000, owedCents: 2500 });
  });
});
