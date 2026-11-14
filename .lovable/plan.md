# BILLING-001.1 — Opción A: precios finales sin recargos (solo Stripe Sandbox)

## Qué se hará
1. Quitar la gestión integral de Stripe (+3,5 %) del pago de prueba y no añadir ningún cálculo automático de impuestos.
2. Mantener 1,49 € / 3,99 € / 29,99 € como importe final cobrado, sin IVA añadido.
3. Antes de tocar precios en Stripe Sandbox, comprobar si los precios actuales llevan configuración de impuestos que añada cargos. Solo si fuera necesario, sustituirlos reutilizando los mismos identificadores (no se crean identificadores nuevos, así no cambia ninguna referencia en la app).
4. Verificar en el formulario de pago de prueba que se muestran exactamente esos importes (con dirección de Bélgica y España).
5. Ejecutar las 23 pruebas de la app; añadir una prueba que asegure que el pago no activa la gestión integral ni impuestos automáticos.
6. Documentar las obligaciones fiscales pendientes para el lanzamiento comercial (alta como vendedor en España, IVA del país del cliente vía OSS, facturación, mención "IVA incluido", decisión futura sobre automatizar impuestos) en el informe de facturación, el CHANGELOG y las reglas de negocio.

## Límites
- Solo Stripe Sandbox; sin pagos reales, sin publicar, sin servicios de pago adicionales.

## Detalles técnicos
- `src/lib/billing.functions.ts`: eliminar `managed_payments` y su metadato; no añadir `automatic_tax`.
- Consulta en Sandbox de `tax_behavior` de los precios `weekly_explorer`, `monthly_adventurer`, `annual_voyager` (o los IDs vigentes); recrear con el mismo ID solo si procede.
- Docs: `docs/security/billing-001-report.md`, `CHANGELOG.md`, `mem://business`, `roadmap.md`.
