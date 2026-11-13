# Feature 004 — Etapa 1: diseño y documentación (revisión 2)

Solo documentos. Sin cambios en código, base de datos, autenticación, RLS, cálculos, Google Places ni publicación.

## Qué cambia respecto al diseño ya cerrado
El documento actual (`phase-04-premium.md`, dirección "Papel y Marea") se centraba en corregir la app de gastos. Lo reescribo alrededor de la nueva North Star: **PLAN → GO → SHARE** y **LESS TYPING. MORE LIVING.** Los gastos pasan a ser el tercer paso, no el protagonista.

## Entregables (en `docs/architecture/phase-04-premium.md`)
1. **Sistema de diseño:** se mantiene la marca (crema, verde azulado, coral, Bricolage Grotesque + Figtree). Añade superficies en capas, radios, elevación, cifras tabulares, escala de movimiento y contraste AA en claro y oscuro.
2. **Pantallas principales**, con un esquema por pantalla para móvil y escritorio:
   - **Portada inmersiva:** hero a pantalla completa con imagen de viaje, maqueta real del producto y los tres pasos PLAN / GO / SHARE.
   - **Descubre:** tarjetas grandes con la foto como protagonista, estilo catálogo de viajes. Sin Google, los lugares manuales usan una ilustración por categoría (imagen propia generada, sin licencias). Con Google Places, las fotos solo aparecen dentro de los componentes oficiales de Google (ADR-003).
   - **Crear plan en 3 toques:** idea → fechas → invitar. Plantillas ("Escapada", "Cena", "Viaje") para escribir menos.
   - **Plan:** portada del plan, avatares de los participantes, lugares e itinerario.
   - **Gastos y balances:** "quién paga a quién" en una tarjeta grande, barra de presupuesto con límite marcado, cifras de contabilidad.
   - Acceso, invitación, perfil, error 404 y estados vacíos con ilustración.
3. **Navegación móvil:** barra inferior con 4 pestañas (Inicio, Descubre, Planes, Perfil) y un botón central "+ Plan". En escritorio, la barra superior se simplifica.
4. **Componentes reutilizables:** PlanCover, PlaceCard, MemberStack, MoneyFigure, BalanceCard, EmptyState, BottomNav, StepWizard, ThemeSwitcher.
5. **Microinteracciones:** elevación al pasar el ratón o tocar, transiciones entre pestañas, confirmación animada al saldar una deuda. Se respeta "reducir movimiento" del sistema.
6. **Accesibilidad y rendimiento:** AA, foco visible, uso completo con teclado, objetivos táctiles de 44 px, imágenes optimizadas y cargadas solo cuando se ven.
7. **Implementación en etapas**, cada una con tu aprobación aparte: (1) colores y tipografía → (2) navegación móvil → (3) portada → (4) creación de planes → (5) plan, lugares y Descubre → (6) gastos y balances → (7) pulido y pruebas.
8. **Criterios de aceptación** por etapa: claro, oscuro y sistema; ES/EN; 390 px y 1280 px; las pruebas actuales siguen pasando; ningún cambio en datos ni cálculos.

## Otros documentos
- `docs/adr/ADR-004-identidad-visual.md`: actualizado con la North Star, la navegación inferior y la regla de fotos (ilustraciones propias; las fotos de Google solo dentro de sus componentes).
- Entradas en `CHANGELOG.md` y `roadmap.md`.

## Decisión pendiente para ti
La "Descubre con fotos" real depende de Google Places, que aún no está autorizado. Hasta entonces se diseña con ilustraciones propias por categoría.
