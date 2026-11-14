# BILLING-001.1 — Precios con IVA incluido y revisión del recargo del 3,5 %

## Qué es el recargo del 3,5 %
- Proveedor: **Stripe** (mismo proveedor ya elegido; no es un tercero). Es la gestión integral de cumplimiento de Stripe ("Managed Payments"), activada hoy en el pago de prueba (`managed_payments: { enabled: true }`).
- Condiciones: +3,5 % por transacción, además de la comisión normal de Stripe. Stripe actúa como vendedor registrado: calcula, cobra, declara e ingresa IVA en ~80 países, gestiona fraude, disputas, reembolsos, soporte de la transacción y recibos. El extracto bancario del cliente muestra `LINK.COM* ...` y el pie de pago muestra condiciones estándar de Stripe. Solo aplica a suscripciones nuevas.
- En Sandbox no se cobra nada real; el recargo solo existiría con pagos reales.
- Se puede desactivar sin afectar las pruebas: el pago de prueba, el aviso firmado y la activación Premium funcionan igual.
- Nada se ha activado en modo real ni hay servicios de pago adicionales aprobados.

## Opciones (elige una)

**A. Desactivar recargo, sin cálculo automático de impuestos (0 % extra)** — recomendado para el presupuesto 0 €
- Se quita la gestión integral; se cobra exactamente 1,49 / 3,99 / 29,99 € con IVA incluido.
- Tú (vendedor en España) declaras el IVA más adelante (p. ej. OSS) antes de pagos reales.

**B. Desactivar recargo y usar solo cálculo de impuestos de Stripe (+0,5 % solo con pagos reales)**
- Precios marcados "IVA incluido"; Stripe desglosa el IVA por país sin subir el precio final. Declaración a tu cargo. Requiere tu aprobación expresa (servicio de pago).

**C. Mantener la gestión integral (+3,5 %)** con precios tratados como IVA incluido. Requiere aprobación expresa.

## Cambios técnicos (tras tu elección)
- `src/lib/billing.functions.ts`: quitar `managed_payments` (A/B); en B añadir `automatic_tax`.
- Precios Sandbox: recrear los 3 precios con los mismos IDs e importes, marcados como impuestos incluidos (B/C); en A el importe ya es final.
- Verificar en Sandbox que el formulario muestra 1,49 € con dirección belga y española; repetir las 23 pruebas de la app.
- Actualizar `docs/security/billing-001-report.md`, CHANGELOG y la memoria de reglas de negocio (precios finales con IVA incluido).
- Sin pagos reales, sin publicar, sin otros servicios.
