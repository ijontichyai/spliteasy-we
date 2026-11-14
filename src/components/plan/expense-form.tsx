import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, fromCents, toCents } from "@/lib/money";
import { computeSplit, SPLIT_METHODS, SUGGESTED_TIPS, type SplitMeta, type SplitMethod, type TipMode } from "@/lib/split";
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseVM, type NewExpense, type PlanData } from "./types";

const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const today = () => new Date().toISOString().slice(0, 10);

/** Rebuild editable form values; legacy expenses without meta reopen as custom amounts. */
function initialFrom(e: ExpenseVM | undefined, memberIds: string[]) {
  if (!e) return { method: "equal" as SplitMethod, base: "", values: {} as Record<string, string>, participants: memberIds, tip: { mode: "none" as TipMode, pct: "", fixed: "", sharers: memberIds } };
  const tip = e.tipCents ?? 0;
  const m = e.meta;
  if (!m) {
    const method: SplitMethod = e.splitMethod === "equal" ? "equal" : "custom";
    return { method, base: String(fromCents(e.amountCents)), participants: Object.keys(e.shares),
      values: Object.fromEntries(Object.entries(e.shares).map(([k, c]) => [k, String(fromCents(c))])),
      tip: { mode: "none" as TipMode, pct: "", fixed: "", sharers: memberIds } };
  }
  const method = e.splitMethod ?? "equal";
  return {
    method, base: String(fromCents(e.amountCents - tip)), participants: m.participants,
    values: Object.fromEntries(Object.entries(m.values).map(([k, v]) => [k, String(method === "percent" ? v / 100 : fromCents(v))])),
    tip: { mode: m.tip.mode, pct: m.tip.mode === "percent" ? String(m.tip.percentBp / 100) : "", fixed: m.tip.mode === "fixed" ? String(fromCents(m.tip.fixedCents)) : "", sharers: m.tip.sharers },
  };
}

export function ExpenseForm({ data, expense, onSubmit, onClose }: { data: PlanData; expense?: ExpenseVM; onSubmit: (e: NewExpense) => Promise<void>; onClose?: () => void }) {
  const { t, locale } = useI18n();
  const { members, me } = data;
  const init = initialFrom(expense, members.map((m) => m.id));
  const [open, setOpen] = useState(!!expense);
  const [description, setDescription] = useState(expense?.description ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "food");
  const [date, setDate] = useState(expense?.date ?? today());
  const [amount, setAmount] = useState(init.base);
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? me);
  const [method, setMethod] = useState<SplitMethod>(init.method);
  const [included, setIncluded] = useState<string[]>(init.participants);
  const [values, setValues] = useState<Record<string, string>>(init.values);
  const [tipMode, setTipMode] = useState<TipMode>(init.tip.mode);
  const [tipPct, setTipPct] = useState(init.tip.pct);
  const [tipFixed, setTipFixed] = useState(init.tip.fixed);
  const [tipSharers, setTipSharers] = useState<string[]>(init.tip.sharers);
  const [idemKey, setIdemKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);

  const baseCents = toCents(amount || 0);
  const meta: SplitMeta = {
    participants: included,
    values: Object.fromEntries(included.map((id) => [id, method === "percent" ? Math.round(Number(values[id] || 0) * 100) : toCents(values[id] || 0)])),
    tip: { mode: tipMode, percentBp: Math.round(Number(tipPct || 0) * 100), fixedCents: toCents(tipFixed || 0), sharers: tipMode === "none" ? [] : tipSharers },
  };
  const r = computeSplit(method, baseCents, meta);
  const valid = !!description.trim() && !!date && r.valid;

  const close = () => { setOpen(false); onClose?.(); };
  if (!open) return <Button onClick={() => setOpen(true)}><Plus className="size-4" />{t("exp.new")}</Button>;

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await onSubmit({ description: description.trim(), category, date, amountCents: r.totalCents, paidBy, method, tipCents: r.tipCents, meta, shares: r.shares, idempotencyKey: idemKey });
      if (!expense) { setDescription(""); setAmount(""); setValues({}); setTipMode("none"); setIdemKey(crypto.randomUUID()); }
      close();
    } catch { /* toast shown by caller; keep form open */ } finally { setBusy(false); }
  };

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const status = method === "percent" && r.diff !== 0
    ? t("exp.pctRemaining", { pct: (r.diff / 100).toLocaleString(locale) })
    : r.diff !== 0 ? t("exp.remaining", { amount: formatMoney(r.diff, locale) }) : null;

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-4" aria-label={expense ? t("exp.edit") : t("exp.new")}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="ex-desc">{t("exp.description")}</Label><Input id="ex-desc" required maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="ex-amount">{t("exp.amount")}</Label><Input id="ex-amount" required inputMode="decimal" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="ex-date">{t("exp.date")}</Label><Input id="ex-date" required type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="ex-cat">{t("exp.category")}</Label>
          <select id="ex-cat" className={selectCls} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t(`ecat.${c}`)}</option>)}
          </select></div>
        <div className="space-y-1.5"><Label htmlFor="ex-paid">{t("exp.paidBy")}</Label>
          <select id="ex-paid" className={selectCls} value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="ex-split">{t("exp.split")}</Label>
          <select id="ex-split" className={selectCls} value={method} onChange={(e) => { setMethod(e.target.value as SplitMethod); setValues({}); }}>
            {SPLIT_METHODS.map((m) => <option key={m} value={m}>{t(`exp.m.${m}`)}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">{t(`exp.mHint.${method}`)}</p></div>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">{t("exp.forWhom")}</legend>
        <ul className="mt-2 space-y-2">
          {members.map((m) => {
            const on = included.includes(m.id);
            return (
              <li key={m.id} className="flex items-center gap-3">
                <input id={`inc-${m.id}`} type="checkbox" className="size-4 accent-primary" checked={on} onChange={() => setIncluded(toggle(included, m.id))} />
                <label htmlFor={`inc-${m.id}`} className="min-w-0 flex-1 truncate text-sm">{m.name}</label>
                {method !== "equal" && on && (
                  <Input className="h-9 w-24" type="number" min="0" step="0.01" inputMode="decimal" aria-label={`${m.name} ${method === "percent" ? "%" : "€"}`}
                    placeholder={method === "percent" ? "%" : "€"} value={values[m.id] ?? ""} onChange={(e) => setValues({ ...values, [m.id]: e.target.value })} />
                )}
                <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">{on || r.shares[m.id] ? formatMoney(r.shares[m.id] ?? 0, locale) : "—"}</span>
              </li>
            );
          })}
        </ul>
      </fieldset>
      <fieldset className="space-y-2 rounded-xl border border-border p-3">
        <legend className="px-1 text-sm font-medium">{t("exp.tip")}</legend>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={tipMode === "none" ? "default" : "outline"} onClick={() => setTipMode("none")}>{t("exp.tipNone")}</Button>
          {SUGGESTED_TIPS.map((p) => (
            <Button key={p} type="button" size="sm" variant={tipMode === "percent" && tipPct === String(p) ? "default" : "outline"} onClick={() => { setTipMode("percent"); setTipPct(String(p)); }}>{p}%</Button>
          ))}
          <Button type="button" size="sm" variant={tipMode === "percent" && !SUGGESTED_TIPS.map(String).includes(tipPct) ? "default" : "outline"} onClick={() => { setTipMode("percent"); setTipPct(""); }}>{t("exp.tipOtherPct")}</Button>
          <Button type="button" size="sm" variant={tipMode === "fixed" ? "default" : "outline"} onClick={() => setTipMode("fixed")}>{t("exp.tipFixed")}</Button>
        </div>
        {tipMode === "percent" && !SUGGESTED_TIPS.map(String).includes(tipPct) && (
          <Input className="h-9 w-32" type="number" min="0" max="100" step="0.01" aria-label={t("exp.tipOtherPct")} placeholder="%" value={tipPct} onChange={(e) => setTipPct(e.target.value)} />
        )}
        {tipMode === "fixed" && (
          <Input className="h-9 w-32" type="number" min="0" step="0.01" aria-label={t("exp.tipFixed")} placeholder="€" value={tipFixed} onChange={(e) => setTipFixed(e.target.value)} />
        )}
        {tipMode !== "none" && (
          <div>
            <p className="text-xs text-muted-foreground">{t("exp.tipWho")}</p>
            <div className="mt-1 flex flex-wrap gap-3">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" className="size-4 accent-primary" checked={tipSharers.includes(m.id)} onChange={() => setTipSharers(toggle(tipSharers, m.id))} />{m.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>
      <div className="space-y-0.5 text-sm tabular-nums">
        {r.tipCents > 0 && <p className="text-muted-foreground">{t("exp.tipLine", { amount: formatMoney(r.tipCents, locale) })}</p>}
        <p className="font-medium">{t("exp.total", { amount: formatMoney(r.totalCents, locale) })}</p>
        <p className={`text-xs ${r.valid ? "text-primary" : "text-destructive"}`}>{status ?? (r.valid ? t("exp.ok") : t("exp.incomplete"))}</p>
      </div>
      <div className="flex gap-2"><Button type="submit" disabled={!valid || busy}>{t("common.save")}</Button><Button type="button" variant="ghost" onClick={close}>{t("common.cancel")}</Button></div>
    </form>
  );
}
