# Changelog

## 2026-11-13 — Corrección de definición de producto (sin código)
- Nueva meta: «Los amigos convierten cualquier idea en un plan que viven juntos.»
- Nueva métrica principal: planes de grupo completados por al menos dos participantes cada mes.
- SplitEasy se define como plataforma social de planificación y descubrimiento (PLAN → GO → SHARE), no como app de repartir gastos. Filosofía: «LESS TYPING. MORE LIVING.»
- Sin cambios en código, base de datos ni funcionalidad.

## 2026-11-13 — Feature 004 (diseño cerrado, sin implementación)
- Rediseño visual de la app: sistema de diseño (superficies en capas, elevación, tipografía, dígitos tabulares, motion mínimo).
- Auditoría sobre capturas reales: mitad del escritorio vacía, tarjetas sin elevación, contraste AA fallado en oscuro, listas con aspecto CRUD.
- Documentado en docs/architecture/phase-04-premium.md y ADR-004.
- Sin cambios en base de datos, RLS, autenticación, cálculos ni servicios. Sin publicar.

## 2026-11-13 — Feature 003 (diseño cerrado, sin implementación)
- Google Places mediante Places UI Kit (Essentials), Google Cloud propio, facturación EEE.
- Documentado en docs/architecture/google-places-integration.md y ADR-003.
- Sin activar servicios, sin migraciones ni cambios en la app.

## 2026-11-13 — UI Enhancement 002
- Tarjetas de la portada interactivas: Planifica → Mis planes; Descubre → Lugares; Reparte → Gastos.
- Con un plan activo se abre directamente; con varios se pide elegir; sin planes se ofrece crear uno.
- Sin sesión: se pide entrar y después se continúa al destino (solo rutas internas).
- Hover, foco visible y teclado; textos ES/EN. Sin cambios en base de datos, RLS ni cálculos.

## 2026-11-13 — UI Enhancement 001
- Temas Claro / Oscuro / Sistema con selector accesible junto a ES/EN.
- Preferencia guardada en el navegador (`spliteasy.theme`); script en `<head>` evita parpadeos.
- Solo cambios visuales: sin cambios en base de datos, autenticación, RLS ni cálculos.

## 2026-11-13 — Sprint Demo
- CORE 1: planes, participantes, invitaciones seguras, archivado.
- CORE 2: lugares manuales en el plan.
- CORE 3: gastos, repartos, balances, liquidaciones confirmadas por el receptor.
- Demo local con 4 amigos en `/demo`.
- Detalle: docs/architecture/sprint-demo-core.md

## 2026-11-13 — Fase 02
- Autenticación por email con confirmación, perfiles, límites gratuitos, interfaz ES/EN.

## 2026-11-13 — Fase 01
- Diseño arquitectónico y ADR-001.
