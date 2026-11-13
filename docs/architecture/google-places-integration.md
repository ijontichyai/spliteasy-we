# Feature 003 — Integración Google Places (diseño definitivo)

**Estado:** diseño cerrado e integración parcial implementada con autorización posterior (13 nov 2026). Búsqueda operativa en Preview confirmada por el usuario; persistencia y funcionalidades restantes pendientes. Decisión: [ADR-003](../adr/ADR-003-google-places.md). Las secciones 3–10 describen el diseño objetivo; el estado real se detalla en §12.

## 1. Decisión
- **Places UI Kit (JavaScript)**, componentes estándar (Essentials) siempre que sea posible.
- Cuenta de Google Cloud **propia**, facturación en España (EEE).
- Motivo: desde el 8 jul 2025 los términos EEE limitan el contenido de Places API a una lista cerrada de usos y prohíben mostrarlo junto a un mapa. **Places UI Kit está exento** de ambas restricciones.

## 2. Componentes de Google y SKU
| Uso en SplitEasy | Componente | SKU | Gratis/mes | USD / 1.000 |
|---|---|---|---|---|
| Buscador | Basic Place Autocomplete Element | Places UI Kit - Autocomplete per Session | 10.000 | 10,00 |
| Tarjeta al seleccionar | Place Details Element | Places UI Kit Query | 10.000 | 1,00 |
| Tarjetas de la lista del plan | Place Details Compact Element | Places UI Kit Query | 10.000 | 1,00 |

UI Kit se cobra **por petición, sin importar los campos** mostrados (foto, valoración, categoría, horario, precio incluidos).

**Requieren UI Kit Pro (no usados por defecto):** Advanced Place Details, Advanced Place List, Advanced Place Search, Place Markers → SKU "Places UI Kit Pro", 5.000 gratis/mes, 5 $/1.000. Con 30.000 cargas/mes: ~125 $ en Pro frente a ~20 $ en Essentials. Solo se usarían con nueva aprobación.

No hay mapa → no se cobra Dynamic Maps. Precios de la lista oficial global en USD; reverificar el día de activación.

## 3. Arquitectura
```text
Navegador
 ├─ GoogleMapsLoader (carga diferida, solo en Lugares, idioma ES/EN)
 ├─ PlaceSearchBox (UI Kit)  + QuickCategories (SplitEasy)
 ├─ PlaceDetailsCard (UI Kit) + PlaceActions ❤️ / ➕ + PlanPicker (SplitEasy)
 └─ Lista del plan: Compact Element (UI Kit) + estado (SplitEasy)
     |  clave de navegador restringida por dominio y API
     v
Google Maps Platform (proyecto propio)

SplitEasy (Lovable Cloud): solo place_id + datos propios, vía funciones seguras
```
- Datos de Google (fotos, valoraciones, categorías, horarios) **solo dentro de los componentes oficiales**. Atribuciones nunca se alteran, ocultan ni tapan.
- Ningún contenido de Google junto a un mapa.
- En la base de datos: solo `place_id` (caché permitida por los términos EEE) + estado, nota, autor, favorito.
- Diseño premium SplitEasy en todo lo propio; el componente de Google se ajusta solo con sus variables oficiales de estilo. Light/Dark/System, ES/EN, móvil.
- `/demo` no llama a Google.

## 4. Flujo (SEARCH → DISCOVER → ADD)
1. Lugares: buscador "¿A dónde te gustaría ir?" y accesos 🍽️ 🍺 ☕ 🏨 🎭 🌳 (texto real + ciudad del plan).
2. Un toque en la sugerencia → tarjeta de Google.
3. ❤️ Guardar / ➕ Añadir a mi plan (sin formularios; plan único se elige solo; si no, selector).
4. Lista del plan con tarjetas compactas y estado propuesto/elegido/descartado.
5. "Añadir manualmente" es una alternativa **permanente**.

## 5. Costes estimados
Supuestos por usuario activo/mes: 5 sesiones de búsqueda, 10 tarjetas abiertas, 20 tarjetas compactas (30 Query).

| Usuarios | Sesiones | Query | Coste/mes |
|---|---|---|---|
| 10 | 50 | 300 | 0 $ |
| 100 | 500 | 3.000 | 0 $ |
| 1.000 | 5.000 | 30.000 | ~20 $ |

Escenario pesado (1.000 usuarios, 15 sesiones y 100 tarjetas cada uno): ~140 $/mes. Lovable Pro no incluye uso de Google Maps.

## 6. Protección de costes (por orden de importancia)
1. **Cuotas diarias duras** en Google Cloud por API (inicio: 300 sesiones/día, 1.500 Query/día) y por usuario/minuto.
2. **Clave de navegador** restringida a los dominios de SplitEasy y solo a Maps JavaScript API + Places UI Kit. Sin claves privadas.
3. **Alertas de presupuesto** 50/90/100 % (avisan, no frenan) y corte automático de facturación opcional.
4. **Interruptor `places_enabled`** en la base de datos: apagado → no se carga Google, solo manual.
5. **Límites en la app** por usuario/día: protección complementaria, **no suficiente** por sí sola (el navegador llama a Google directamente).

## 7. Resiliencia
Error, cuota o interruptor → mensaje claro, sin reintentos, sin pantalla en blanco, se conserva lo escrito, manual disponible.

## 8. Base de datos (futura, requiere autorización)
- `places`: `provider='google'` + `provider_place_id` único.
- Funciones: `add_google_place(plan_id, place_id)` sin duplicados; `toggle_favorite(place_id)`.
- `places_usage` (usuario, día, contador) y ajuste `places_enabled`.
- Sin cambios en autenticación, RLS existentes ni cálculos financieros.

## 9. Etapas
1. ✅ Diseño y documentación.
2. Configuración de Google Cloud propia (facturación, APIs mínimas, clave, cuotas, alertas).
3. Base sin coste: migración, favoritos, interruptor, límites, nueva pestaña Lugares.
4. Buscador + tarjeta + ❤️ / ➕ + accesos rápidos.
5. Tarjetas compactas en la lista, favoritos en Perfil.
6. Pruebas y CHANGELOG.

## 10. Pruebas
Buscar lugar conocido; seleccionar; datos reales; campos ausentes; añadir al plan; duplicados; favoritos; abrir Google Maps; ES/EN; 3 temas; móvil; errores de API; cuota agotada; claves no expuestas; aislamiento entre usuarios/planes; demo sin llamadas a Google. Sin respuestas falsas de Google.

## 11. Riesgos
Personalización limitada al componente; límites de la app solo "suaves"; las pruebas en vivo requieren autorizar el origen real de Preview; términos y precios pueden cambiar.

## 12. Configuración y estado implementado (13 nov 2026, UTC)

### Código y credenciales
- `src/lib/maps.functions.ts`: `getMapsBrowserKey` lee exclusivamente `process.env["Google_Maps_API_Key"]` dentro de la función del servidor. El valor se administra mediante los secretos del proyecto, nunca como literal en código o documentación.
- Es una **clave de navegador**: Google Maps JavaScript la recibe necesariamente en el navegador. No es una credencial privada de servidor; su protección efectiva son las restricciones por sitio web y API. No usar una clave de servidor ni una cuenta de servicio en este secreto.
- `src/components/discover/place-search.tsx`: carga diferida de Maps JavaScript (`loading=async`, `v=weekly`, idioma inicial ES/EN, `region=ES`), seguida de `google.maps.importLibrary("places")`.
- Componentes oficiales Essentials: `gmp-basic-place-autocomplete`, `gmp-place-details`, `gmp-place-details-place-request` y `gmp-place-all-content`. Fotografías y atribuciones permanecen dentro de Google; no se añade mapa ni componentes Advanced/Pro.
- `gmp-select` conserva el identificador seleccionado en memoria; `gmp-load` obtiene el nombre sugerido. La acción abre `/app` con `new`, `placeId` y `placeName`; el nombre es editable y las fechas/invitaciones opcionales.
- Los estados de carga/error y los eventos `gmp-error`/`gmp-requesterror` están conectados. Se mantienen las cuatro ilustraciones etiquetadas y el alta manual de lugares.

### Google Cloud: configuración comunicada por el propietario
En **APIs y servicios → Biblioteca**, habilitar **Maps JavaScript API**, **Places API (New)** y **Places UI Kit**. En **APIs y servicios → Credenciales → clave → Restricciones de API**, autorizar estas tres APIs; en **Restricciones de aplicaciones**, seleccionar **Sitios web (referentes HTTP)**.

Usar los orígenes exactos necesarios, con comodín de ruta:
```text
https://306db1f6-82ab-49c3-a246-dc7ba7faa244.lovableproject.com/*
https://id-preview--306db1f6-82ab-49c3-a246-dc7ba7faa244.lovable.app/*
https://spliteasy-we.lovable.app/*
```
El primer origen corresponde al Preview dentro del editor; el segundo, al Preview compartible. No son intercambiables. El tercero prepara el sitio publicado, pero **no autoriza ni implica publicar**. Preferir esta lista exacta frente a permitir todos los subdominios de Lovable. Revisarla si cambia el origen.

En **Google Maps Platform → Cuotas**, configurar límites duros según §6 y, en **Facturación → Presupuestos y alertas**, alertas de gasto. Los valores efectivos de cuotas, presupuesto, facturación y restricciones no se han leído desde Google Cloud: su configuración está **sin verificar independientemente**. Las alertas no detienen el consumo y el nivel gratuito no garantiza coste cero.

### Diagnóstico y resultados de pruebas
- Primer error observado: `The API is not activated on your project.` Faltaba habilitar **Places UI Kit**, además de las otras APIs.
- Error posterior observado: `IP address, referer or application did not match any of the ones authorized for the supplied API key.` El referente real del editor era `https://306db1f6-82ab-49c3-a246-dc7ba7faa244.lovableproject.com`, distinto del Preview compartible autorizado.
- Diagnóstico previo con peticiones por origen: editor → **403 Permission denied**; Preview compartible → resultados reales de cafeterías; origen publicado → aceptado. Son resultados históricos, no una consulta nueva en esta revisión.
- Tras corregir las restricciones, el propietario confirmó que Google Places funciona. Las comprobaciones previas de interfaz a 390 px y 1280 px conservaron buscador, cuatro etiquetas ilustrativas y aviso actualizado, sin errores de consola. No equivalen a una prueba completa nueva de búsqueda/selección/creación real.
- Revisión actual: **15 pruebas automatizadas aprobadas en 4 archivos** (i18n, temas, dinero y navegación). El escaneo de archivos rastreados no encontró patrones de claves Google, claves privadas ni claves secretas del backend; no es una auditoría exhaustiva de todo el historial.

### Limitaciones conocidas
- `place_id` viaja al asistente, pero **no se persiste en la base de datos**. No hay migración autorizada para ello; no afirmar que un plan creado conserva el vínculo con Google.
- Favoritos Google, selector para añadir a planes existentes, categorías rápidas, tarjetas compactas en planes, interruptor `places_enabled` y contadores de uso son diseño pendiente, no funcionalidad implementada.
- Las cuotas/alertas reales de Google Cloud no están verificadas; no hay protección dura de costes implementada en la app.
- El cargador reutiliza una promesa global: cambiar el idioma después de cargar Google no recarga el idioma de Maps. No hay estado propio separado de «sin resultados» ni reintento explícito de errores del componente.
- Pendiente una prueba nueva completa «cafeterías en Barcelona» → selección → asistente con el lugar correcto, en escritorio y móvil y con sesión, sin publicar para probar.
- La sincronización GitHub solo puede confirmarse en **Project settings → Git**. Los remotos locales de esta sesión son internos de Lovable, no identifican el repositorio GitHub conectado ni su rama de sincronización.

## 13. Revisión autorizada de tarjetas propias — 13 nov 2026 (UTC)

**Alcance autorizado:** revisar la viabilidad de tarjetas propias; no equivale a sustituir ADR-003 ni a conectar nuevos servicios de pago.

### Conclusión sobre cumplimiento EEE
- Los términos específicos EEE, sección B §15.2, limitan el contenido de Places API a los usos enumerados. No mostrar un mapa y conservar atribuciones no elimina esta restricción.
- El uso permitido (8) contempla compartir o etiquetar un lugar específico en publicaciones, eventos o experiencias compartidas de una plataforma social. El uso (4) contempla asociar tareas, notas o recordatorios con lugares concretos.
- Añadir un lugar seleccionado a un plan de grupo encaja razonablemente con esos usos, pero esto es una interpretación, no una aprobación de Google. Un catálogo independiente «Ideas para inspirarte» no está expresamente autorizado por una categoría general de descubrimiento o viajes.
- La exención B §15.3 cubre **Places UI Kit**, no extraer sus datos para reconstruir tarjetas propias. Antes de implementar la propuesta de tarjetas propias, obtener confirmación escrita de Google sobre la experiencia exacta o una revisión jurídica del uso permitido. No afirmar que las tarjetas propias están categóricamente prohibidas ni que están aprobadas.
- La documentación actual incluye **Place Search (`gmp-place-search`) en Essentials**, con búsqueda de texto y cercana. Esto corrige la omisión de ese componente en §2: descubrir varios lugares no exige por sí mismo Pro. Su disponibilidad efectiva no se ha probado; tampoco se propone una nueva integración directa de Places desde el navegador.

### Configuración necesaria para la propuesta de tarjetas propias
- Para nuevas búsquedas, usar Places API (New) mediante el conector Google Maps y funciones autenticadas; sin peticiones de datos Places directas desde el navegador.
- La clave existente `Google_Maps_API_Key` es de navegador y está restringida por referente. Conservarla para la integración operativa; no reutilizarla como clave de servidor ni debilitar sus restricciones.
- No hay conexión Google Maps accesible en esta sesión. Una futura conexión con credenciales propias requerirá una clave de servidor separada que permita Places API (New). No se ha abierto el diálogo de conexión ni creado un conector alternativo.
- Las consultas, valoraciones y fotografías pueden generar cargos. Antes de habilitarlas, confirmar cuotas duras y alertas en Google Cloud; alertas y límites de interfaz no garantizan coste cero.
- Usar consultas explícitas y acotadas, sin carga automática de cuatro búsquedas por visita, sin sondeo, sin reintentos tras errores de permisos/cuota y sin catálogo persistente de contenido Google. Conservar atribución Google y de los fotógrafos.
- La asociación persistente del `place_id` y añadir a planes existentes siguen pendientes: el asistente actual solo recibe una sugerencia de nombre y pierde la referencia al limpiar la URL. No afirmar que el lugar queda guardado con el plan.

### Resultado de esta revisión
- Sin cambios en Descubre, autenticación, planes, gastos, pagos o base de datos; sin llamadas Google en vivo y sin publicar.
- 15/15 pruebas de regresión aprobadas; último resultado observado de compilación: `build OK`.
- Los cambios documentales se entregan al mecanismo automático de Git de Lovable. Repositorio, rama y commit remoto siguen sin verificarse desde esta sesión.

## Fuentes
- https://developers.google.com/maps/documentation/javascript/places-ui-kit/place-search?utm_campaign=gmp_lovable_agentskills_v1
- https://developers.google.com/maps/documentation/javascript/places-ui-kit/overview?utm_campaign=gmp_lovable_agentskills_v1
- https://developers.google.com/maps/comms/eea/places
- https://cloud.google.com/terms/maps-platform/eea/maps-service-terms
- https://cloud.google.com/terms/maps-platform/eea-places-api-permitted-uses
- https://developers.google.com/maps/billing-and-pricing/pricing
- https://developers.google.com/maps/billing-and-pricing/sku-details/places
