// All money math in integer cents to avoid floating-point drift.
export const toCents = (v: number | string) => Math.round(Number(v) * 100);
export const fromCents = (c: number) => c / 100;

export function formatMoney(cents: number, locale: string, currency = "EUR") {
  return new Intl.NumberFormat(locale === "en" ? "en-IE" : "es-ES", { style: "currency", currency }).format(cents / 100);
}

/** Equal split; leftover cents go to the first participants in id order (deterministic, ADR-001). */
export function splitEqual(totalCents: number, userIds: string[]): Record<string, number> {
  const ids = [...userIds].sort();
  const n = ids.length;
  if (n === 0) return {};
  const base = Math.floor(totalCents / n);
  let rest = totalCents - base * n;
  const out: Record<string, number> = {};
  for (const id of ids) {
    out[id] = base + (rest > 0 ? 1 : 0);
    if (rest > 0) rest--;
  }
  return out;
}

export type Transfer = { from: string; to: string; cents: number };

/** Minimal-ish list of transfers that settles net balances (positive = is owed money). */
export function simplifyDebts(balances: Record<string, number>): Transfer[] {
  const debtors = Object.entries(balances).filter(([, c]) => c < 0).map(([id, c]) => ({ id, c: -c })).sort((a, b) => b.c - a.c || a.id.localeCompare(b.id));
  const creditors = Object.entries(balances).filter(([, c]) => c > 0).map(([id, c]) => ({ id, c })).sort((a, b) => b.c - a.c || a.id.localeCompare(b.id));
  const out: Transfer[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!;
    const c = creditors[j]!;
    const amt = Math.min(d.c, c.c);
    if (amt > 0) out.push({ from: d.id, to: c.id, cents: amt });
    d.c -= amt;
    c.c -= amt;
    if (d.c === 0) i++;
    if (c.c === 0) j++;
  }
  return out;
}

export type LocalExpense = { paidBy: string; shares: Record<string, number> };
export type LocalSettlement = { from: string; to: string; cents: number; confirmed: boolean };

/** Same formula as the plan_balances DB function: paid - owed + confirmed sent - confirmed received. */
export function computeBalances(memberIds: string[], expenses: LocalExpense[], settlements: LocalSettlement[] = []) {
  const b: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]));
  for (const e of expenses) {
    const total = Object.values(e.shares).reduce((a, c) => a + c, 0);
    b[e.paidBy] = (b[e.paidBy] ?? 0) + total;
    for (const [id, c] of Object.entries(e.shares)) b[id] = (b[id] ?? 0) - c;
  }
  for (const s of settlements) if (s.confirmed) { b[s.from] = (b[s.from] ?? 0) + s.cents; b[s.to] = (b[s.to] ?? 0) - s.cents; }
  return b;
}
