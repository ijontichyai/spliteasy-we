# Feature 003 — Cierre de diseño y documentación (solo documentos)

Alcance autorizado: escribir la documentación técnica definitiva. Sin Google Cloud, facturación, APIs, migraciones, cambios en la app ni publicación.

## Archivos que se crearán / actualizarán

1. `docs/architecture/google-places-integration.md` — arquitectura definitiva.
2. `docs/adr/ADR-003-google-places.md` — decisión registrada.
3. `CHANGELOG.md` — entrada "Feature 003: diseño cerrado (sin implementación)".
4. `roadmap.md` — Feature 003 implementación pendiente de autorización; Feature 004 Premium UI/UX Revolution como siguiente prioridad.
5. Memoria del proyecto: reglas aprobadas (UI Kit Essentials, Google Cloud propio, manual permanente).

## Contenido de google-places-integration.md

- **Decisión:** Places UI Kit (exento de usos permitidos EEE y de la regla "junto a un mapa"); facturación en España.
- **Componentes de Google (Essentials):**
  - Autocomplete del UI Kit → SKU "Places UI Kit - Autocomplete per Session" (10.000 gratis/mes, 10 $/1.000).
  - Place Details Element y Place Details Compact Element estándar → SKU "Places UI Kit Query" (10.000 gratis/mes, 1 $/1.000), se cobra por petición sin importar los campos (foto, valoración, categoría, horario incluidos).
- **Componentes que requieren UI Kit Pro (no usados por defecto):** Advanced Place Details, Advanced Place List, Advanced Place Search y Place Markers → SKU "Places UI Kit Pro" (5.000 gratis/mes, 5 $/1.000). Coste adicional documentado: con 30.000 cargas/mes serían ~125 $ frente a ~20 $ en Essentials. Las tarjetas compactas de la lista del plan usarán el Compact Element estándar (Essentials).
- **Datos en Google:** fotos, valoraciones, categorías y horarios solo dentro de los componentes oficiales; atribuciones intactas; ningún mapa junto al contenido.
- **Datos en SplitEasy:** solo `place_id` + datos propios (estado, nota, quién lo añadió, favorito).
- **Diseño propio premium:** buscador contenedor, accesos rápidos, ❤️ / ➕, selector de plan, lista del plan, favoritos; Light/Dark/System, ES/EN, móvil.
- **Costes:** tabla 10 / 100 / 1.000 usuarios (0 $, 0 $, ~20 $) + escenario pesado (~140 $) con supuestos explícitos; precios a reverificar el día de activación.
- **Protección de costes (orden de importancia):** cuotas diarias duras en Google Cloud; clave de navegador restringida por dominio y API; alertas de presupuesto (avisan, no frenan) y corte opcional de facturación; interruptor `places_enabled`; límites en la app (declarados como protección complementaria, no suficiente).
- **Resiliencia:** lugares manuales como alternativa permanente; errores sin pantallas en blanco ni reintentos.
- **Base de datos futura:** `add_google_place`, `toggle_favorite`, `places_usage`, `places_enabled`; sin cambios en auth, RLS ni finanzas.
- **Etapas de implementación**, **16 pruebas**, **riesgos** y **fuentes oficiales**.

## Contenido de ADR-003

Contexto (EEE, coste, experiencia premium), decisión (UI Kit Essentials + Google Cloud propio), alternativas descartadas (Places API con tarjeta propia: riesgo de usos permitidos EEE; conector gestionado: menos control de facturación; Advanced/Pro: coste ×5), consecuencias (personalización limitada al componente, control duro en Google Cloud), estado: Aceptado — diseño; implementación pendiente.
