import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, RotateCcw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { PlanView, Avatar } from "@/components/plan/plan-view";
import type { PlanActions, PlanData } from "@/components/plan/types";
import { demoScenario } from "@/lib/demo-scenario";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo: escapada con 4 amigos | SplitEasy" },
      { name: "description", content: "Prueba SplitEasy con un plan de ejemplo: cuatro amigos, lugares, gastos y balances." },
      { property: "og:title", content: "Demo: escapada con 4 amigos | SplitEasy" },
      { property: "og:description", content: "Prueba SplitEasy con un plan de ejemplo: cuatro amigos, lugares, gastos y balances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoPage,
});

let seq = 0;
const nid = (p: string) => `${p}-${Date.now()}-${seq++}`;

function DemoPage() {
  const { t } = useI18n();
  const [data, setData] = useState<PlanData>(demoScenario);
  const set = (fn: (d: PlanData) => PlanData) => { setData(fn); return Promise.resolve(); };

  const actions: PlanActions = {
    addPlace: (p) => set((d) => ({ ...d, places: [...d.places, { id: nid("pl"), name: p.name, category: p.category, address: p.address || null, url: p.url || null, note: p.note || null, status: "proposed", addedBy: d.me }] })),
    setPlaceStatus: (id, s) => set((d) => ({ ...d, places: d.places.map((p) => (p.id === id ? { ...p, status: s } : p)) })),
    addExpense: (e) => set((d) => ({ ...d, expenses: [{ id: nid("e"), description: e.description, category: e.category, amountCents: e.amountCents, paidBy: e.paidBy, date: e.date, createdBy: d.me, shares: e.shares, splitMethod: e.method, tipCents: e.tipCents, meta: e.meta }, ...d.expenses] })),
    updateExpense: (id, e) => set((d) => ({ ...d, expenses: d.expenses.map((x) => x.id === id ? { ...x, description: e.description, category: e.category, amountCents: e.amountCents, paidBy: e.paidBy, date: e.date, shares: e.shares, splitMethod: e.method, tipCents: e.tipCents, meta: e.meta } : x) })),
    deleteExpense: (id) => set((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) })),
    proposeSettlement: (to, cents) => set((d) => ({ ...d, settlements: [{ id: nid("s"), from: d.me, to, cents, status: "proposed" }, ...d.settlements] })),
    addMember: (name) => set((d) => d.memberLimit != null && d.members.length >= d.memberLimit ? d : ({ ...d, members: [...d.members, { id: nid("demo-p"), name, role: "member" }] })),
    renameMember: (id, name) => set((d) => ({ ...d, members: d.members.map((m) => (m.id === id ? { ...m, name } : m)) })),
    removeMember: (id) => set((d) => ({
      ...d, me: d.me === id ? (d.members.find((m) => m.role === "owner")?.id ?? d.me) : d.me,
      formerMembers: [...(d.formerMembers ?? []), ...d.members.filter((m) => m.id === id)],
      members: d.members.filter((m) => m.id !== id),
      settlements: d.settlements.map((s) => s.status === "proposed" && (s.from === id || s.to === id) ? { ...s, status: "cancelled" } : s),
    })),
    respondSettlement: (id, s) => set((d) => {
      const st = d.settlements.find((x) => x.id === id);
      if (!st || st.to !== d.me) throw new Error("ONLY_RECEIVER");
      return { ...d, settlements: d.settlements.map((x) => (x.id === id ? { ...x, status: s } : x)) };
    }),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-secondary p-3 text-sm">
        <FlaskConical className="size-5 text-accent" aria-hidden />
        <p className="flex-1">{t("demo.banner")}</p>
        <Button size="sm" variant="ghost" onClick={() => setData(demoScenario())}><RotateCcw className="size-4" />{t("demo.reset")}</Button>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Ver como / View as">
        <UserRound className="size-4 text-muted-foreground" aria-hidden />
        {data.members.map((m, i) => (
          <button key={m.id} type="button" aria-pressed={data.me === m.id} onClick={() => setData((d) => ({ ...d, me: m.id }))}
            className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors ${data.me === m.id ? "border-primary bg-card shadow-soft" : "border-border text-muted-foreground"}`}>
            <Avatar name={m.name} i={i} />{m.name}
          </button>
        ))}
      </div>
      <PlanView data={data} actions={actions} />
      <div className="mt-10 text-center">
        <Button asChild size="lg" className="rounded-full px-7"><Link to="/app">{t("demo.cta")}</Link></Button>
      </div>
    </main>
  );
}
