# AUTH-002.1b — Informe de validación RLS (2026-11-14)

Método: 4 cuentas ficticias confirmadas (`test-a|b|c|d@spliteasy.test`), cada una con **sesión real** y cliente público (RLS real, sin service_role). Plan de prueba `QA AUTH-002.1b` (id `dba12d42-96b0-4838-be70-529d90156cbd`). La clave de servicio se usó solo para crear las cuentas y para marcar a D como "left" (no existe aún una función de "salir del plan"). Sin cambios de esquema, políticas ni login. Ningún usuario real modificado.

| # | Escenario | Resultado | Evidencia |
|---|---|---|---|
| 1 | A gestiona su plan | PASS | renombra y cambia fecha (fila devuelta); archive_plan true/false ok; create_invitation + revoke_invitation ok |
| 2 | B consulta su plan | PASS | plans=1, members=3, expenses=2, plan_balances=3 filas |
| 3 | C sin acceso | PASS | plans/members/expenses=0; perfiles A/B=[]; plan_balances, create_invitation, add_place_to_plan → `FORBIDDEN` |
| 4 | B no escala | PASS | update name → 0 filas (RLS); update owner_id → `permission denied for table plans`; archive_plan / create_invitation → `FORBIDDEN`; update plan_members.role → 0 filas |
| 5 | Nadie activa Premium | PASS | A, B y C: update premium_sponsored/sponsor_id → `permission denied for table plans`; update plan_limits → `permission denied`; estado final premium_sponsored=false, sponsor_id=null, owner=A |
| 6 | Ex-miembro pierde acceso | PASS | D activo veía 2 perfiles; tras "left": D ve [] de A/B, A ve [] de D, D ve 0 planes |
| 7 | Tras cerrar sesión y volver | PASS | sin sesión → `permission denied`; tras re-login A edita, B consulta, C sigue sin acceso, B no activa Premium |
| 8 | CRUD legítimo | PASS | B añade lugar; A crea gasto 60 € y crea+borra otro; B propone pago 30 €; B no puede confirmarlo (`ONLY_RECEIVER`); A (receptor) confirma |
| — | Pantalla de la app | PASS | inicio de sesión de A en la app y apertura del plan muestran "QA AUTH-002.1b" |

## Riesgos pendientes
- R3 funciones invocables por cualquier usuario autenticado (validan internamente; comprobado FORBIDDEN en esta prueba).
- R4 lugares visibles para su creador tras salir del plan.
- R5 posible enumeración de emails vía recuperación de contraseña.
- R6 votos aún no existen.
- Nuevo: no hay función para que un participante salga del plan; la prueba 6 simuló la salida desde servidor.
- Datos de prueba conservados (4 cuentas + 1 plan); se borran solo con autorización.
