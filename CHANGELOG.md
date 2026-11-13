# Changelog


## 2026-11-13 — Feature 004 implementación (Papel y Marea)
- Sistema de diseño: superficies `surface-1/2/3`, sombras `elevation-1/2/3`, `bg-premium`, utilidad `money` y dígitos tabulares en todo el texto; contraste corregido (campos en claro; borde y texto secundario en oscuro); `prefers-reduced-motion` respetado.
- Header: idioma y tema en un menú en móvil; "Entrar" oculto en `/auth`; enlace a Descubre en escritorio.
- Barra inferior móvil (Inicio, Descubre, Planes, Perfil + botón central "+ Plan" de 56 px) con espacio reservado y safe-area.
- Portada: hero con escala display y maqueta del producto hecha con tokens (sin imágenes); tarjetas de pilares con icono en contenedor y elevación.
- Nueva página `/descubre` (`/discover`): ilustraciones SVG propias con etiqueta "Ilustrativo" y espacio reservado para la ficha oficial de Google (ADR-003).
- Crear plan en 3 pasos (Idea → Fechas → Invitar); solo el nombre es obligatorio y se puede crear desde cualquier paso.
- Sin cambios en base de datos, RLS, autenticación, invitaciones ni cálculos. 15 tests en verde.
- Pendiente: rediseño interno de la vista de plan (presupuesto segmentado, filas de gasto con icono, barras de saldo), autenticación a dos columnas y estados vacíos.

## 2026-11-13 — Feature 004 (diseño cerrado con ajustes, sin implementación)
- Aprobada la dirección "Papel y Marea". Ajustes: Descubre inmersivo con contenido ilustrativo etiquetado, contenedores listos para Places UI Kit, crear plan con solo el nombre, barra inferior de 4 pestañas con "+ Plan".
- Documentos: phase-04-premium.md (revisión 2) y ADR-004 (addendum). Sin cambios en código ni en la base de datos.

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
