# AUTH-002 — Análisis de seguridad: tipos de usuario, roles y RLS (solo análisis)

Etapa 1: sin cambios en base de datos, políticas, login ni despliegue. Este documento es la propuesta para aprobar.

## 1. Estado actual (inspeccionado)

- Acceso: solo usuarios con sesión; ninguna tabla tiene permisos para visitantes anónimos (ADR-002).
- Login: email y contraseña con confirmación obligatoria. Google no está activado (ADR-002 lo excluía).
- Perfiles: se crean solo con el trigger de registro; columnas protegidas por trigger.
- Planes: lectura por pertenencia (`is_plan_member`); toda escritura pasa por funciones seguras del servidor (crear plan, invitar, gastos, liquidaciones, archivar).
- Roles de grupo existentes: `owner`, `admin`, `member`.
- No existen todavía: rol de administrador de la plataforma, suscripciones, eventos de pago, registro de auditoría, votaciones.

Tablas afectadas: profiles, plans, plan_members, invitations, invitation_redemptions, places, plan_places, favorite_places, expenses, expense_shares, settlements, plan_limits (+ nuevas propuestas abajo).

## 2. Tipos de cuenta (plataforma) — separados de los roles de grupo

| Tipo | Cómo se determina | Quién lo cambia |
|---|---|---|
| Visitante | Sin sesión | — |
| Free | Sesión sin suscripción activa | Por defecto |
| Premium | Suscripción `active` con `current_period_end > now()` calculada en el servidor | Solo eventos de pago verificados o procedimiento admin |
| Administrador | Fila en `user_roles` con rol `admin` | Solo desde servidor/SQL privilegiado; nunca desde el navegador |

El estado Premium no se guarda en `profiles` (evita que el usuario lo edite); se calcula con una función `is_premium(uid)`.

## 3. Roles dentro del grupo

| Brief | Actual | Propuesta |
|---|---|---|
| Organizador | owner | Se mantiene (nombre visible "Organizador") |
| — | admin | Se mantiene como "Co-organizador" (ya aprobado en Fase 01) |
| Participante | member | Se mantiene |

## 4. Matriz de acceso

| Recurso | Visitante | Participante | Organizador | Externo con sesión | Admin plataforma |
|---|---|---|---|---|---|
| Búsqueda Google en Descubre | Sí (componente de Google, sin datos propios) | Sí | Sí | Sí | Sí |
| Perfil propio | — | Leer/editar | Leer/editar | Leer/editar | Propio |
| Perfil de co-miembros | No | Nombre | Nombre | No | No |
| Plan, miembros, lugares | No | Leer | Leer + editar config | No | No |
| Gastos/repartos | No | Leer; crear; borrar los suyos | Leer; crear; borrar cualquiera | No | No |
| Liquidaciones | No | Proponer; confirmar solo si es receptor | Igual (no confirma por otros) | No | No |
| Invitaciones | Usar token válido tras iniciar sesión | No ve lista | Crear/revocar/ver | Usar token válido | No |
| Suscripción propia | No | Leer | Leer | Leer | Leer metadatos (sin datos de pago) |
| Eventos de pago | No | No | No | No | Solo servidor |
| Auditoría admin | No | No | No | No | Leer |
| Límites del plan gratuito | No | Leer | Leer | Leer | Cambiar vía servidor |

## 5. Cambios de base de datos propuestos (para la etapa de implementación)

1. `user_roles` + enum `app_role` (`admin`) + función `has_role()`. Sin INSERT/UPDATE/DELETE para usuarios.
2. `subscriptions` (user_id, plan `weekly|monthly|annual`, status, current_period_start/end, provider ids). Usuario: solo SELECT propio. Escritura solo por el servidor.
3. `billing_events` (eventos de pago crudos, idempotentes por id de proveedor). Sin acceso de usuarios.
4. `admin_audit_log` (quién, acción, objetivo, fecha). Solo lectura para admins; escritura por funciones.
5. Función `is_premium(uid)` y `plan_has_premium(plan)` (premium del usuario o plan patrocinado por un owner Premium).
6. Endurecimientos detectados (ver riesgos): filtrar `status='active'` en `shares_plan_with`; asegurar que `premium_sponsored`/`sponsor_id` de `plans` no sean editables desde el navegador.
7. Google OAuth: activar proveedor Google + "Sign in with Lovable" sin coste; el trigger de perfiles ya cubre altas por Google. Botón en `/auth`. (Requiere tu aprobación porque cambia el login y ADR-002.)

Nada de esto activa Stripe ni pagos reales.

## 6. Riesgos detectados

- R1: `shares_plan_with` no filtra miembros activos → un ex-miembro sigue viendo nombres de antiguos compañeros. Baja gravedad; se corrige en la etapa 2.
- R2: Verificar que la política de UPDATE de `plans` no permite tocar `premium_sponsored`/`sponsor_id` (pendiente de comprobación con consulta; si lo permite, sería escalada a Premium desde el navegador).
- R3: Las funciones de escritura son llamables por cualquier usuario con sesión; cada una valida pertenencia y rol internamente (correcto, se incluirá en pruebas).
- R4: `places` creados por un usuario quedan visibles para él aunque salga del plan — aceptable.
- R5: Enumeración de usuarios: el registro devuelve mensajes genéricos; se revisará que reset de contraseña no revele si el email existe.
- R6: Votaciones no existen aún; sus políticas se definirán cuando se aprueben.

## 7. Incompatibilidades con decisiones previas

- ADR-002 decía "solo email". Google OAuth requiere un addendum a ADR-002.
- El brief solo nombra Organizador/Participante; el diseño aprobado tiene también co-organizador (`admin`). Propuesta: mantenerlo.
- "Visitante puede consultar información de lugares": se cumple con el componente de Google en Descubre; no se abre ninguna tabla a anónimos (coherente con ADR-002 y ADR-003).

## 8. Plan de pruebas (SQL con rollback + navegador)

Usuarios: A organizador, B participante, C externo.
- A crea plan, invita, edita, archiva → OK.
- B lee plan, añade gasto, no puede borrar gasto de A, no puede revocar invitaciones, no puede editar el plan.
- C: 0 filas en plans, plan_members, expenses, settlements, profiles de A/B; llamadas a funciones → FORBIDDEN.
- B intenta insertar en `user_roles` o `subscriptions`, o actualizar `premium_sponsored` → denegado.
- Visitante anónimo: 0 acceso a todas las tablas.
- Repetir tras cerrar y abrir sesión en el navegador.

## 9. Orden de implementación tras aprobación (cada paso por separado)

1. Endurecimientos R1/R2 + pruebas.
2. Roles de plataforma y auditoría.
3. Suscripciones y Premium calculado (sin pagos reales).
4. Google OAuth (si lo apruebas).
5. Documentación: ADR-005 roles/seguridad, addendum ADR-002, CHANGELOG.

Coste: 0 €.
