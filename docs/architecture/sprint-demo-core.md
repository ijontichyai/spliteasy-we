# Sprint Demo — CORE 1, 2 y 3

**Fecha:** 13 nov 2026. Basado en [phase-01.md](phase-01.md), [ADR-001](../adr/ADR-001-arquitectura-base.md) y [ADR-002](../adr/ADR-002-autenticacion-perfiles.md).

## Qué se ha construido
| Área | Funcionalidad |
|---|---|
| CORE 1 | Crear plan (límite gratuito de 1 plan activo propio), listar mis planes, detalle, participantes con rol, enlaces de invitación de un solo uso (7 días, revocables, guardados como hash), unirse por enlace (`/join/$token`), límite de 4 participantes, archivar y reactivar |
| CORE 2 | Añadir lugares manualmente a un plan, y marcarlos como elegidos, descartados o reabiertos |
| CORE 3 | Gastos con reparto igual o personalizado, validados en una transacción (participantes del plan, suma exacta, sin duplicados gracias a la clave de idempotencia), borrado lógico, balances, sugerencia de transferencias, liquidaciones propuestas que solo confirma el receptor |
| Demo | `/demo`: escapada con 4 amigos (Ana, Bruno, Carla, Diego), 3 lugares y 4 gastos. Los datos viven **solo en el navegador** y se puede cambiar de usuario con "ver como" |

## Base de datos
Migración `drizzle/migrations/0002_core_1_2_3.sql`:
- Tablas: `plans`, `plan_members`, `invitations`, `invitation_redemptions`, `places`, `plan_places`, `favorite_places`, `expenses`, `expense_shares`, `settlements`.
- Los usuarios autenticados solo tienen permiso de **lectura** (filtrada por RLS por pertenencia al plan). Todas las escrituras pasan por funciones transaccionales: `create_plan`, `archive_plan`, `create_invitation`, `revoke_invitation`, `accept_invitation`, `add_place_to_plan`, `set_plan_place_status`, `save_expense`, `delete_expense`, `propose_settlement`, `respond_settlement`, `plan_balances`.
- Salvaguardas: un trigger diferido comprueba que la suma de los repartos coincide con el importe, un trigger impide borrar planes con historial financiero, solo hay un owner activo por plan y solo una liquidación abierta por pareja.
- Los perfiles de los compañeros de plan son visibles (`shares_plan_with`). Los de otros usuarios no.

## Lógica en la interfaz
- `src/lib/money.ts`: cálculos en céntimos, reparto igual determinista y balances con la misma fórmula que `plan_balances`. Los balances que se muestran se calculan en el navegador a partir de los datos que RLS permite leer. La base de datos sigue siendo la que valida cada operación.
- `src/components/plan/plan-view.tsx`: la misma vista para el plan real y para la demo.

## Verificación
- **Base de datos** (prueba transaccional con 5 usuarios temporales, revertida):
  - un 2.º plan activo se rechaza;
  - el token no se guarda en claro;
  - reutilizar una invitación falla;
  - un no miembro no puede invitar ni ver planes, gastos ni balances;
  - el 5.º participante se rechaza;
  - un token inventado falla;
  - reenviar el mismo gasto no lo duplica;
  - una suma incorrecta y un participante ajeno se rechazan;
  - balances: Ana +86,67, Bruno −23,33, Carla −33,34, Diego −30,00, con suma 0;
  - una liquidación duplicada se rechaza;
  - una liquidación propuesta no cambia el balance;
  - el pagador no puede autoconfirmar;
  - cuando el receptor confirma, el balance queda a 0.
- **Tests automáticos:** 11 OK (`bunx vitest run`), con reparto 10 € / 3 = 3,34 / 3,33 / 3,33, suma cero, solo cuentan las liquidaciones confirmadas y las transferencias saldan las cuentas.
- **Navegador (móvil 390 px):** la demo carga sin errores; Bruno propone un pago, solo Ana puede confirmarlo, y se añade un gasto.

## Pendiente
- Recorrido real con sesión iniciada en el navegador (crear plan → invitar → gastos): hacen falta cuentas confirmadas con buzones reales. La lógica está verificada en la base de datos, pero las pantallas reales no se han probado con sesión.
- Favoritos personales: la tabla y RLS existen, pero no hay pantalla.
- Votaciones, itinerario, PDF, multidivisa, Premium y patrocinio del plan: no implementados. Los límites gratuitos se aplican siempre.
- Cambiar roles y expulsar miembros: no implementado.
