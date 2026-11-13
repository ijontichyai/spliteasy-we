# ADR-004: Identidad visual premium y sistema de diseño

- **Estado:** Aceptado (diseño) — 13 nov 2026. Implementación pendiente de autorización.
- **Detalle:** [phase-04-premium.md](../architecture/phase-04-premium.md)

## Contexto
SplitEasy tiene un recorrido funcional (planes, lugares, gastos, balances) y tres temas
(claro/oscuro/sistema), pero la auditoría visual del 13 nov 2026 sobre capturas reales
detectó que la interfaz parece una plantilla: mitad del escritorio vacía, tarjetas sin
elevación, campos casi invisibles, texto secundario por debajo del contraste AA en oscuro,
lista de gastos con aspecto de tabla CRUD y cifras sin tratamiento contable. El producto
es comercial y necesita percibirse premium sin gastar dinero.

## Decisión
1. **Mantener la marca actual** (crema + verde azulado + coral; Bricolage Grotesque + Figtree)
   y convertirla en un **sistema de diseño documentado**: superficies en capas
   (`--surface-1/2/3`), tres niveles de elevación, `--gradient-premium` solo en lo principal,
   y `--money` (dígitos tabulares) en toda cifra.
2. **Sin fotografías ni ilustraciones con licencia.** Todo el peso visual sale de CSS y SVG
   propios: la maqueta del producto del hero se construye con CSS/SVG o con capturas de `/demo`.
3. **Contraste AA como requisito bloqueante** en claro y oscuro, con los valores concretos de
   tokens fijados en el documento de diseño.
4. **Motion mínimo**: 150–200 ms, `ease-out`, sin giros ni parallax, y `prefers-reduced-motion`
   respeta la preferencia del dispositivo.
5. **El rediseño es solo capa visual**: no se tocan base de datos, RLS, autenticación,
   invitaciones ni cálculos financieros.
6. **Por etapas**, cada una con autorización expresa, empezando por tokens y base.

## Alternativas descartadas
- **Re-brand completo** (nueva paleta, nuevas fuentes): descarta el trabajo aprobado en
  UI Enhancement 001 y obliga a rehacer los tres temas.
- **"Nocturno Editorial"** (modo oscuro prioritario, tipografía extrema): menos coherente con
  el modo claro ya aprobado.
- **"Diario de Viaje"** (papel, sellos, billetes): poco creíble para una app que mueve dinero.
- **Bancos de imágenes o ilustraciones de pago**: coste y licencias, contra el presupuesto de 0 €.
- **Rediseñar a la vez la lógica de Premium y precios**: queda fuera del alcance acordado para
  Feature 004.

## Consecuencias
- Los nuevos tokens se aplican de una vez a todas las pantallas: hay que revisarlas con capturas
  antes de dar por cerrada cada etapa.
- El modo oscuro necesita ajustes reales de tokens (borde y texto secundario), no solo un tema
  añadido.
- La personalización de Google Places (Feature 003) sigue limitada a lo que permite Google;
  lo propio de SplitEasy mantiene esta identidad.
- Coste: 0 €. No se activa ningún servicio ni se modifican datos.

## Addendum (13 nov 2026) — Aprobación con ajustes
- Dirección "Papel y Marea" **aprobada** y alineada con la North Star (PLAN → GO → SHARE).
- Contenido ilustrativo (ilustraciones propias o fotos con licencia) solo para demostración, siempre con la etiqueta "Ilustrativo".
- Las tarjetas de Descubre se preparan para Places UI Kit respetando su presentación y atribución.
- Crear plan: tres pasos y solo el nombre es obligatorio.
- Móvil: barra inferior de 4 pestañas con botón central "+ Plan".
- Implementación por etapas, cada una con autorización expresa, empezando por el sistema de diseño.
