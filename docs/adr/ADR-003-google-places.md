# ADR-003: Google Places mediante Places UI Kit

- **Estado:** Aceptado (diseño) — 13 nov 2026. Implementación pendiente de autorización.
- **Detalle:** [google-places-integration.md](../architecture/google-places-integration.md)

## Contexto
SplitEasy quiere búsqueda real de establecimientos con experiencia visual premium. La facturación estará en España (EEE), donde los términos de Google Maps Platform limitan el contenido de Places API a usos permitidos concretos y prohíben mostrarlo junto a un mapa. Presupuesto ajustado y aplicación comercial.

## Decisión
1. Usar **Places UI Kit** (componentes Essentials: autocompletar básico, Place Details y Place Details Compact).
2. Fotos, valoraciones, categorías y horarios solo dentro de los componentes oficiales; atribuciones intactas.
3. Guardar solo `place_id` y datos propios.
4. Proyecto y credenciales **propios** de Google Cloud: clave de navegador restringida por dominio y API, cuotas duras, alertas de presupuesto.
5. Interruptor de emergencia en la base de datos; límites de la app solo complementarios.
6. Lugares manuales como alternativa permanente.

## Alternativas descartadas
- Places API con tarjeta propia: riesgo de incumplir los usos permitidos del EEE.
- Conector gestionado de Lovable: menos control directo de facturación, cuotas y alertas.
- Componentes Advanced (UI Kit Pro): ~5 veces más caros; solo con nueva aprobación.

## Consecuencias
- Personalización visual limitada a lo que permite Google; el resto de la interfaz es SplitEasy.
- El control de gasto real está en Google Cloud, no en la app.
- Coste estimado bajo (~0 $ hasta 100 usuarios, ~20 $ con 1.000).
