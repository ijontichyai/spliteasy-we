# RELEASE-001 — Auditoría pre-lanzamiento Beta (2026-11-14)

## Cambios aplicados (aprobados)
- Vista protegida de soporte: aviso "Vista protegida: solo lectura, importes ocultos" (ES/EN) en lugar de "Plan archivado"; saldos a cero y "todo saldado" muestran "Oculto".
- Dependencias: @tailwindcss/vite 4.3.5; overrides js-yaml ^4.3.2, seroval ^1.6.11, source-map-js ^1.2.2. Vulnerabilidades 12 -> 3.
- Intento de actualizar TanStack Start/Router a la última versión: rompía la API de funciones de servidor (inputValidator). Revertido a 1.168.60/1.170.41 fijados.

## Resultados
| Comprobación | Resultado |
|---|---|
| Compilación | PASS |
| Pruebas de la app (24) | PASS 24/24 |
| Dependencias: js-yaml, seroval, source-map-js | PASS (corregidas) |
| Dependencias: zod 3.25.76 (alto, DoS por colecciones enormes) | FAIL — requiere migración a zod 4 (cambio mayor); mitigado porque todas las entradas validadas tienen límites de tamaño |
| Metadatos por página (título/descripción/OG/twitter) | PASS, todas las páginas |
| Seguridad BD (escaneo rápido) | PASS; aviso informativo plan_limits intencionado |
| Revisión profunda | Relanzada sobre el código actual — PENDIENTE |
| Suites QA soporte 49 / admin 29 / CORE 8 escenarios | NOT TESTED en esta ronda: los guiones temporales se borraron al reiniciar el entorno; la base de datos no se ha modificado desde su último PASS |
| Recorrido navegador móvil/escritorio | NOT TESTED |
| Pago Sandbox 4242 / rechazada / cancelar renovación | NOT TESTED — pendiente prueba manual del usuario |
| Stripe | Solo Sandbox; sin pagos reales |

## Hallazgos de publicación
- La app YA está publicada y pública (versión anterior) con analítica de visitas activa. No se ha publicado nada nuevo. Decidir si mantenerla pública durante la Beta.
- Clave de Google Maps: debe permitir el dominio publicado spliteasy-we.lovable.app, o Descubre fallará en producción (configuración en Google Cloud del usuario).

## Bloqueantes restantes (P0)
1. Prueba manual de pago Sandbox.
2. Resultado de la revisión profunda.
3. Sustituir el administrador temporal (cuenta QA A) por la cuenta real.
4. Fiscalidad solo antes de cobrar de verdad (ver billing-001-report.md).

## P1/P2 pendientes (sin cambios)
zod 4, salir del plan, R3–R6, retención de auditoría, directorio admin con duplicados.
