# AUTH-002.2 — Informe de implementación y pruebas (2026-11-14)

Migración: `drizzle/migrations/0004_auth_002_2_admin_roles.sql` (aditiva). Objetos nuevos: enum `app_role`, tablas `user_roles` y `admin_audit_log`, funciones `has_role`, `is_admin`, `admin_grant_role`, `admin_revoke_role`, `admin_list_roles`, `log_admin_action` (sin EXECUTE para usuarios), trigger `admin_audit_log_immutable`.

Primer admin temporal: cuenta de prueba A (`test-a@spliteasy.test`), insertado desde backend con motivo documentado en `user_roles.note`. Debe sustituirse por la cuenta real del propietario antes de producción.

Denegaciones sin rollback: las funciones admin **no lanzan excepción** al denegar; registran `denied` y devuelven `{ok:false,error}`. Verificado: cada intento denegado incrementa el log en 1 (E3, A6).

## Pruebas nuevas (29/29 PASS, sesiones reales, RLS real)
| ID | Prueba | Resultado | Evidencia |
|---|---|---|---|
| E1–E2 | B inserta/modifica user_roles | PASS | `permission denied for table user_roles` |
| E3 | B llama admin_grant_role | PASS | `FORBIDDEN`, +1 registro `denied`, actor=B |
| E4 | B pone role=admin en su metadata | PASS | is_admin()=false |
| E5–E6 | B escribe en el log | PASS | `permission denied for function log_admin_action` / `for table admin_audit_log` |
| E7 | B lista roles | PASS | `FORBIDDEN` |
| N1–N3 | Enumeración | PASS | C has_role(A)=false; C ve 0 roles; A has_role(A)=true |
| I1–I2 | B/C leen el log | PASS | 0 filas |
| I3–I5 | Admin A lee plan/perfil/gastos/pagos privados de C | PASS | 0 filas |
| A1 | A concede support a D | PASS | registro con actor, acción, recurso, fecha y `success` |
| A2–A4 | D (support) | PASS | ve su rol; no se concede admin; no lee el log |
| A5 | Motivo vacío | PASS | `REASON_REQUIRED` |
| A6 | A revoca su último admin | PASS | `LAST_ADMIN`, registrado, A sigue admin |
| A7–A9 | Revocar, listar, leer log | PASS | ok, auditado |
| A10–A11 | UPDATE/DELETE del log con service_role | PASS | `audit log is immutable` |
| A12 | Admin A borra el log | PASS | `permission denied` |
| V1 | Visitante sin sesión | PASS | sin acceso a tabla ni funciones |

## Regresión AUTH-002.1b: 8/8 PASS
Escenarios 1–8 idénticos al informe anterior (nuevo plan QA `fce92eef-…`; el anterior se archivó para respetar el límite Free de 1 plan activo).

## Datos de prueba conservados
4 cuentas QA; planes "QA AUTH-002.1b" (2, uno archivado) y "QA privado C"; rol admin de A; rol support de D (revocado); entradas de auditoría (inmutables, no se pueden borrar).

## Riesgos pendientes
- A es admin temporal: reemplazar antes de usuarios reales.
- La clave de servicio puede insertar roles directamente (necesario para el arranque); no está en el frontend.
- El log puede crecer con intentos denegados (sin límite de frecuencia aún).
- Sin panel admin ni acciones de soporte (fuera de alcance).
- R3–R6 y la falta de "salir del plan" siguen abiertos.
