# Feature 003 — Plan definitivo: Google Places UI Kit (Vía B)

Decisiones confirmadas: Places UI Kit, facturación en España (EEE), credenciales propias de Google Cloud, diseño premium SplitEasy, foto principal desde la v1. Nada se activa, migra ni publica hasta tu autorización por etapa.

## 1. Por qué UI Kit cumple en el EEE

- Los términos EEE limitan el contenido de Places API a 9 usos permitidos y prohíben mostrarlo junto a un mapa. **Places UI Kit está expresamente exento de ambas restricciones.**
- En la base de datos solo se guarda el `place_id` (permitido por los términos EEE). Nombre, foto, valoración, horario y dirección los pinta siempre el componente de Google.
- No se altera, oculta ni tapa ninguna atribución de Google (logo, autores de fotos, enlace a Google Maps).

## 2. Experiencia (SEARCH → DISCOVER → ADD)

```text
Pestaña Lugares del plan
 ┌──────────────────────────────────────────┐
 │ 🔎 ¿A dónde te gustaría ir?   (Google)   │  Autocompletar UI Kit
 │ 🍽️ Comer 🍺 Tomar algo ☕ Café 🏨 Dormir … │  accesos rápidos (SplitEasy)
 └──────────────────────────────────────────┘
 ┌──────────────────────────────────────────┐
 │  Tarjeta de detalle (Google)              │  foto, nombre, valoración,
 │                                          │  categoría, zona, precio,
 │                                          │  abierto/cerrado, atribución
 ├──────────────────────────────────────────┤
 │  ❤️ Guardar     ➕ Añadir a mi plan       │  acciones SplitEasy
 │  Ver más ▾ (dirección, horario, web…)    │  carga diferida
 └──────────────────────────────────────────┘
 Lista del plan: tarjetas compactas de Google + estado propuesto/elegido/descartado
 "Añadir manualmente" siempre disponible
```

- Un toque en una sugerencia abre la tarjeta; un toque en ➕ la añade (sin formularios). Si hay un solo plan activo se usa ese; si no, selector simple.
- Accesos rápidos: rellenan el buscador con un texto real ("restaurantes en Cadaqués") usando la ciudad del plan; prioridad a la zona del plan, sin pedir ubicación.
- El contenedor (bordes, espaciado, botones, animaciones, temas Light/Dark/System, ES/EN, móvil) es SplitEasy; los colores y la tipografía del componente de Google se ajustan con sus variables oficiales de estilo, sin tocar atribuciones.
- Los lugares de Google no se colocan junto a ningún mapa (no hay mapas en SplitEasy).
- `/demo` sigue con lugares manuales: ninguna llamada a Google.

## 3. Componentes

- Modificar: pestaña Lugares de `plan-view` (buscador arriba, manual plegado), tarjeta de lugar de la lista (manual o Google).
- Crear: `GoogleMapsLoader` (carga del script con clave de navegador, idioma ES/EN, solo cuando se abre Lugares), `PlaceSearchBox`, `PlaceDetailsCard`, `QuickCategories`, `PlaceActions` (❤️ / ➕), `PlanPicker`, `FavoritesList` (en Perfil), `PlacesUnavailable` (aviso + manual).
- Separación: carga de Google / búsqueda / detalle / persistencia / errores en módulos distintos.

## 4. Costes verificados (lista oficial global, USD por 1.000, tramo inicial)

| SKU UI Kit | Se cobra cuando | Gratis/mes | Precio |
|---|---|---|---|
| Places UI Kit - Autocomplete per Session | una sesión de búsqueda | 10.000 | 10,00 $ |
| Places UI Kit Query | cada carga de tarjeta de detalle o búsqueda | 10.000 | 1,00 $ |
| Places UI Kit Pro (Advanced) | solo componentes "Advanced" | 5.000 | 5,00 $ |

- Se cobra por petición, independientemente de los campos mostrados (foto y valoración incluidas). Usaremos los componentes estándar, no los Advanced.
- No hay mapa → no se cobra Dynamic Maps.
- Precios en USD; Google factura en EUR según su cambio. Se reverificarán el día de activación.

**Supuestos por usuario activo/mes:** 5 sesiones de búsqueda, 10 tarjetas abiertas, 20 tarjetas compactas vistas en listas de planes (30 Query).

| Usuarios | Sesiones | Query | Coste/mes |
|---|---|---|---|
| 10 | 50 | 300 | 0 $ |
| 100 | 500 | 3.000 | 0 $ |
| 1.000 | 5.000 | 30.000 | (30.000 − 10.000) × 0,001 = **~20 $** |

Escenario pesado (1.000 usuarios, 15 sesiones y 100 tarjetas cada uno): sesiones 15.000 → 50 $; Query 100.000 → 90 $; **~140 $/mes**.

## 5. Cuotas, límites e interruptor

Con UI Kit el navegador llama a Google directamente, así que el control duro está en Google Cloud:
1. Clave de navegador restringida a vuestros dominios (publicado y vista previa) y solo a Maps JavaScript API + Places UI Kit.
2. Cuotas diarias en Google Cloud (límite real): p. ej. 300 sesiones/día y 1.500 Query/día al inicio; también "por usuario y minuto".
3. Alertas de presupuesto 50/90/100 % (avisan, no frenan) y opcional corte automático de facturación.

En SplitEasy:
4. Interruptor `places_enabled` en la base de datos: apagado → el componente no se carga y solo queda "Añadir manualmente", al instante.
5. Límite suave por usuario y día (contado en servidor al abrir tarjetas) que desactiva la búsqueda para ese usuario al superarlo.
6. Debounce y carga diferida: el script de Google solo se carga al entrar en Lugares; las tarjetas de la lista se cargan al ser visibles.
7. Error o cuota agotada → mensaje claro, sin reintentos, nada se pierde.

## 6. Base de datos (etapa 3, cuando se autorice)

- `places`: `provider='google'` + `provider_place_id` único; sin datos de Google adicionales.
- Funciones: `add_google_place(plan_id, place_id)` sin duplicados; `toggle_favorite(place_id)`.
- Tabla `places_usage` (usuario, día, contador) y ajuste `places_enabled`.
- Sin cambios en autenticación, políticas RLS existentes ni cálculos financieros.

## 7. Credenciales

- Solo una clave de navegador (pública por naturaleza, restringida por dominio y API), guardada como variable del proyecto. Sin claves privadas.
- La creáis vosotros en vuestro proyecto de Google Cloud; os guío paso a paso.

## 8. Riesgos

- Personalización visual limitada a lo que permite el componente de Google.
- El límite por usuario es "suave" (navegador); el límite duro son las cuotas de Google Cloud.
- La vista previa de desarrollo no puede probar Google en vivo; las pruebas reales se hacen en vuestra vista previa y dominio autorizados.
- Términos y precios pueden cambiar: revisión antes de activar y documentada en el ADR.

## 9. Etapas (cada una con tu autorización)

1. Documentación: `docs/architecture/google-places-integration.md` y `docs/adr/ADR-003-google-places.md`.
2. Vuestra configuración de Google Cloud: facturación, APIs mínimas, clave restringida, cuotas, alertas.
3. Base sin coste: migración, favoritos, interruptor, límites, nueva pestaña Lugares con manual.
4. Buscador + tarjeta + ❤️ / ➕ + accesos rápidos.
5. Tarjetas compactas en la lista del plan, "Ver más", favoritos en Perfil.
6. Pruebas (16 casos del documento) y CHANGELOG.

## 10. Criterios de aceptación

Los del documento, más: solo `place_id` de Google en la base de datos; atribuciones intactas; sin mapa junto al contenido; interruptor probado; cuota agotada deja añadir manualmente; demo sin llamadas a Google; ES/EN y 3 temas.

Fuentes: developers.google.com/maps/comms/eea/places, cloud.google.com/terms/maps-platform/eea/maps-service-terms, developers.google.com/maps/billing-and-pricing/pricing, developers.google.com/maps/billing-and-pricing/sku-details/places
