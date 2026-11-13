# Feature 003 — Integración Google Places (diseño definitivo)

**Estado:** diseño cerrado (13 nov 2026). Implementación **no autorizada**. Decisión: [ADR-003](../adr/ADR-003-google-places.md).

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
Personalización limitada al componente; límites de la app solo "suaves"; la vista previa de desarrollo no permite pruebas en vivo; términos y precios pueden cambiar.

## Fuentes
- https://developers.google.com/maps/comms/eea/places
- https://cloud.google.com/terms/maps-platform/eea/maps-service-terms
- https://cloud.google.com/terms/maps-platform/eea-places-api-permitted-uses
- https://developers.google.com/maps/billing-and-pricing/pricing
- https://developers.google.com/maps/billing-and-pricing/sku-details/places
