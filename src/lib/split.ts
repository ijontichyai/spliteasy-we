import { splitEqual } from "@/lib/money";

export type SplitMethod = "equal" | "items" | "percent" | "custom";
export const SPLIT_METHODS: SplitMethod[] = ["equal", "items", "percent", "custom"];
export type TipMode = "none" | "percent" | "fixed";
export const SUGGESTED_TIPS = [5, 10, 15] as const;

/** Persisted in expenses.split_meta so the form can be reopened for editing. */
export type SplitMeta = {
  participants: string[];
  /** items: individual consumption in cents; custom: amount in cents; percent: basis points (100% = 10000). */
  values: Record<string, number>;
  tip: { mode: TipMode; percentBp: number; fixedCents: number; sharers: string[] };
};

export type SplitResult = { shares: Record<string, number>; baseCents: number; tipCents: number; totalCents: number; diff: number; valid: boolean };

/** Largest-remainder allocation of `total` by integer weights; ties by id order (deterministic). */
export function allocateByWeights(total: number, weights: Record<string, number>): Record<string, number> {
  const ids = Object.keys(weights).sort();
  const sum = ids.reduce((a, id) => a + (weights[id] ?? 0), 0);
  if (sum <= 0 || ids.length === 0) return {};
  const out: Record<string, number> = {};
  const rem: { id: string; r: number }[] = [];
  let given = 0;
  for (const id of ids) {
    const exact = (total * (weights[id] ?? 0)) / sum;
    out[id] = Math.floor(exact);
    given += out[id]!;
    rem.push({ id, r: exact - out[id]! });
  }
  rem.sort((a, b) => b.r - a.r || a.id.localeCompare(b.id));
  for (let i = 0; given < total; i++, given++) out[rem[i % rem.length]!.id]! += 1;
  return out;
}

export function tipCents(baseCents: number, tip: SplitMeta["tip"]): number {
  if (tip.mode === "percent") return Math.round((baseCents * tip.percentBp) / 10000);
  if (tip.mode === "fixed") return Math.max(0, Math.round(tip.fixedCents));
  return 0;
}

export function computeSplit(method: SplitMethod, baseCents: number, meta: SplitMeta): SplitResult {
  const ps = [...new Set(meta.participants)];
  let base: Record<string, number> = {};
  let diff = 0;
  if (method === "equal") base = splitEqual(baseCents, ps);
  else if (method === "custom") {
    base = Object.fromEntries(ps.map((id) => [id, Math.max(0, Math.round(meta.values[id] ?? 0))]));
    diff = baseCents - Object.values(base).reduce((a, c) => a + c, 0);
  } else if (method === "items") {
    // Each person pays what they consumed; any shared remainder is split equally among participants.
    const items = Object.fromEntries(ps.map((id) => [id, Math.max(0, Math.round(meta.values[id] ?? 0))]));
    const rest = baseCents - Object.values(items).reduce((a, c) => a + c, 0);
    if (rest < 0) diff = rest;
    else { const eq = splitEqual(rest, ps); base = Object.fromEntries(ps.map((id) => [id, items[id]! + (eq[id] ?? 0)])); }
  } else {
    const bp = Object.fromEntries(ps.map((id) => [id, Math.max(0, Math.round(meta.values[id] ?? 0))]));
    const sumBp = Object.values(bp).reduce((a, c) => a + c, 0);
    if (sumBp !== 10000) diff = 10000 - sumBp; // expressed in basis points
    else base = allocateByWeights(baseCents, bp);
  }
  const tip = tipCents(baseCents, meta.tip);
  const sharers = [...new Set(meta.tip.sharers)];
  const shares: Record<string, number> = { ...base };
  if (tip > 0) for (const [id, c] of Object.entries(splitEqual(tip, sharers))) shares[id] = (shares[id] ?? 0) + c;
  const totalCents = baseCents + tip;
  const sum = Object.values(shares).reduce((a, c) => a + c, 0);
  const valid = baseCents > 0 && ps.length > 0 && diff === 0 && (tip === 0 || sharers.length > 0) && tip < totalCents && sum === totalCents;
  return { shares, baseCents, tipCents: tip, totalCents, diff, valid };
}
