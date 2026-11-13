# Feature 004 — Premium UI/UX Revolution (rediseño visual)

**Estado:** implementación autorizada y en curso (13 nov 2026). Ver "Resultado de implementación" al final.
**Alcance acordado:** rediseño visual de la app. Solo diseño y documentación.
**Decisión:** [ADR-004](../adr/ADR-004-identidad-visual.md).

## 1. Alcance

**Dentro:**
- Sistema de diseño documentado: tokens, tipografía, elevación, color, motion.
- Rediseño de todas las pantallas: `/`, `/auth`, `/reset-password`, `/app`, `/plans/$planId`, `/demo`, `/join/$token`, `/profile`, 404 y error, avisos y ventanas.
- Corrección de contraste en claro y oscuro (WCAG AA).
- Header y navegación móvil.
- Textos nuevos en ES/EN.

**Fuera (sin cambios):**
- Base de datos, RLS, migraciones, funciones seguras.
- Autenticación y reglas de acceso.
- Cálculos financieros (`src/lib/money.ts`) y su fórmula.
- Lógica de invitaciones, planos y límites.
- Google Places (Feature 003), Stripe, IA, servicios de pago.
- Publicación.

## 2. Auditoría del estado actual (13 nov 2026)

Capturas reales de la app en ejecución: portada, `/demo`, `/auth`, a 1280 px y 390 px, claro y oscuro.

| # | Hallazgo | Dónde |
|---|---|---|
| A1 | La mitad inferior del escritorio queda en blanco: el contenido termina antes de la mitad de la pantalla. | Portada, `/demo`, `/auth` |
| A2 | El hero no muestra el producto: sin maqueta, captura o ilustración que enseñe qué es SplitEasy. | Portada |
| A3 | Tarjetas de pilares planas: sombra casi invisible sobre fondo casi idéntico, icono de línea fino sin contenedor, título pequeño. | Portada |
| A4 | El botón secundario ("Ver demo con 4 amigos") casi no se distingue del fondo, en claro y en oscuro. | Portada |
| A5 | Oscuro: la superficie de la tarjeta apenas se separa del fondo y el texto secundario no alcanza el contraste AA. | Portada, `/demo` |
| A6 | Autenticación: tarjeta flotando sobre espacio muerto, bordes de los campos casi invisibles, enlaces de ayuda de bajo contraste, y el header repite "Entrar" en la propia pantalla de entrar. | `/auth` |
| A7 | Móvil: header apretado (marca + idioma + selector de tema + entrar) y tarjetas cortadas sin indicar que se puede deslizar. | 390 px |
| A8 | Barra de presupuesto monolítica: sin marca del límite, sin cuánto se ha excedido, sin desglose. | `/demo`, plan |
| A9 | Lista de gastos con aspecto de tabla CRUD: filas separadas por líneas finas, avatar de una letra, icono de basura genérico, y "categoría · quién pagó · fracción" apelotonado en una sola línea tenue. | Plan |
| A10 | Las cifras no parecen de un libro de cuentas: mismo tipo de letra y peso que las etiquetas, sin alineación de decimales. | Plan |
| A11 | Estados vacíos sin tratamiento: una frase suelta de texto tenue. | Plan |

## 3. Dirección visual

**Opción A — "Papel y Marea" (recomendada).**
Papel cálido, verde azulado profundo y coral, tipografía editorial, superficies en capas y dinero tratado como contabilidad. Mantiene la marca actual (Bricolage Grotesque + Figtree, crema/teal/coral) y la lleva a nivel premium. Sin fotografías: todo el peso visual sale de CSS y SVG propios, así que no hay licencias ni coste.

**Opción B — "Nocturno Editorial".** Prioriza el modo oscuro, mucho contraste, tipografía muy grande y filetes finos. Más arriesgada y menos coherente con el modo claro ya aprobado.

**Opción C — "Diario de Viaje".** Textura de papel, sellos y billetes, tono juguetón. Encantadora pero poco creíble para una app que mueve dinero.

Se propone A: es la única que aprovecha lo ya aprobado (UI Enhancement 001, Feature 003) sin tirar trabajo.

## 4. Sistema de diseño propuesto

### 4.1 Tokens nuevos (`src/styles.css`)

Superficies en capas, para que tarjeta y fondo se distingan siempre:

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--surface-1` | `oklch(0.995 0.006 85)` | `oklch(0.245 0.025 200)` | Tarjeta normal |
| `--surface-2` | `oklch(0.982 0.012 85)` | `oklch(0.29 0.028 200)` | Tarjeta destacada, filas activas |
| `--surface-3` | `oklch(0.96 0.016 85)` | `oklch(0.335 0.03 200)` | Encabezados de sección, chips |
| `--elevation-1` | sombra suave 2 capas | idem, más opaca | Tarjetas en reposo |
| `--elevation-2` | 3 capas, 12–28 px | idem | Tarjetas al pasar el cursor, ventanas |
| `--elevation-3` | 3 capas, 28–60 px | idem | Diálogos, menú móvil |
| `--gradient-premium` | teal → teal claro 135° | teal claro → teal profundo | CTA principal, hero del plan |
| `--money` | `font-variant-numeric: tabular-nums` | idem | Toda cifra |

Correcciones de contraste (A5, A6):
- Oscuro: `--muted-foreground` de `oklch(0.79 0.025 205)` a `oklch(0.84 0.022 200)`; `--border` de `oklch(0.34 0.028 200)` a `oklch(0.38 0.03 200)`.
- Claro: `--input` de `oklch(0.86 0.02 85)` a `oklch(0.80 0.025 85)` para que los campos se vean (A6).
- Botón secundario con fondo `--surface-2` + borde visible + sombra `--elevation-1` (A4).

### 4.2 Tipografía

Escala con ratio 1,25 sobre 16 px: `meta 12 · sm 14 · base 16 · lg 20 · xl 25 · 2xl 31 · 3xl 39 · display clamp(40px, 6vw, 78px)`.
- `display`, `3xl`, `2xl`: Bricolage Grotesque 700, `letter-spacing -0.02em`.
- `base`/`lg`: Figtree 400/500, `line-height 1.6`.
- Cifras: Figtree 600 con `--money`; totales en Bricolage Grotesque 700.
- Se añaden los pesos que falten a la `<link>` de fuentes (hoy solo 600/700 y 400/500/600).

### 4.3 Motion
- 150 ms transiciones de color/borde, 200 ms elevación y aparición, `ease-out`.
- Al pasar el cursor: `translateY(-2px)` + `--elevation-2`. Sin giros ni parallax.
- `prefers-reduced-motion: reduce` desactiva desplazamientos y apariciones.

### 4.4 Iconografía
Cada gasto y cada lugar lleva su icono de categoría dentro de un contenedor redondeado de 36–40 px con fondo `--surface-3` (A3, A9). Avatares con dos iniciales y color estable por miembro (ya existe) sobre anillo `--surface-1`.

## 5. Pantallas y cambios

| Pantalla | Cambios |
|---|---|
| Header | Altura y ritmo respirados; en móvil, idioma y tema pasan a un menú; se oculta "Entrar" cuando ya se está en `/auth`; foco visible en todo |
| Portada hero | Titular con escala nueva, y a la derecha una maqueta del producto hecha con CSS/SVG (A2); los dos botones con jerarquía clara (A4) |
| Tarjetas de pilares | Icono en contenedor de color, título a `xl`, `--surface-1` + `--elevation-1`, al pasar el cursor `--elevation-2`; en móvil carrusel con indicador de deslizamiento (A3, A7) |
| Autenticación | Two-column: a la izquierda valor del producto, a la derecha el formulario (A6); campos con borde visible y estado de foco claro; enlaces de ayuda con contraste AA |
| Mis planes | Rejilla de tarjetas con estado (activo/archivado), barra de límite del plan gratuito y una acción clara por tarjeta |
| Plan | Hero con presupuesto segmentado: barra con marca del límite y etiqueta de excedido (A8); pestañas con tratamiento propio; lista de gastos con icono de categoría, chip de quién pagó y cifra alineada (A9, A10) |
| Balances | Fila por persona con barra de saldo (debe / recibe) y el "quién paga a quién" como tarjetas de traspaso |
| Estados vacíos | Icono, una frase y un botón de acción (A11) |
| `/demo` | Mismo sistema, con el aviso de modo demo como cinta discreta |
| Avisos y ventanas | `--elevation-3`, borde visible, coherentes en los tres temas |

## 6. Accesibilidad y responsive
- Contraste AA: 4,5:1 en texto de cuerpo, 3:1 en títulos y elementos de interfaz, en claro y oscuro.
- Todo lo accionable alcanzable con teclado y con anillo de foco visible.
- Zona táctil mínima 44 × 44 px.
- 390 px sin contenido cortado ni tarjetas que se corten sin aviso.
- ES/EN en todos los textos nuevos.

## 7. Coste
**0 €.** Sin servicios de pago, sin fotografías ni ilustraciones con licencia, sin fuentes de pago (Google Fonts). No se toca la facturación de nada.

## 8. Etapas (cada una necesita autorización expresa)
1. Tokens y base: `src/styles.css`, pesos de fuente, utilidades `--surface-*`, `--elevation-*`, `--money`. Sin cambios de maquetación.
2. Header y portada (hero + tarjetas de pilares).
3. Autenticación, recuperación, unirse por enlace y perfil.
4. Vista de plan: hero, pestañas, gastos, lugares, balances, presupuesto.
5. Estados vacíos, avisos, ventanas, `/demo` y pasada de contraste oscuro.
6. Revisión con capturas, pruebas, `CHANGELOG.md`.

## 9. Criterios de aceptación
- Ninguna pantalla de escritorio deja la mitad inferior vacía (A1).
- Texto secundario y bordes pasan AA en claro y oscuro (A5, A6).
- Todas las cifras con dígitos tabulares alineados; el presupuesto muestra el límite y el excedido (A8, A10).
- Cada fila de gasto y lugar muestra su categoría con icono (A9).
- Móvil a 390 px: header sin aglomeración, nada cortado, todo accionable con 44 px.
- Navegable con teclado, foco visible en todos los elementos.
- Los 3 temas (claro/oscuro/sistema) y ES/EN funcionan en cada pantalla.
- Sin cambios en base de datos, RLS, autenticación ni cálculos: los 14 tests siguen en verde.

## 10. Pruebas
- Capturas antes/después de cada pantalla, en 1280 y 390 px, claro y oscuro.
- Comprobación de contraste de los pares texto/fondo modificados.
- Recorrido solo con teclado: portada → entrar → plan → gasto → balance.
- `prefers-reduced-motion` activado: sin desplazamientos.
- Pruebas existentes (`money`, `i18n`, `theme`, `app-routing`) sin regresión.

## 11. Riesgos
- La maqueta del hero hecha con CSS/SVG puede quedar simple; alternativa: capturas reales de `/demo` tratadas como imagen.
- Cambiar tokens afecta a todas las pantallas a la vez: por eso la etapa 1 es solo de tokens y se revisa antes de seguir.
- El modo oscuro es el más expuesto (A5); se revisa con capturas propias, no de memoria.
- Ningún riesgo económico: no se activan servicios.

## Revisión 2 — Aprobación con ajustes (13 nov 2026)

**Estado:** dirección "Papel y Marea" aprobada. Diseño cerrado a nivel documental. **Implementación NO autorizada.**

**North Star:** "Los amigos convierten cualquier idea en un plan que viven juntos." Filosofía: PLAN → GO → SHARE · LESS TYPING. MORE LIVING.

### R2.1 Descubre
- Experiencia inmersiva: imagen protagonista y tarjetas grandes.
- Sin Google Places: ilustraciones propias o fotos con licencia adecuada, **solo para demostración**.
- Todo el contenido ilustrativo lleva la etiqueta visible "Ilustrativo" / "Illustrative" y nunca se presenta como dato real.
- Los contenedores de las tarjetas reservan un espacio para el componente oficial de Places UI Kit. Ese espacio conserva la presentación y la atribución de Google, y no se superpone nada propio (ADR-003).

### R2.2 Crear plan
- Tres pasos: Idea → Fechas → Invitar.
- Solo el nombre es obligatorio. Fechas e invitaciones se pueden saltar ("Lo decido después") y completarse más tarde desde el plan.

### R2.3 Navegación móvil
- Barra inferior con Inicio, Descubre, Planes y Perfil.
- Botón central "+ Plan" elevado, con objetivo táctil de 44 px o más y etiqueta accesible.
- Espacio inferior reservado (con safe-area) para que nunca tape contenido.

### R2.4 Funciones que no cambian
Acceso, RLS, planes y participantes, invitaciones, gastos y balances, liquidaciones, demo de cuatro amigos, ES/EN y los temas claro, oscuro y sistema.

### R2.5 Criterios de aceptación añadidos
- El contenido ilustrativo se distingue siempre de los datos reales.
- Se puede crear un plan escribiendo solo el nombre.
- La barra inferior no tapa contenido a 390 px y se usa con teclado y lector de pantalla.
- Las pruebas actuales siguen pasando y los cálculos no cambian.

## Resultado de implementación (13 nov 2026)
**Hecho:** tokens (§4.1), tipografía y dígitos tabulares (§4.2), motion y reduced-motion (§4.3), header y menú móvil, barra inferior (R2.3), portada con maqueta (A1–A4), Descubre con contenido "Ilustrativo" y hueco para Google (R2.1), crear plan en 3 pasos (R2.2). Contraste de §4.1 aplicado.
**Pendiente:** vista de plan (A8–A11), autenticación a dos columnas (A6), estados vacíos y revisión de cada pantalla en ES/EN y en los tres temas.
**Verificado:** 15 tests; capturas a 390 px (claro) y 1280 px (oscuro) de portada y Descubre; asistente abierto desde "+ Plan" con sesión iniciada, sin errores. No se creó ningún plan real.
