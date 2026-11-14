import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PlanView } from "@/components/plan/plan-view";
import type { PlanActions, PlanData } from "@/components/plan/types";
import { useI18n } from "@/lib/i18n/context";
import { supportPortal } from "@/lib/support.functions";
import { grantOpen, sessionSeconds, type SupportInput, type SupportGrant, type ProtectedView } from "@/lib/support-schema";

const blocked = async () => { throw new Error("FORBIDDEN"); };
const noActions: PlanActions = { addPlace: blocked, setPlaceStatus: blocked, addExpense: blocked, deleteExpense: blocked, proposeSettlement: blocked, respondSettlement: blocked };

export function SupportPortal({ admin = false }: { admin?: boolean }) {
  const { t } = useI18n();
  const call = useServerFn(supportPortal);
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState("");
  const [scope, setScope] = useState("account");
  const [consent, setConsent] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<SupportGrant | null>(null);
  const [now, setNow] = useState(Date.now());
  const workspace = useQuery({ queryKey: ["support", admin ? "admin" : "workspace"], queryFn: () => call({ data: { action: admin ? "admin" : "workspace" } }), refetchInterval: 5000, retry: false });
  const preview = useQuery({ queryKey: ["support", "view", selected?.id], queryFn: () => call({ data: { action: "view", id: selected?.id } }), enabled: !!selected && grantOpen(selected, now), refetchInterval: 1000, retry: false, gcTime: 0 });
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  async function act(input: SupportInput) {
    setBusy(true);
    try {
      const result = await call({ data: input });
      if (!result.ok) { toast.error(t("support.denied")); return result; }
      if (result.token) { setIssued(result.token); setConsent(false); }
      await workspace.refetch();
      return result;
    } catch { toast.error(t("support.denied")); return { ok: false }; }
    finally { setBusy(false); }
  }
  const data = workspace.data;
  const visible = !!selected && grantOpen(selected, now) && preview.data?.ok && preview.data.protected;
  if (workspace.isPending) return <main className="mx-auto max-w-5xl px-4 py-10" aria-busy="true"><ShieldCheck className="animate-pulse text-primary" /></main>;
  if (!data?.ok) return <main className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-2xl font-bold">{t("support.denied")}</h1><Button variant="outline" onClick={() => workspace.refetch()}>{t("support.refresh")}</Button></main>;
  return <main className="mx-auto max-w-5xl px-4 py-8">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl font-bold">{t(admin ? "support.admin" : "support.title")}</h1><div className="flex gap-2">{!admin && data.admin && <Button asChild variant="outline"><Link to="/admin">{t("support.admin")}</Link></Button>}<Button variant="ghost" size="icon" aria-label={t("support.refresh")} onClick={() => workspace.refetch()}><RefreshCw /></Button></div></div>
    {selected && <section className="sticky top-16 z-20 mb-6 flex flex-wrap items-center justify-between gap-3 border border-destructive bg-background p-4" role="status">
      <div><p className="font-semibold text-destructive">{t("support.indicator")}</p><p className="money text-sm">{visible ? `${Math.floor(sessionSeconds(selected.expires_at, now) / 60)}:${String(sessionSeconds(selected.expires_at, now) % 60).padStart(2, "0")}` : t("support.ended")}</p></div>
      <Button variant="destructive" disabled={busy} onClick={async () => { const r = await act({ action: "exit", id: selected.id }); if (r?.ok) { setSelected(null); await preview.refetch(); } }}><LogOut />{t("support.exit")}</Button>
    </section>}
    {visible && preview.data?.view && <ProtectedExperience view={preview.data.view} />}
    {!admin && <form className="mb-8 max-w-xl space-y-4" onSubmit={async e => { e.preventDefault(); const r = await act({ action: "request", topic }); if (r?.ok) setTopic(""); }}><Label htmlFor="support-topic">{t("support.topic")}</Label><Input id="support-topic" required maxLength={500} value={topic} onChange={e => setTopic(e.target.value)} /><Button disabled={busy}>{t("support.request")}</Button></form>}
    {issued && <section className="mb-8 border-l-4 border-primary bg-surface-2 p-4"><Label htmlFor="issued-code">{t("support.code")}</Label><Input id="issued-code" readOnly value={issued} className="mt-2 font-mono" /><p className="mt-2 text-sm text-muted-foreground">{t("support.codeNotice")}</p></section>}
    <h2 className="mb-4 text-xl font-semibold">{t(admin ? "support.users" : "support.title")}</h2>
    {!data.requests?.length && <p className="text-muted-foreground">{t("support.empty")}</p>}
    <ul className="divide-y divide-border">{data.requests?.map(r => <li key={r.id} className="space-y-3 py-5">
      <p className="font-semibold">{admin ? t("support.user", { id: r.user_id.slice(0, 8) }) : r.topic}</p>
      {admin && <p className="text-sm text-muted-foreground">{t("support.provider")}: {r.providers?.map(p => p === "email" ? "Email" : p).join(", ") || "—"}</p>}
      {admin && r.status === "requested" && <Button disabled={busy} variant="outline" onClick={() => act({ action: "accept", id: r.id })}>{t("support.accept")}</Button>}
      {!admin && r.status === "accepted" && <div className="max-w-xl space-y-3"><Label htmlFor={`scope-${r.id}`}>{t("support.scope")}</Label><select id={`scope-${r.id}`} className="h-10 w-full rounded-md border border-input bg-background px-3" value={scope} onChange={e => setScope(e.target.value)}><option value="account">{t("support.account")}</option>{data.plans?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><label className="flex items-start gap-3 text-sm"><Checkbox checked={consent} onCheckedChange={v => setConsent(v === true)} /><span>{t("support.consent")}</span></label><Button disabled={busy || !consent || data.grants?.some(g => g.user_id === data.user_id && grantOpen(g, now))} onClick={() => act({ action: "authorize", id: r.id, target: scope === "account" ? "account" : "plan", ...(scope === "account" ? {} : { plan: scope }) })}>{t("support.authorize")}</Button></div>}
    </li>)}</ul>
    <ul className="mt-6 divide-y divide-border">{data.grants?.map(g => <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">{g.target === "account" ? t("support.account") : "Plan"} · {g.id.slice(0, 8)}</p><p className="text-sm text-muted-foreground">{!grantOpen(g, now) ? t("support.ended") : g.started_at ? t("support.active") : g.needs_organizer && !g.organizer_approved_at ? t("support.organizer") : t("support.pending")}</p></div><div className="flex flex-wrap items-center gap-2">
      {!admin && grantOpen(g, now) && <>{g.user_id !== data.user_id && g.needs_organizer && !g.organizer_approved_at && <><Button disabled={busy} onClick={() => act({ action: "approve", id: g.id })}>{t("support.approve")}</Button><Button variant="outline" disabled={busy} onClick={() => act({ action: "reject", id: g.id })}>{t("support.reject")}</Button></>}<Button variant="destructive" disabled={busy} onClick={() => { setIssued(null); return act({ action: "revoke", id: g.id }); }}>{t("support.revoke")}</Button></>}
      {admin && grantOpen(g, now) && (g.started_at ? <Button disabled={busy} onClick={() => setSelected(g)}>{t("support.viewAs")}</Button> : <div className="flex max-w-full flex-wrap gap-2"><Input className="w-56" aria-label={t("support.code")} type="password" autoComplete="off" value={codes[g.id] ?? ""} onChange={e => setCodes({ ...codes, [g.id]: e.target.value })} /><Button disabled={busy || !codes[g.id] || (g.needs_organizer && !g.organizer_approved_at)} onClick={async () => { const r = await act({ action: "start", id: g.id, token: codes[g.id] }); setCodes({}); if (r?.ok) { const fresh = await workspace.refetch(); setSelected(fresh.data?.grants?.find(x => x.id === g.id) ?? null); } }}>{t("support.start")}</Button></div>)}
    </div></li>)}</ul>
    {!!data.notifications?.length && <section className="mt-8 border-t border-border pt-6"><h2 className="text-xl font-semibold">{t("support.notifications")}</h2>{data.notifications.map(n => <p key={n.id} className="mt-3 text-sm">{t("support.notice")} <span className="text-muted-foreground">{new Date(n.starts_at).toLocaleString()} — {new Date(n.ends_at).toLocaleTimeString()}</span></p>)}</section>}
  </main>;
}

function ProtectedExperience({ view }: { view: ProtectedView }) {
  const { t } = useI18n();
  if (!view.plan) return <section className="mb-8 border-b border-border pb-8"><h2 className="text-2xl font-bold">{t("support.account")}</h2><p className="mt-3">{t("support.plans")}: {view.active_plans_member ?? 0}</p></section>;
  const members = (view.members ?? []).filter(m => m.status === "active").map((m, i) => ({ id: `member-${i}`, name: m.label, role: m.role }));
  const data: PlanData = { me: members.find(m => m.name === "Tú")?.id ?? "member-0", plan: { id: "protected", name: view.plan, type: "other", city: null, startDate: null, endDate: null, budgetCents: null, archived: false, currency: "EUR" }, members, places: (view.places ?? []).map((p, i) => ({ id: `place-${i}`, name: p.label, category: "other", status: "proposed", address: null, url: null, note: null, addedBy: "" })), expenses: [], settlements: [], memberLimit: null };
  return <section className="mb-8"><PlanView data={data} actions={noActions} initialTab="people" protectedView /><p className="mt-4 text-sm text-muted-foreground">{t("tab.expenses")}: {view.expenses_count ?? 0} · {t("support.hidden")}</p></section>;
}