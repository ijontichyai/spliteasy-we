# Feature 003 — Google Places (New): revisión final para autorización

Decisiones confirmadas: tarjeta completa (valoración, reseñas, precio, abierto/cerrado), foto principal desde la v1, proyecto y credenciales propias de Google Cloud, SEARCH → DISCOVER → ADD. Nada se activa, migra ni publica hasta tu autorización.

## 1. Hallazgo bloqueante: condiciones para clientes del EEE (punto A y F)

Si la cuenta de facturación de Google Cloud tiene dirección en el EEE (España incluida), desde el 8 jul 2025 aplican términos específicos:

- **Usos permitidos cerrados.** El contenido de Places API (nombre, valoración, fotos, horarios…) solo puede usarse para 9 casos listados. Los más cercanos a SplitEasy: (4) asociar tareas/notas a lugares en una herramienta de organización, (6) un lugar relacionado con una transacción financiera, (8) etiquetar o compartir un lugar al crear eventos o experiencias compartidas en una plataforma social. **No aparece "descubrir y comparar establecimientos"**. Encaje probable pero no garantizado.
- **Prohibido junto a cualquier mapa.** Salvo latitud, longitud y place_id, el contenido no puede mostrarse en, junto a, ni enlazado a un mapa. El enlace oficial `googleMapsLinks` que devuelve la API sí está permitido.
- **Excepción: Places UI Kit.** Los componentes visuales oficiales de Google (buscador y tarjeta de detalle) **no están sujetos** a esas dos restricciones.
- **Almacenamiento:** solo place_id (y en general lat/lng temporalmente) puede guardarse. Nombre, valoración, fotos, dirección: no se guardan en nuestra base de datos.

Esto obliga a elegir entre dos vías antes de construir:

| | Vía A — Places API + diseño propio | Vía B — Places UI Kit (Google) |
|---|---|---|
| Diseño | Tarjeta 100 % SplitEasy | Componentes de Google, personalizables solo en colores/tipografía |
| EEE | Requiere encajar en usos 4/6/8; recomendable confirmación escrita de Google o asesoría legal | Exento de usos permitidos y de la regla del mapa |
| Clave | En el servidor | Clave de navegador restringida por dominio y API |
| Riesgo legal | Medio | Bajo |

**Recomendación:** Vía B para la búsqueda y la tarjeta (menor riesgo comercial), conservando nuestro diseño alrededor (botones ❤️ y ➕, selector de plan, lista del plan). Si preferís la Vía A, la condición es obtener antes confirmación de Google sobre el uso.

## 2. Arquitectura (válida para ambas vías)

```text
Navegador: buscador + tarjeta (UI Kit o propia) + ❤️ / ➕
   | (Vía A) funciones de servidor autenticadas -> Google con clave de servidor
   | (Vía B) componentes de Google con clave de navegador restringida
   v
Base de datos: solo place_id + datos propios del usuario (nota, estado, quién lo añadió)
```

- Módulos separados: búsqueda, detalle, fotos, componentes, persistencia, errores.
- La lista del plan muestra cada lugar re-pidiendo sus datos a Google al verlo (no se guardan). Para controlar coste: solo se cargan las tarjetas visibles y se reutilizan durante la sesión del navegador.
- Nota de compatibilidad: el lugar puede tener además un título libre que escribe el usuario (dato propio, guardable), útil si Google falla.
- Fallo, cuota o interruptor apagado → la app sigue; "Añadir manualmente" siempre disponible; no se pierde lo escrito.

## 3. Fotografías sin exponer credenciales (punto C)

- Vía A: el servidor pide la foto con `skipHttpRedirect=true` y devuelve solo la URL temporal de la imagen (no contiene clave) + `authorAttributions`. Una foto principal por tarjeta, 800 px máx.; más fotos solo al pulsar "Ver más".
- Vía B: la propia tarjeta de Google muestra fotos y atribuciones.
- Siempre visibles: logo/atribución "Google Maps" y autor de cada foto. Placeholder elegante si no hay foto.

## 4. Costes reales por SKU (punto B, precios oficiales en USD, por 1.000, tramo inicial)

| SKU | Gratis/mes | Precio |
|---|---|---|
| Autocomplete Requests | 10.000 | 2,83 $ |
| Place Details Enterprise (valoración, precio, abierto) | 1.000 | 20 $ |
| Place Details Pro | 5.000 | 17 $ |
| Place Photos | 1.000 | 7 $ |

- Sesión completa (búsqueda que termina en Details con el mismo token): las peticiones de autocompletar no se cobran; se cobra el Details.
- Sesión incompleta (el usuario escribe y abandona): cada petición de autocompletar se cobra.
- Places UI Kit tiene SKUs propios (p. ej. "Autocomplete per Session"); sus precios se confirmarán en la lista oficial antes de activar si elegís la Vía B.
- Lovable Pro no incluye uso de Google Maps; con proyecto propio, Google factura directamente.

## 5. Estimación mensual (punto D, Vía A)

Supuestos por usuario activo/mes: 10 tarjetas abiertas (Enterprise), 3 "Ver más" (Enterprise), 10 fotos principales, 2 búsquedas abandonadas de 4 peticiones, 10 lugares vistos en listas de plan reutilizando la sesión (incluidos en las tarjetas).

| Usuarios | Details | Fotos | Autocompletar cobrable | Coste |
|---|---|---|---|---|
| 10 | 130 | 100 | 80 | 0 $ |
| 100 | 1.300 | 1.000 | 800 | ~6 $ |
| 1.000 | 13.000 | 10.000 | 8.000 | ~303 $ (~280 €) |

Cálculo 1.000: (13.000 − 1.000) × 0,020 = 240 $; (10.000 − 1.000) × 0,007 = 63 $. El mayor ahorro posible: mostrar la valoración solo en la tarjeta abierta y usar Pro en la lista del plan.

## 6. Cuotas y desactivación (punto E)

En vuestro proyecto de Google Cloud (lo configuráis vosotros, os guío paso a paso):
1. Cuotas diarias por API (límite duro real): p. ej. Details 500/día, Fotos 300/día, Autocomplete 2.000/día al inicio.
2. Clave de servidor restringida por API; clave de navegador (Vía B) restringida por dominio y API.
3. Alertas de presupuesto al 50/90/100 % (avisan, no frenan).
4. Opcional: desconexión automática de facturación al superar el presupuesto.

En SplitEasy:
5. Límite por usuario y día (p. ej. 40 tarjetas, 30 fotos), contado en servidor.
6. Interruptor `places_enabled` en la configuración: apagado → solo lugares manuales, al instante y sin publicar.
7. Debounce 300 ms, mínimo 3 letras, sin repetir búsquedas idénticas, sin reintentos ante error de cuota.

## 7. Base de datos (cuando se autorice)

- `places`: usar `provider='google'` + `provider_place_id` único; sin guardar nombre, valoración, foto ni dirección de Google.
- Funciones: `add_google_place(plan_id, place_id)` (sin duplicados), `toggle_favorite(place_id)`.
- Tabla de consumo por usuario/día y ajuste `places_enabled`.
- Sin cambios en autenticación, RLS existentes ni cálculos financieros.

## 8. Etapas (cada una con tu aprobación)

1. Elegir Vía A o B (y, si A, confirmación de Google). Documentación: `docs/architecture/google-places-integration.md` y `docs/adr/ADR-003-google-places.md`.
2. Configurar vuestro Google Cloud: facturación, APIs mínimas, claves restringidas, cuotas, alertas.
3. Base sin coste: migración, favoritos, interruptor, límites, UI con lugares manuales.
4. Búsqueda + tarjeta + ❤️ / ➕.
5. Foto principal; "Ver más" con fotos adicionales y enlace a Google Maps.
6. Pruebas (16 casos del documento) y CHANGELOG.

## 9. Criterios de aceptación

Los de tu documento, más: ningún dato de Google salvo place_id en la base de datos; ningún contenido de Google junto a un mapa; atribuciones visibles; interruptor probado; cuota agotada muestra mensaje y deja añadir manualmente.

## Necesito de ti

- Vía A (diseño propio, requiere confirmación de uso) o Vía B (UI Kit, recomendada).
- Confirmar que la cuenta de facturación de Google Cloud estará en el EEE.

Fuentes: términos EEE y usos permitidos (cloud.google.com/terms/maps-platform/eea-places-api-permitted-uses), ajustes Places EEE (developers.google.com/maps/comms/eea/places), precios (developers.google.com/maps/billing-and-pricing/pricing), sesiones (developers.google.com/maps/documentation/places/web-service/session-pricing).
