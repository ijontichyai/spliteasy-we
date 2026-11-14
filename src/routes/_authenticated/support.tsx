import { createFileRoute } from "@tanstack/react-router";
import { SupportPortal } from "@/components/support/portal";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [
    { title: "Soporte y autorizaciones | SplitEasy" },
    { name: "description", content: "Solicitudes y consentimiento de soporte protegido en SplitEasy." },
    { property: "og:title", content: "Soporte y autorizaciones | SplitEasy" },
    { property: "og:description", content: "Gestiona y revoca autorizaciones de soporte." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: SupportPortal,
});