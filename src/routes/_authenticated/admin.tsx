import { createFileRoute } from "@tanstack/react-router";
import { SupportPortal } from "@/components/support/portal";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Administración protegida | SplitEasy" },
    { name: "description", content: "Panel restringido de soporte protegido de SplitEasy." },
    { property: "og:title", content: "Administración protegida | SplitEasy" },
    { property: "og:description", content: "Sesiones de soporte consentidas y auditadas." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SupportPortal admin />,
});