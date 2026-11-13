import { splitEqual } from "@/lib/money";
import type { PlanData } from "@/components/plan/types";

// Sample data that lives only in the browser (never written to the database).
const ids = { ana: "demo-ana", bruno: "demo-bruno", carla: "demo-carla", diego: "demo-diego" };
const all = Object.values(ids);

export function demoScenario(): PlanData {
  return {
    me: ids.ana,
    memberLimit: 4,
    plan: { id: "demo", name: "Escapada a Cadaqués", type: "getaway", city: "Costa Brava", startDate: "2026-11-20", endDate: "2026-11-22", budgetCents: 60000, archived: false, currency: "EUR" },
    members: [
      { id: ids.ana, name: "Ana", role: "owner" },
      { id: ids.bruno, name: "Bruno", role: "admin" },
      { id: ids.carla, name: "Carla", role: "member" },
      { id: ids.diego, name: "Diego", role: "member" },
    ],
    places: [
      { id: "pl1", name: "Casa rural Mas Blau", category: "lodging", address: "Cadaqués", url: null, note: "2 noches, 4 camas", status: "chosen", addedBy: ids.ana },
      { id: "pl2", name: "Restaurante Es Baluard", category: "restaurant", address: "Riba Nemesi Llorens", url: null, note: "Cena del sábado", status: "proposed", addedBy: ids.carla },
      { id: "pl3", name: "Cap de Creus", category: "sight", address: "Parc Natural", url: null, note: "Ruta al faro", status: "proposed", addedBy: ids.bruno },
    ],
    expenses: [
      { id: "e1", description: "Casa rural (2 noches)", category: "lodging", amountCents: 32000, paidBy: ids.ana, date: "2026-11-20", createdBy: ids.ana, shares: splitEqual(32000, all) },
      { id: "e2", description: "Gasolina y peajes", category: "transport", amountCents: 8550, paidBy: ids.bruno, date: "2026-11-20", createdBy: ids.bruno, shares: splitEqual(8550, all) },
      { id: "e3", description: "Cena Es Baluard", category: "food", amountCents: 14240, paidBy: ids.carla, date: "2026-11-21", createdBy: ids.carla, shares: splitEqual(14240, all) },
      { id: "e4", description: "Kayak (3 personas)", category: "tickets", amountCents: 9000, paidBy: ids.diego, date: "2026-11-21", createdBy: ids.diego, shares: splitEqual(9000, [ids.ana, ids.bruno, ids.diego]) },
    ],
    settlements: [],
  };
}
