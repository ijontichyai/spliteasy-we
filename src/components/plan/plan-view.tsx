import { useMemo, useState, type FormEvent } from "react";
import { ExpenseForm } from "./expense-form";
import { toast } from "sonner";
import { ArrowRight, Check, Copy, Link2, Lock, MapPin, Pencil, Plus, Trash2, Users, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/context";
import { errorKey } from "@/lib/errors";
import { canRemoveMember } from "@/lib/members";
import { computeBalances, formatMoney, simplifyDebts, splitEqual, toCents } from "@/lib/money";
import {
  EXPENSE_CATEGORIES, PLACE_CATEGORIES,
  type ExpenseCategory, type PlaceCategory, type PlanActions, type PlanData, type PlanTab,
} from "./types";

const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function Avatar({ name, i }: { name: string; i: number }) {
  const tones = ["bg-primary text-primary-foreground", "bg-accent text-accent-foreground", "bg-secondary text-secondary-foreground", "bg-chart-4 text-primary-foreground"];
  return (
    <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tones[i % tones.length]}`} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function PlanView({ data, actions, initialTab, protectedView = false }: { data: PlanData; actions: PlanActions; initialTab?: PlanTab | undefined; protectedView?: boolean }) {
  const { t, locale } = useI18n();
  const { plan, members, me } = data;
  const readOnly = plan.archived || protectedView;
  const myRole = members.find((m) => m.id === me)?.role;
  const nameOf = (id: string) => {
    const n = members.find((m) => m.id === id)?.name ?? data.formerMembers?.find((m) => m.id === id)?.name ?? t("member.former");
    return id === me ? `${n} (${t("common.you")})` : n;
  };
  const idx = (id: string) => Math.max(0, members.findIndex((m) => m.id === id));
  const money = (c: number) => protectedView ? t("support.hidden") : formatMoney(c, locale, plan.currency);
  const [editing, setEditing] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const runOrThrow = async (fn: () => Promise<void>, ok?: string) => {
    try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error(t(errorKey(e))); throw e; }
  };
  const run = async (fn: () => Promise<void>, ok?: string) => {
    try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error(t(errorKey(e))); }
  };

  const activeExpenses = data.expenses;
  const spent = activeExpenses.reduce((a, e) => a + e.amountCents, 0);
  const balances = useMemo(
    () => computeBalances(members.map((m) => m.id), activeExpenses, data.settlements.map((s) => ({ ...s, confirmed: s.status === "confirmed" }))),
    [members, activeExpenses, data.settlements],
  );
  const transfers = useMemo(() => simplifyDebts(balances), [balances]);

  return (
    <div>
      <section className="rounded-3xl bg-hero border border-border p-5 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">{t(`type.${plan.type}`)}{plan.city ? ` · ${plan.city}` : ""}</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{plan.name}</h1>
        {(plan.startDate || plan.endDate) && (
          <p className="mt-1 text-sm text-muted-foreground">{[plan.startDate, plan.endDate].filter(Boolean).join(" → ")}</p>
        )}
        <div className="mt-5 flex flex-wrap items-end gap-6">
          <div>
            <p className="text-xs text-muted-foreground">{t("plan.spent")}</p>
            <p className="font-display text-2xl font-bold">{money(spent)}</p>
            {plan.budgetCents != null && <p className="text-xs text-muted-foreground">{t("plan.budgetLeft", { budget: money(plan.budgetCents) })}</p>}
          </div>
          <div className="flex -space-x-2">
            {members.map((m, i) => <span key={m.id} className="rounded-full ring-2 ring-background"><Avatar name={m.name} i={i} /></span>)}
          </div>
        </div>
        {plan.budgetCents != null && plan.budgetCents > 0 && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (spent / plan.budgetCents) * 100)}%` }} />
          </div>
        )}
        {readOnly && <p className="mt-4 rounded-xl bg-secondary px-3 py-2 text-sm">{protectedView ? t("support.readOnlyView") : t("plan.readOnly")}</p>}
      </section>

      <Tabs defaultValue={initialTab ?? "expenses"} className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="people"><Users className="mr-1 hidden size-4 sm:inline" />{t("tab.people")}</TabsTrigger>
          <TabsTrigger value="places"><MapPin className="mr-1 hidden size-4 sm:inline" />{t("tab.places")}</TabsTrigger>
          <TabsTrigger value="expenses"><Wallet className="mr-1 hidden size-4 sm:inline" />{t("tab.expenses")}</TabsTrigger>
          <TabsTrigger value="balances">{t("tab.balances")}</TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="mt-4 space-y-4">
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {members.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3 p-3">
                <Avatar name={m.name} i={i} />
                <span className="flex-1 font-medium">{nameOf(m.id)}</span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{t(`role.${m.role}`)}</span>
                {!readOnly && actions.renameMember && (
                  <Button size="icon" variant="ghost" aria-label={t("member.rename")} aria-expanded={renaming === m.id} onClick={() => setRenaming(renaming === m.id ? null : m.id)}><Pencil className="size-4" /></Button>
                )}
                {!readOnly && actions.removeMember && m.role !== "owner" && (m.id === me || canRemoveMember(myRole, m, me, 0) === "ok") && (
                  <Button size="sm" variant="ghost" onClick={() => {
                    const rm = actions.removeMember; if (!rm) return;
                    const why = canRemoveMember(myRole, m, me, balances[m.id] ?? 0);
                    if (why !== "ok") { toast.error(t(`err.${why}` as never)); return; }
                    if (window.confirm(m.id === me ? t("member.leaveConfirm") : t("member.removeConfirm", { name: m.name }))) void run(() => rm(m.id), m.id === me ? t("member.left") : t("member.removed"));
                  }}>{m.id === me ? t("member.leave") : t("member.remove")}</Button>
                )}
              </li>
            ))}
          </ul>
          {renaming && actions.renameMember && members.some((m) => m.id === renaming) && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = String(new FormData(e.currentTarget).get("rename") ?? "").trim(); const rn = actions.renameMember; const id = renaming; if (n && rn) void run(() => rn(id, n)).then(() => setRenaming(null)); }}>
              <Input key={renaming} name="rename" maxLength={40} required autoFocus defaultValue={members.find((m) => m.id === renaming)?.name} aria-label={t("member.rename")} />
              <Button type="submit" variant="secondary"><Check className="size-4" />{t("member.rename")}</Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Cancel" onClick={() => setRenaming(null)}><X className="size-4" /></Button>
            </form>
          )}
          {!readOnly && actions.addMember && (data.memberLimit == null || members.length < data.memberLimit) && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const n = String(new FormData(f).get("name") ?? "").trim(); const add = actions.addMember; if (n && add) void run(() => add(n)).then(() => f.reset()); }}>
              <Input name="name" maxLength={40} placeholder={t("member.namePh")} aria-label={t("member.namePh")} required />
              <Button type="submit" variant="secondary"><Plus className="size-4" />{t("member.add")}</Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground">{t("member.historyNote")}</p>
          {data.memberLimit != null && <p className="text-xs text-muted-foreground">{t("inv.limit", { n: data.memberLimit })}</p>}
          {actions.createInvite && (myRole === "owner" || myRole === "admin") && !readOnly && (
            <Invitations data={data} actions={actions} />
          )}
          {actions.setArchived && myRole === "owner" && !protectedView && (
            <Button variant="outline" size="sm" onClick={() => { const archive = actions.setArchived; if (archive) void run(() => archive(!plan.archived)); }}>
              {plan.archived ? t("plan.unarchive") : t("plan.archive")}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="places" className="mt-4 space-y-4">
          {!readOnly && <PlaceForm onAdd={(p) => run(() => actions.addPlace(p), t("place.added"))} />}
          {data.places.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("place.empty")}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.places.map((p) => (
                <li key={p.id} className={`rounded-2xl border bg-card p-4 ${p.status === "chosen" ? "border-accent shadow-soft" : "border-border"} ${p.status === "discarded" ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-accent">{t(`pcat.${p.category}`)}</p>
                      <p className="font-semibold">{p.url ? <a href={p.url} target="_blank" rel="noreferrer noopener" className="hover:underline">{p.name}</a> : p.name}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t(`pstatus.${p.status}`)}</span>
                  </div>
                  {p.address && <p className="mt-1 text-sm text-muted-foreground">{p.address}</p>}
                  {p.note && <p className="mt-1 text-sm">{p.note}</p>}
                  {!readOnly && (p.addedBy === me || myRole !== "member") && (
                    <div className="mt-3 flex gap-2">
                      {p.status !== "chosen" && <Button size="sm" variant="secondary" onClick={() => run(() => actions.setPlaceStatus(p.id, "chosen"))}><Check className="size-4" />{t("place.choose")}</Button>}
                      {p.status !== "discarded" && <Button size="sm" variant="ghost" onClick={() => run(() => actions.setPlaceStatus(p.id, "discarded"))}>{t("place.discard")}</Button>}
                      {p.status === "discarded" && <Button size="sm" variant="ghost" onClick={() => run(() => actions.setPlaceStatus(p.id, "proposed"))}>{t("place.reopen")}</Button>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 space-y-4">
          {!readOnly && <ExpenseForm data={data} onSubmit={(e) => runOrThrow(() => actions.addExpense(e), t("exp.saved"))} />}
          {activeExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("exp.empty")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {activeExpenses.map((e) => {
                const canManage = !readOnly && (e.createdBy === me || myRole !== "member");
                if (editing === e.id) return (
                  <li key={e.id} className="p-2">
                    <ExpenseForm data={data} expense={e} onClose={() => setEditing(null)} onSubmit={(x) => runOrThrow(() => actions.updateExpense(e.id, x), t("exp.updated"))} />
                  </li>
                );
                return (
                <li key={e.id} className="flex items-center gap-3 p-3">
                  <Avatar name={members[idx(e.paidBy)]?.name ?? "?"} i={idx(e.paidBy)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`ecat.${e.category}`)} · {e.date} · {t("exp.paidLine", { name: nameOf(e.paidBy), amount: money(e.amountCents) })} · {Object.keys(e.shares).length}/{members.length}
                      {e.splitMethod && e.splitMethod !== "equal" ? ` · ${t(`exp.m.${e.splitMethod}`)}` : ""}
                      {(e.tipCents ?? 0) > 0 ? ` · ${t("exp.tipLine", { amount: money(e.tipCents ?? 0) })}` : ""}
                    </p>
                  </div>
                  <span className="font-display font-semibold tabular-nums">{money(e.amountCents)}</span>
                  {canManage && (e.locked ? (
                    <span className="inline-flex items-center text-muted-foreground" title={t("exp.locked")} aria-label={t("exp.locked")}><Lock className="size-4" /></span>
                  ) : (<>
                    <Button size="icon" variant="ghost" aria-label={t("exp.edit")} onClick={() => setEditing(e.id)}><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={t("common.delete")} onClick={() => run(() => actions.deleteExpense(e.id))}><Trash2 className="size-4" /></Button>
                  </>))}
                </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="balances" className="mt-4 space-y-5">
          <ul className="grid gap-2 sm:grid-cols-2">
            {members.map((m, i) => {
              const c = balances[m.id] ?? 0;
              return (
                <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <Avatar name={m.name} i={i} />
                  <span className="flex-1 font-medium">{nameOf(m.id)}</span>
                  <span className={`text-sm font-semibold ${c > 0 ? "text-primary" : c < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {c > 0 ? t("bal.gets", { amount: money(c) }) : c < 0 ? t("bal.owes", { amount: money(-c) }) : protectedView ? t("support.hidden") : t("bal.even")}
                  </span>
                </li>
              );
            })}
          </ul>
          <div>
            <h2 className="text-lg font-semibold">{t("bal.howTo")}</h2>
            {transfers.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{protectedView ? t("support.hidden") : t("bal.allEven")}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {transfers.map((tr) => {
                  const pending = data.settlements.some((s) => s.status === "proposed" && s.from === tr.from && s.to === tr.to);
                  return (
                    <li key={`${tr.from}-${tr.to}`} className="flex flex-wrap items-center gap-2 rounded-2xl bg-secondary p-3 text-sm">
                      <span className="font-medium">{nameOf(tr.from)}</span>
                      <ArrowRight className="size-4 text-accent" aria-hidden />
                      <span className="font-medium">{nameOf(tr.to)}</span>
                      <span className="ml-auto font-display font-semibold">{money(tr.cents)}</span>
                      {tr.from === me && !readOnly && (pending
                        ? <span className="w-full text-xs text-muted-foreground">{t("bal.proposed")}</span>
                        : <Button size="sm" className="w-full sm:w-auto" onClick={() => run(() => actions.proposeSettlement(tr.to, tr.cents))}>{t("bal.markPaid")}</Button>)}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {data.settlements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">{t("bal.settlements")}</h2>
              <p className="text-xs text-muted-foreground">{t("bal.onlyReceiver")}</p>
              <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card">
                {data.settlements.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                    <span className="flex-1">{t("bal.transfer", { from: nameOf(s.from), to: nameOf(s.to), amount: money(s.cents) })}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t(`sstatus.${s.status}`)}</span>
                    {s.status === "proposed" && s.to === me && !readOnly && (
                      <>
                        <Button size="sm" onClick={() => run(() => actions.respondSettlement(s.id, "confirmed"))}><Check className="size-4" />{t("bal.confirm")}</Button>
                        <Button size="sm" variant="ghost" onClick={() => run(() => actions.respondSettlement(s.id, "rejected"))}><X className="size-4" />{t("bal.reject")}</Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Invitations({ data, actions }: { data: PlanData; actions: PlanActions }) {
  const { t, locale } = useI18n();
  const [link, setLink] = useState<string | null>(null);
  const create = async () => {
    try {
      const token = await actions.createInvite!();
      setLink(`${window.location.origin}/join/${token}`);
    } catch (e) { toast.error(t(errorKey(e))); }
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-semibold">{t("inv.title")}</h2>
      <p className="text-xs text-muted-foreground">{t("inv.hint")}</p>
      <Button size="sm" className="mt-3" onClick={create}><Link2 className="size-4" />{t("inv.create")}</Button>
      {link && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label={t("inv.title")} />
            <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(link); toast.success(t("inv.copied")); }}><Copy className="size-4" />{t("inv.copy")}</Button>
          </div>
          <p className="text-xs text-accent">{t("inv.onceWarning")}</p>
        </div>
      )}
      {data.invitations && data.invitations.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {data.invitations.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {inv.state === "pending" ? t("inv.pending", { date: new Date(inv.expiresAt).toLocaleDateString(locale) }) : t(`inv.${inv.state}`)}
              </span>
              {inv.state === "pending" && actions.revokeInvite && (
                <Button size="sm" variant="ghost" onClick={async () => { try { await actions.revokeInvite!(inv.id); } catch (e) { toast.error(t(errorKey(e))); } }}>{t("inv.revoke")}</Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlaceForm({ onAdd }: { onAdd: (p: { name: string; category: PlaceCategory; address: string; url: string; note: string }) => Promise<void> }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", category: "restaurant" as PlaceCategory, address: "", url: "", note: "" });
  if (!open) return <Button onClick={() => setOpen(true)}><Plus className="size-4" />{t("common.add")} · {t("tab.places")}</Button>;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await onAdd(f);
    setF({ name: "", category: "restaurant", address: "", url: "", note: "" });
    setOpen(false);
  };
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
      <div className="space-y-1.5"><Label htmlFor="pl-name">{t("place.name")}</Label><Input id="pl-name" required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="pl-cat">{t("place.category")}</Label>
        <select id="pl-cat" className={selectCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as PlaceCategory })}>
          {PLACE_CATEGORIES.map((c) => <option key={c} value={c}>{t(`pcat.${c}`)}</option>)}
        </select></div>
      <div className="space-y-1.5"><Label htmlFor="pl-addr">{t("place.address")}</Label><Input id="pl-addr" maxLength={200} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="pl-url">{t("place.url")}</Label><Input id="pl-url" type="url" pattern="https?://.*" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
      <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="pl-note">{t("place.note")}</Label><Input id="pl-note" maxLength={300} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
      <div className="flex gap-2 sm:col-span-2"><Button type="submit">{t("common.save")}</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Button></div>
    </form>
  );
}
