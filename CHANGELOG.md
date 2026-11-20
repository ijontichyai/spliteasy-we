# Changelog

## UI-002 — Segunda iteración visual
- Inicio: «Tu plan activo» con lo pagado, lo que debes y lo que te deben (saldos de plan_balances).
- Perfil: avatar con iniciales, idioma, apariencia, Premium, soporte y cerrar sesión visibles.
- Tarjetas de planes: total de gastos con estados de carga y error.

## UI-001 — Primera iteración visual
- Barra inferior móvil con etiqueta «Plan» bajo el botón +.
- Planes: pestañas Activos/Finalizados, tarjetas con foto «Ilustrativo» y botón «Ver plan».
- Descubrir: etiqueta «Ilustrativo» en fotos y botón principal de acción.

## BRAND-001 — Identidad oficial (2026-11-14)
- Logos oficiales en public/brand/; cabecera (logo horizontal en escritorio, icono en móvil), portada y tarjeta de acceso/registro; variante clara/oscura según el tema.
- Favicon y apple-touch-icon generados del icono aprobado; eliminado favicon.ico por defecto.
- Defectos del material de origen documentados en docs/brand/spliteasy-brand.md.

## DEMO-002 BUG-001 — 2026-11-14
- Fix: participant pencil did nothing because the browser prompt dialog is blocked inside the preview frame; replaced with an inline rename form. Expenses and balances unaffected (ids unchanged).
- Same cause fixed for "Leave plan"/"Remove" confirmation: inline confirmation instead of the blocked browser dialog.

## GROUPS-003 + DEMO-002 — 2026-11-14
- Demo: add, rename and remove fictional participants (browser only).
- Real plans: participants can leave; organizer removes anyone, co-admins remove members (DB function remove_plan_member, migration 0010).
- Leaving/removal requires a zero balance; history kept, pending settlements cancelled, new expenses split among active members only.
- Tests: 46/46 (8 new). Not tested: leave/remove with real signed-in accounts.

## EXPENSES-002/003 — Reparte: edición, métodos de reparto y propinas (2026-11-14)
- Editar gastos (concepto, importe, fecha, categoría, pagador, participantes) con nueva función transaccional `update_expense`; balances recalculados al momento.
- Métodos: a partes iguales, por consumo individual (resto común a partes iguales), por porcentajes (suma 100 %, resto mayor) e importes personalizados.
- Propinas: 5/10/15 %, porcentaje libre o importe fijo, repartida solo entre las personas elegidas.
- Seguridad: mismos permisos que borrar (creador u organizador/admin), plan no archivado, miembros activos, suma exacta; gastos incluidos en una liquidación confirmada quedan bloqueados para editar y borrar (`EXPENSE_LOCKED`); ediciones simultáneas rechazadas (`STALE_EXPENSE`); clave de idempotencia por formulario evita duplicados.
- Migración 0009. Sin cambios en Premium, roles ni pagos. Pruebas: 38/38 (12 nuevas de cálculo y redondeo). Demo verificada en navegador; flujo con cuenta real NO PROBADO.

## RELEASE-001 — Auditoría pre-lanzamiento (2026-11-14)
- Vista protegida: textos 'solo lectura, importes ocultos'.
- Dependencias parcheadas (12 -> 3 avisos; queda zod 3). Actualización de TanStack revertida por incompatibilidad.
- Informe: docs/release/release-001-audit.md. Sin publicar, sin pagos reales.

## BILLING-001.1 — 2026-11-14
- Eliminada la gestión integral de Stripe (+3,5 %); sin cálculo automático de impuestos.
- 1,49 / 3,99 / 29,99 € son importes finales; precios Sandbox conservados (no fue necesario sustituirlos).
- Nueva prueba de regresión; 24/24 PASS. Obligaciones fiscales documentadas en docs/security/billing-001-report.md.

## AUTH-003 — cierre y View as User protegido — 14 nov 2026
- Confirmada la corrección de revocación por externos: AUTH-003.1 49/49 PASS; AUTH-002.2 29/29 PASS; AUTH-002.1b ocho escenarios (36 comprobaciones) PASS, antes y después de ampliar.
- Añadidos `/support` y `/admin`, ES/EN: solicitudes, consentimiento, código de un solo uso, aprobación/rechazo del organizador, revocación, notificaciones y vista protegida con salida visible y contador.
- Migración aditiva `0007_auth_003_admin_support_portal.sql`: dispatcher transaccional auditado; operaciones del panel exclusivas para admin. RLS existente, login y proveedores intactos.
- Administrador permanece con su propia identidad; no datos personales/financieros reales en la vista, no credenciales de terceros, sin modo real.
- 21/21 comprobaciones nuevas del dispatcher, 19/19 pruebas de app y flujo navegador real con A/B/C/D PASS. Última compilación observada correcta.
- Escaneo rápido: solo aviso informativo por lectura autenticada de límites públicos del producto, comportamiento intencionado. Escaneo profundo iniciado; resultado pendiente y no incluido en los PASS.
- Cuenta D recibió admin temporal durante el flujo de navegador para separar soporte y organizador; revocado al terminar. Cuentas conservadas; solo datos QA modificados. Informe: `docs/security/auth-003-1-report.md`. Sin publicar.

## AUTH-002.1 — Endurecimiento RLS (R1, R2) — 14 nov 2026

- **R1:** `shares_plan_with` exige ahora `status='active'` en ambos miembros. Los ex-participantes dejan de ver perfiles de su antiguo grupo y viceversa.
- **R2 (vulnerabilidad corregida):** los usuarios podían actualizar `premium_sponsored` y `sponsor_id` de `plans` (autopatrocinio Premium). Se revoca el UPDATE de tabla a `anon` y `authenticated` (y todo acceso de `anon`), y se concede UPDATE solo en `name, type, start_date, end_date, city, estimated_budget, status`. Nuevo trigger `plans_protect` (`plans_protect_columns`) rechaza cambios de usuario en `premium_sponsored, sponsor_id, owner_id, archived_at, archived_by, currency, created_at`; las funciones del servidor (archivar) no se ven afectadas.
- Migración: `drizzle/migrations/0003_auth_002_1_rls_hardening.sql`. Sin cambios de datos, frontend, login, roles ni pagos.
- Verificado: permisos por columna (premium_sponsored/sponsor_id sin UPDATE; name sí; anon sin acceso), función y trigger presentes. Pendiente: prueba de comportamiento con 3 usuarios simulados (el acceso directo a la base de datos desde el entorno de pruebas no estuvo disponible).
- Riesgos pendientes: R3–R6 del análisis AUTH-002.

## Descubre — fotografías de inspiración (13 nov 2026, UTC)
- Sustituidas las cuatro ilustraciones por fotografías reales con licencia Pexels y créditos enlazados: playa mediterránea al amanecer, mercado local, montañas al atardecer y cena bajo luces cálidas.
- WebP de 600/1200 px servidos por Lovable Assets, carga diferida y recorte 16:10. Aviso y textos alternativos ES/EN; retiradas las etiquetas ilustrativas de esta sección.
- Conservados los enlaces de las tarjetas, temas y búsqueda Google sin modificaciones. Procedencia y licencia: docs/architecture/discover-photography.md. Sin publicar.

## Descubre — revisión de tarjetas propias (13 nov 2026, UTC)
- Revisión autorizada del uso EEE: compartir un lugar en un plan y mostrar un catálogo independiente de inspiración no tienen automáticamente el mismo alcance permitido. Pendiente confirmación escrita de Google o revisión jurídica antes de sustituir los componentes oficiales por tarjetas propias.
- Confirmado documentalmente que Place Search existe en Essentials; múltiples resultados no requieren necesariamente Pro.
- Documentadas la necesidad de conexión/clave de servidor separada, costes, atribuciones y limitaciones de persistencia. La integración de navegador permanece intacta; no se han conectado servicios nuevos ni publicado.
- 15/15 pruebas aprobadas y último resultado de compilación observado correcto. Sin verificación nueva de Google en vivo ni del commit remoto de GitHub.

## Revisión técnica y Git — 13 nov 2026 (UTC)
- Actualizada la documentación de Google Places: secreto por nombre (sin valor), APIs necesarias, orígenes exactos del editor/Preview/publicado, restricciones HTTP, cuotas y alertas.
- Documentados los errores históricos y su causa, la confirmación del usuario y las limitaciones reales (incluida la no persistencia de `place_id`). 15/15 pruebas aprobadas de nuevo.
- Comprobado historial local y árbol limpio previo a la documentación; repositorio, rama y commit remotos de GitHub sin verificar desde esta sesión. Ver docs/architecture/phase-04-premium.md.
- Solo documentación; sin publicar ni modificar la integración operativa.

## Descubre — aviso de contenido ilustrativo (14 nov 2026)
- El aviso de las tarjetas ilustrativas ya no anuncia los lugares reales de Google como algo futuro: dirige a la búsqueda de Google, que ya funciona.
- Se conservan las cuatro tarjetas de inspiración, su etiqueta "Ilustrativo" y el espacio reservado para la ficha oficial de Google (ADR-003).
- Sin cambios en la integración de Google Places, la base de datos, RLS ni autenticación.

## Feature 003 — Google Places en Descubre (13 nov 2026)
- Descubre: buscador real con Places UI Kit Essentials (autocompletar básico + ficha oficial de Google). Atribuciones intactas, sin mapa.
- Clave de navegador del Google Cloud propio, guardada como secreto `Google_Maps_API_Key` y entregada al navegador por una función del servidor (clave restringida por dominio y API).
- "Crear un plan con este lugar" abre el creador con el nombre del lugar como sugerencia editable. El `place_id` no se guarda aún en la base de datos (requiere autorización).
- Error o cuota agotada: mensaje claro, sin reintentos; los lugares manuales siguen disponibles.
- Comprobado: 15 pruebas, compilación limpia, Descubre en móvil sin errores. Pendiente: búsqueda real «cafeterías en Barcelona» en el sitio publicado.

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

## AUTH-002.1b — 2026-11-14
- Validación RLS con 4 cuentas de prueba: 8/8 escenarios PASS. Informe: docs/security/auth-002-1b-report.md. Sin cambios de esquema.

## AUTH-002.2 (diseño) — 2026-11-14
- Diseño de roles de plataforma (user_roles, has_role, is_admin) y admin_audit_log inmutable. Documento: docs/architecture/auth-002-2-admin-roles.md. Base de datos sin cambios.

## AUTH-002.2 — 2026-11-14
- Implementados roles de plataforma y auditoría inmutable; A admin temporal. 29/29 pruebas nuevas y 8/8 regresión PASS. Informe: docs/security/auth-002-2-report.md.

## AUTH-003 (diseño) — 2026-11-14
- Propuesta de soporte seguro y "ver como usuario" sin suplantación real. Documento: docs/architecture/auth-003-support-sessions.md. Sin cambios en BD.

## BILLING-001 — 2026-11-14
- Premium subscriptions in test mode: three plans, /premium page with carousel and status, embedded checkout, success/cancel pages, billing portal, signed webhook, read-only subscriptions table. See docs/security/billing-001-report.md. Live not activated, not published.

## 2026-11-14 BILLING-001.2
- Stripe checkout/portal return URLs fixed server-side to SplitEasy origins; 2 tests added (26/26).

## BRAND-001.2 — Corrección final de identidad visual
- Sustituidos logotipos claro/oscuro, símbolo, icono 256, favicon transparente (32 px) e iconos de inicio azul marino (192/512) con los archivos de SplitEasy_Brand_Replacement_v2. Sin regenerar arte.
- Dimensiones del logotipo actualizadas a 1920×550; enlaces con `?v=2` para invalidar caché.
