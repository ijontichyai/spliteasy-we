# AUTH-002.1b — Validación final de seguridad RLS

Objetivo: comprobar R1 y R2 con tres usuarios independientes y entregar un informe PASS / FAIL / NOT TESTED con evidencia. Sin cambios de esquema, políticas, login ni publicación.

## 1. Datos de prueba (autorizados)
- Crear 3 cuentas ficticias ya confirmadas, sin enviar emails:
  - A `test-a@spliteasy.test` (organizador)
  - B `test-b@spliteasy.test` (participante)
  - C `test-c@spliteasy.test` (externo)
- A crea el plan "QA AUTH-002.1b" mediante la función normal, genera una invitación y B la acepta.
- Un gasto y una liquidación de prueba entre A y B.
- Un cuarto usuario D `test-d@spliteasy.test` para la prueba 6: se une y después pasa a "left".
- Ningún usuario ni dato existente se modifica. Al final las cuentas se conservan; solo se borran si lo autorizas.

## 2. Pruebas (iniciando sesión de verdad con cada cuenta)
| # | Prueba | Cómo |
|---|---|---|
| 1 | A gestiona su plan | renombrar, cambiar fechas, archivar/reactivar, crear/revocar invitación |
| 2 | B consulta su plan | leer plan, miembros, gastos, saldos |
| 3 | C no accede | leer plan/miembros/gastos/perfiles de A y B → 0 filas; llamar funciones del plan → error |
| 4 | B no escala | B intenta editar el plan, cambiar owner_id, revocar invitaciones, archivar → rechazado |
| 5 | Nadie activa Premium | A, B y C intentan cambiar premium_sponsored / sponsor_id → rechazado |
| 6 | Ex-miembro | D (left) no ve perfiles de A/B, y A/B no ven el de D |
| 7 | Tras cerrar sesión | cerrar sesión, volver a entrar con A, B, C y repetir 1–3 |
| 8 | CRUD legítimo | añadir lugar, gasto, borrar gasto, proponer y confirmar liquidación (solo el receptor) |

Además, una prueba en el navegador de la app con A para confirmar que las pantallas siguen funcionando.

## 3. Entregable
- `docs/security/auth-002-1b-report.md`: tabla PASS/FAIL/NOT TESTED, evidencia (respuesta o error devuelto por cada intento), riesgos pendientes (R3–R6 y cualquier fallo nuevo).
- Entrada en CHANGELOG.md.
- Si algo falla: se documenta, no se corrige. Me detengo y espero autorización para AUTH-002.2.

## Detalles técnicos
- Cuentas creadas con la API de administración de auth (email_confirm=true) desde un script temporal en /tmp; los perfiles los crea el trigger existente.
- Las pruebas usan el cliente público con la sesión real de cada usuario (RLS real, sin service_role), vía script en /tmp.
