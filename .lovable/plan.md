# Feature 003 — Google Places (New) + Smart Discovery (solo planificación)

Nada se activa, migra ni publica hasta tu autorización expresa. Los precios indicados son orientativos y se verificarán en la tabla oficial de Google antes de activar.

## A. Arquitectura propuesta

```text
Navegador (PlaceSearch, PlacePreview)
   | debounce 300 ms, sessionToken por búsqueda
   v
Funciones de servidor autenticadas (TanStack)
   ├─ places.search    -> Autocomplete (New)
   ├─ places.details   -> Place Details (New), máscara "básica"
   ├─ places.more      -> Place Details (New), máscara "ver más" (bajo demanda)
   └─ places.photo     -> Place Photos (New) (solo si se autoriza)
   | límite por usuario + interruptor de emergencia + caché
   v
Conector Google Maps de Lovable (la clave queda en el servidor)
   v
Funciones SQL existentes / nuevas (guardar en plan, favoritos)
```

- Ninguna clave privada en el navegador. No se carga la librería Places de Google en el navegador.
- Módulos separados: búsqueda, detalles, fotos, componentes visuales, persistencia y errores.
- Si Google falla o se desactiva, la app sigue funcionando con "Añadir manualmente".

## B. Flujo UX (SEARCH → DISCOVER → ADD)

1. Pestaña Lugares: barra "¿A dónde te gustaría ir?" arriba; accesos rápidos 🍽️ Comer, 🍺 Tomar algo, ☕ Café, 🏨 Dormir, 🎭 Actividades, 🌳 Aire libre (rellenan la búsqueda con un texto real, p. ej. "restaurantes en Cadaqués").
2. Sugerencias al escribir (desde 3 letras): nombre, tipo y zona. Prioridad a la ciudad del plan; se puede buscar en cualquier sitio. Sin pedir ubicación.
3. Un toque abre la tarjeta: foto grande (o placeholder elegante), nombre, categoría, valoración y nº de reseñas, zona, precio, abierto/cerrado — solo lo que Google devuelva.
4. Dos botones grandes: ❤️ Guardar y ➕ Añadir a mi plan. Confirmación discreta; si ya está, muestra "Ya en el plan". Con un solo plan activo se elige solo; si no, selector simple.
5. "Ver más": dirección, horario, teléfono, web, enlace a Google Maps (cargado solo al abrirlo).
6. "Añadir manualmente" sigue disponible como opción secundaria y como alternativa ante errores.
7. Nueva vista "Mis favoritos" en el perfil.

## C. Componentes a modificar / crear

- Modificar: pestaña Lugares de `plan-view` (la búsqueda va encima; el formulario manual se pliega); tarjeta de lugar en la lista (muestra datos de Google si los hay, atribución "Google Maps").
- Crear: `PlaceSearch`, `PlacePreviewCard`, `PlaceMoreDetails`, `QuickCategories`, `FavoritesList`, `PlanPicker`.
- Demo `/demo`: sigue usando solo lugares manuales (sin llamadas a Google ni datos falsos de Google).
- Textos nuevos en ES/EN; Light/Dark/System; móvil primero.

## D. Tablas y migraciones

Reutilizar `places`, `plan_places`, `favorite_places` (ya existen, con `provider` y `provider_place_id` previstos).

Una migración:
- `places`: guardar de forma permanente solo `provider='google'` + `provider_place_id` (lo que Google permite conservar). Nombre/dirección se guardan como copia temporal con `google_cached_at` y se refrescan o se vacían a los 30 días.
- Función `add_google_place(plan_id, google_place_id, snapshot)`: crea o reutiliza el lugar (único por id de Google) y lo añade al plan sin duplicados.
- Funciones `toggle_favorite(place_id)` y lectura de favoritos propios.
- Tabla `places_usage` (usuario, día, contador por operación) para el límite por usuario, y ajuste `places_enabled` en configuración para el apagado de emergencia.
- Sin cambios en políticas RLS existentes ni en la lógica financiera.

## E. APIs y credenciales

- Autocomplete (New), Place Details (New), Place Photos (New, opcional), Google Maps URLs (gratis, sin clave). Text Search (New) solo si las sugerencias no bastan para frases tipo "italianos en Barcelona" (evaluar en etapa 2).
- Credenciales: conector Google Maps de Lovable (gestionado o con tu propia clave). Tú decides cuál en el momento de activar.
- Máscaras de campos:
  - Búsqueda: `placeId, text, structuredFormat, types` (Autocomplete).
  - Tarjeta: `id, displayName, primaryType, shortFormattedAddress, rating, userRatingCount, priceLevel, currentOpeningHours.openNow, photos` (esta combinación cae en la tarifa Enterprise por `rating`/`priceLevel`/`openNow`).
  - Opción más barata: sin valoración, precio ni abierto/cerrado (tarifa Pro). Se decide contigo.
  - Ver más: `formattedAddress, regularOpeningHours, nationalPhoneNumber, websiteUri, googleMapsUri`.

## F. Estimación de costes (orientativa, a verificar)

Franquicias mensuales gratuitas actuales por servicio: aprox. 10.000 (Essentials), 5.000 (Pro), 1.000 (Enterprise). Autocomplete es gratis si la sesión termina en un Place Details.

Supuesto: cada usuario activo hace 10 búsquedas/mes, abre 10 tarjetas, 3 "ver más", 10 fotos.

| Usuarios | Tarjetas | Fotos | Coste estimado/mes |
|---|---|---|---|
| 10 | 100 | 100 | 0 € (dentro de franquicia) |
| 100 | 1.000 | 1.000 | ~0 € (en el límite Enterprise) |
| 1.000 | 10.000 | 10.000 | ~180–250 € con tarjeta Enterprise + fotos; ~60–100 € sin valoración ni fotos |

Además, el conector gestionado de Lovable tiene un tope de 6.000 llamadas/día por espacio de trabajo.

Controles: debounce, sesiones, caché de 24 h de la tarjeta en servidor, límite por usuario (p. ej. 60 búsquedas y 30 tarjetas/día), cuotas y alertas en Google Cloud (si usas tu clave), interruptor de emergencia. Las alertas no son un tope de gasto. Lovable Pro no incluye uso gratuito de Google Maps.

## G. Riesgos técnicos y legales

- Términos de Google: solo `place_id` puede guardarse sin límite; el resto, máx. 30 días. Atribución "Google Maps" y autores de fotos visibles obligatorios.
- Clientes del Espacio Económico Europeo: aplican condiciones específicas de Google Maps Platform (EEA). Se revisarán y documentarán antes de activar.
- Coste variable si crece el uso o hay abuso → límites por usuario y apagado.
- Disponibilidad: fallo de Google no bloquea la app.
- La vista previa del sandbox no permite probar Google en vivo; las pruebas reales se harán en tu vista previa.

## H. Plan por etapas (cada una con tu aprobación)

1. Documentación: `docs/architecture/google-places-integration.md`, `docs/adr/ADR-003-google-places.md` (precios verificados, condiciones EEA).
2. Base sin coste: migración (favoritos, `add_google_place`, uso, interruptor), pantalla de favoritos y nueva UI con datos manuales.
3. Conectar Google (tu autorización + elección de conector): búsqueda y tarjeta básica, límites y errores.
4. "Ver más" y enlace a Google Maps.
5. Fotos (opcional, tras revisar coste).
6. Pruebas y CHANGELOG.

## I. Criterios de aceptación

Los 16 casos de prueba y criterios de tu documento: buscar y seleccionar un lugar real, tarjeta con datos reales sin inventar, guardar en favoritos, añadir al plan sin duplicados, abrir en Google Maps, ES/EN, 3 temas, móvil, errores y límites gestionados, claves no expuestas, aislamiento entre usuarios y planes, lugares manuales y demo intactos. Pruebas automáticas para límites, duplicados y caducidad de 30 días.

## Decisiones que necesito de ti al aprobar

- Tarjeta con valoración/precio/abierto (Enterprise) o versión más barata (Pro).
- Fotos sí/no en la primera versión.
- Conector gestionado por Lovable o tu propia clave de Google Cloud (con alertas y cuotas propias).
