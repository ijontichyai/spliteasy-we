# ADR-001: Arquitectura base de SplitEasy

- **Estado:** Aceptado — 13 nov 2026
- **Ámbito:** Fase 01 (diseño). Detalle en [phase-01.md](../architecture/phase-01.md).

## Contexto
SplitEasy une planificación, descubrimiento de lugares y reparto de gastos en un plan compartido. Restricciones: presupuesto inicial 0 €, seguridad por grupo, preparación para Stripe, Places e IA sin activarlos aún, trabajo incremental por CORE.

## Decisión
1. **Backend:** Lovable Cloud (PostgreSQL + Auth + RLS + Storage); lógica privada en funciones de servidor del proyecto.
2. **Transacciones:** operaciones de varias filas (gasto + repartos, aceptar invitación, liquidaciones, archivado) en funciones transaccionales de base de datos, nunca en varias llamadas desde el navegador.
3. **Dinero:** balances calculados, no almacenados; importes `numeric(12,2)`; reparto determinista de céntimos; suma de repartos = importe exacto; participantes del mismo plan.
4. **Liquidaciones:** estados `proposed`/`confirmed`/`rejected`/`cancelled`; solo las confirmadas afectan a balances; **solo el receptor confirma**; protección contra duplicados (clave de idempotencia y una propuesta abierta por par).
5. **Invitaciones:** token aleatorio guardado solo como hash, caducidad 7 días, 1 uso, revocable por owner/admin, consumo atómico.
6. **Archivado:** los planes se archivan (solo lectura); no se borran si tienen historial financiero (FKs `RESTRICT`).
7. **Permisos:** roles del plan (owner/admin/member) independientes de derechos Premium; un owner Premium puede patrocinar su plan para sus miembros.
8. **Modelo gratuito:** 1 plan activo propio y 4 participantes por plan, en tabla de límites configurable y validado en base de datos.
9. **Orden:** CORE 1 → CORE 2 → CORE 3; sin Places, IA ni Stripe hasta autorización expresa.

## Alternativas descartadas
- Servidor propio permanente: coste y mantenimiento innecesarios.
- Balances almacenados: riesgo de desincronización.
- Tokens de invitación en texto plano: riesgo si se filtra la base de datos.
- Borrado en cascada de planes: pérdida de historial financiero.
- Confirmación de liquidaciones por admin: puede registrar pagos no recibidos.
- Suscripción individual obligatoria para cada participante: fricción para grupos.

## Consecuencias
- Más lógica en funciones SQL, que requiere pruebas específicas (redondeo, concurrencia, permisos).
- Los límites gratuitos pueden ajustarse sin migración.
- Integraciones externas se añadirán sin rediseñar el modelo.
