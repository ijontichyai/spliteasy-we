# AUTH-002.1 — Endurecimiento RLS (solo R1 y R2)

## Hallazgos confirmados (consulta a la base de datos)

- **R1 confirmado:** `shares_plan_with` no comprueba que el otro usuario siga activo en el plan. Un ex-miembro sigue apareciendo como compañero y su perfil sigue siendo visible (y él ve los de antiguos compañeros).
- **R2 confirmado (vulnerabilidad real):** el rol de usuario con sesión tiene permiso de UPDATE sobre todas las columnas de `plans`, incluidas `premium_sponsored` y `sponsor_id`. Un organizador o co-organizador podría marcar su plan como patrocinado Premium desde el navegador sin pagar. Además, el rol anónimo conserva un permiso de UPDATE de tabla (hoy lo bloquea RLS, pero viola mínimo privilegio y ADR-002).

## Cambios (una sola migración, sin tocar datos)

1. **R1:** redefinir `shares_plan_with` exigiendo `status='active'` en ambos lados (`a` y `b`). Firma y permisos sin cambios.
2. **R2:**
   - Revocar UPDATE de tabla en `plans` a `anon` y `authenticated`.
   - Conceder UPDATE solo en columnas editables legítimas: `name`, `type`, `start_date`, `end_date`, `city`, `estimated_budget`, `status`.
   - Trigger de defensa `plans_protect_columns`: si quien actualiza es un usuario (`authenticated`), rechaza cambios en `premium_sponsored`, `sponsor_id`, `owner_id`, `archived_at`, `archived_by`, `currency`, `created_at`. Las funciones del servidor (archivar) siguen funcionando porque corren con privilegios propios.
   - La política UPDATE existente (owner/admin y plan no archivado) se mantiene igual.
3. Ningún cambio en frontend, login, roles de grupo, suscripciones ni Stripe.

## Pruebas (SQL con usuarios simulados A/B/C, todo en transacción con rollback)

1. B activo lee perfiles de A y C-no-miembro no visible → OK.
2. B sale del plan (status `left`): ya no ve el perfil de A, y A ya no ve el de B.
3. A (organizador) intenta `premium_sponsored=true` / `sponsor_id` → error.
4. A edita nombre, fechas, ciudad y presupuesto → OK; archivar y reactivar → OK.
5. Regresión: crear plan, invitar/aceptar, añadir lugar, gasto, liquidación → OK.
6. Revisar permisos finales con `has_column_privilege`.
7. Ejecutar los 15 tests existentes y comprobación en navegador de editar plan.

## Entregables

- CHANGELOG (registro para el Documento Maestro), nota en `docs/architecture/sprint-demo-core.md` con funciones/políticas modificadas, resultados de pruebas y riesgos pendientes (R3–R6 del análisis AUTH-002).
- Coste 0 €. Sin publicar. Me detengo al terminar a la espera de AUTH-002.2.
