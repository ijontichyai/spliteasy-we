# SplitEasy | Plan, Go & Share — Fase 01 (revisión 2): Diseño arquitectónico

Esto es solo diseño. No se crean tablas, no se toca código, no se activa Lovable Cloud y no se conectan APIs. Este documento está pensado para guardarse en el repositorio como `docs/architecture/phase-01.md` cuando se apruebe.

## 0. Decisiones incorporadas de la revisión

| # | Decisión | Dónde se aplica |
|---|---|---|
| D1 | Orden CORE 1 → CORE 2 → CORE 3 (Plan → Go → Share). CORE 2 empieza solo con lugares manuales | §7 |
| D2 | Gastos y repartos se validan en una sola transacción: mismo plan, suma exacta | §4.3, §5 |
| D3 | Liquidaciones `proposed` / `confirmed`; solo las confirmadas cuentan; protección contra duplicados | §4.3 |
| D4 | Invitaciones: token guardado como hash, caducidad, revocación, usos controlados de forma atómica | §4.1 |
| D5 | Los planes se archivan; no se borran si tienen historial financiero | §4.1, §5 |
| D6 | Roles del plan separados de los derechos Premium | §3, §6 |
| D7 | El organizador con Premium activa Premium para el plan y sus participantes | §3 |
| D8 | Modelo gratuito provisional: 1 plan activo, 4 participantes, funciones esenciales (pendiente de aprobación comercial) | §3 |
| D9 | Sin Google Places, IA, Stripe ni servicios con coste en esta etapa | §8 |
| D10 | Diseño, decisiones, relaciones, RLS y criterios de aceptación documentados | todo el documento |

## 1. Resumen del producto

Una app para todo el ciclo de un plan en grupo: crear e invitar, descubrir lugares y guardarlos, organizar, registrar gastos y liquidar. Público: amigos, parejas, familias y grupos pequeños. Precios Premium (pago íntegro por adelantado, renovación automática, acceso hasta fin de periodo si se cancela): Weekly Explorer 1,49 € / 7 días, Monthly Adventurer 3,99 € / 1 mes, Annual Voyager 29,99 € / 12 meses. La app calcula y registra saldos; no mueve dinero.

## 2. Arquitectura

```text
Navegador (React + TypeScript)
   | lectura/escritura directa solo donde RLS basta
   v
Lovable Cloud
   ├─ Auth (email)          ├─ PostgreSQL + RLS
   ├─ Funciones SQL seguras (operaciones financieras, invitaciones, archivado)
   └─ Funciones de servidor (futuro: Stripe, Places, IA con claves secretas)
```

Principio: toda operación con varias filas relacionadas (gasto + repartos, aceptar invitación, confirmar liquidación, archivar) se hace en **una función de base de datos transaccional**, nunca con varias llamadas sueltas desde el navegador.

## 3. Permisos: roles del plan vs. derechos Premium (D6, D7, D8)

Son dos ejes independientes:

```text
Rol en el plan (qué puedes hacer DENTRO del plan)
  owner  : todo, incluido archivar, cambiar roles, activar Premium del plan
  admin  : editar plan, invitar, gestionar gastos ajenos
  member : ver, añadir gastos propios, proponer lugares

Derecho Premium (qué funciones están disponibles)
  user_entitlement : el usuario tiene suscripción activa (futuro Stripe)
  plan_entitlement : el plan está "patrocinado" por un owner con Premium
```

- **Patrocinio de plan (D7)**: un owner con Premium activo marca su plan como `premium_sponsored`. Todos los miembros activos de ese plan usan las funciones Premium **dentro de ese plan**, sin pagar. Fuera de él, siguen siendo gratuitos.
- Si la suscripción del patrocinador caduca, el plan vuelve a límites gratuitos: nada se borra, solo se bloquean nuevas acciones Premium (solo lectura de lo existente).
- Una función `plan_has_premium(plan_id)` decide: patrocinador con suscripción activa hoy.
- **Modelo gratuito provisional (D8, pendiente de aprobación comercial)**:
  - 1 plan activo como owner (los archivados no cuentan; se puede ser miembro de planes ajenos).
  - Máximo 4 participantes por plan.
  - Incluye: crear plan, invitar, lugares manuales y favoritos, gastos con reparto igual y personalizado, balances y liquidaciones.
  - Premium: planes y participantes ilimitados, Places, IA, votaciones, itinerario, PDF, historial avanzado.
- Los límites se guardan en una tabla de configuración (`plan_limits`) para poder cambiarlos sin migración, y se validan en la base de datos, nunca solo en pantalla.

## 4. Tablas

Convenciones: `id uuid` PK por defecto; `created_at`/`updated_at timestamptz`; importes `numeric(12,2)`; moneda `char(3) default 'EUR'` (una por plan en el MVP); sin acceso anónimo.

### 4.0 Base
- **profiles**: `id` PK = FK `auth.users.id`; `display_name`, `avatar_url`, `locale`; `deleted_at` (anonimización RGPD sin romper gastos).

### 4.1 CORE 1 — Planes y grupos
- **plans**: `owner_id` FK profiles; `name`; `type` enum; `start_date`, `end_date`; `city`, `area`; `estimated_budget`; `currency`; `status` enum (`draft`, `active`, `closed`); `archived_at timestamptz null`, `archived_by`; `premium_sponsored boolean default false`, `sponsor_id` FK profiles null.
  - Check: `end_date >= start_date`; `sponsor_id` solo si `premium_sponsored`.
- **plan_members**: `plan_id` FK, `user_id` FK profiles, `role` enum (`owner`,`admin`,`member`), `status` enum (`active`,`left`,`removed`), `joined_at`, `left_at`. Único (`plan_id`,`user_id`). Exactamente un `owner` activo por plan (índice único parcial). Los miembros que salen se marcan, no se borran (siguen apareciendo en gastos antiguos).
- **invitations (D4)**: `plan_id` FK; `created_by`; `token_hash text unique` (SHA-256 del token; el token real solo se muestra una vez al crearlo, 32+ bytes aleatorios); `role_granted` (`member` o `admin`); `expires_at` (por defecto 7 días); `max_uses` (por defecto 1); `use_count`; `revoked_at`. Check `use_count <= max_uses`.
- **invitation_redemptions**: `invitation_id` FK, `user_id` FK, `redeemed_at`. Único (`invitation_id`,`user_id`) → auditoría y sin dobles usos.
- **Función `accept_invitation(token)`**: hashea el token, bloquea la fila (`FOR UPDATE`), comprueba no revocada, no caducada, usos disponibles, límite de participantes; incrementa `use_count`, crea la membresía y el registro de uso, todo en una transacción. Error genérico si falla (no revela si el token existe).

### 4.2 CORE 2 — Lugares (manuales) y favoritos
- **places**: `provider` enum (`manual` ahora; `google` reservado), `provider_place_id null`, `name`, `category` enum, `address`, `lat`, `lng` (opcionales), `price_level`, `url`, `created_by`. Único (`provider`,`provider_place_id`) cuando no es nulo. Los lugares manuales pertenecen a quien los crea.
- **favorite_places**: `user_id`, `place_id`, `note`. Único (`user_id`,`place_id`).
- **plan_places**: `plan_id`, `place_id`, `added_by`, `note`, `status` enum (`proposed`,`chosen`,`discarded`). Único (`plan_id`,`place_id`). Será la base de votaciones e itinerario.

### 4.3 CORE 3 — Gastos, repartos y liquidaciones
- **expenses**: `plan_id`, `paid_by` FK profiles, `created_by`, `description`, `category` enum, `amount > 0`, `currency` (= moneda del plan), `expense_date`, `split_type` (`equal`,`custom`), `deleted_at` (borrado lógico), `idempotency_key uuid` (único por `created_by`, evita doble envío).
- **expense_shares**: `expense_id` FK, `user_id` FK, `amount >= 0`. Único (`expense_id`,`user_id`).
- **Validación transaccional (D2)** — función `save_expense(...)` que inserta/actualiza gasto y repartos juntos:
  - pagador y todos los beneficiarios son miembros del plan (activos al crear el gasto);
  - plan no archivado;
  - suma de repartos = importe **exacta al céntimo**;
  - reparto igual: los céntimos sobrantes se asignan de forma determinista (orden por `user_id`);
  - además, un trigger de comprobación diferida al final de la transacción rechaza cualquier gasto cuya suma no cuadre, aunque se intente escribir por otra vía.
- **settlements (D3)**: `plan_id`, `from_user`, `to_user`, `amount > 0`, `status` enum (`proposed`,`confirmed`,`rejected`,`cancelled`), `proposed_by`, `confirmed_by`, `confirmed_at`, `note`, `idempotency_key`.
  - Ambos usuarios miembros del plan; `from_user <> to_user`.
  - Confirma **quien recibe** (`to_user`) o un owner/admin; quien propone no puede autoconfirmar salvo que sea el receptor.
  - Duplicados: `idempotency_key` única + no se permite más de una liquidación `proposed` abierta para el mismo par (`plan`,`from`,`to`) (índice único parcial).
  - Solo `confirmed` entra en balances.
- **Balances**: no se almacenan. Vista `plan_balances` = pagado − parte asignada + liquidaciones confirmadas enviadas − recibidas (excluye gastos borrados). Una función calcula "quién debe a quién" con el mínimo de transferencias. Invariante: la suma de todos los balances de un plan es 0.

### 4.4 Preparadas, sin crear ahora
- **subscriptions**: `user_id`, `tier` (`weekly_explorer`,`monthly_adventurer`,`annual_voyager`), `status`, `current_period_start/end`, `cancel_at_period_end`, ids externos. Solo escribible desde servidor.
- **billing_events**: `external_event_id` único (idempotencia de webhooks), `payload`, `processed_at`.
- **plan_limits**: `tier` (`free`,`premium`), `max_active_owned_plans`, `max_members_per_plan`, banderas de funciones.
- **activity_log**: `plan_id`, `actor_id`, `action`, `entity`, `entity_id`, `data jsonb` (rellenado por triggers).
- Futuro: `votes`, `itinerary_items`, `budgets` por categoría.

## 5. Archivado (D5)

- `archive_plan(plan_id)` (solo owner): pone `archived_at`; el plan pasa a solo lectura (sin nuevos gastos, invitaciones ni cambios); se revocan sus invitaciones pendientes; deja de contar en el límite gratuito.
- `unarchive_plan` (solo owner), sujeto al límite de planes activos.
- **Borrado físico** solo permitido si el plan no tiene gastos ni liquidaciones (planes vacíos o de prueba). Con historial financiero, la base de datos lo rechaza: las FKs financieras usan `ON DELETE RESTRICT`, no cascada.
- Al borrar una cuenta: el perfil se anonimiza; los gastos y liquidaciones se conservan.

## 6. Reglas de seguridad (RLS)

Funciones auxiliares seguras (sin recursión): `is_plan_member(plan_id)`, `plan_role(plan_id)`, `plan_is_writable(plan_id)` (no archivado), `plan_has_premium(plan_id)`.

| Tabla | Leer | Crear | Editar | Borrar |
|---|---|---|---|---|
| profiles | uno mismo y compañeros de plan | trigger al registrarse | uno mismo | no (anonimizar) |
| plans | miembros activos | autenticado (vía función que aplica límites y crea owner) | owner/admin, si no archivado | solo owner, solo sin historial financiero |
| plan_members | miembros del plan | solo vía `accept_invitation` / owner | owner/admin roles; uno mismo para salir | no (cambio de estado) |
| invitations | owner/admin | owner/admin, plan escribible | revocar: owner/admin | no |
| invitation_redemptions | owner/admin | solo vía función | no | no |
| places | autenticados | autenticados (manual) | creador | creador si no está en uso |
| favorite_places | uno mismo | uno mismo | uno mismo | uno mismo |
| plan_places | miembros | miembros, plan escribible | quien lo añadió u owner/admin | igual |
| expenses / expense_shares | miembros | solo vía `save_expense` | creador u owner/admin vía función | borrado lógico por creador u owner/admin |
| settlements | miembros | miembros implicados | confirmar/rechazar: receptor u owner/admin | cancelar: quien propuso, si sigue `proposed` |
| subscriptions / billing_events | uno mismo / nadie | solo servidor | solo servidor | no |

Además: permisos explícitos por tabla para usuarios autenticados, ninguno para anónimos; tokens nunca en texto plano; ninguna clave privada en el navegador.

## 7. Orden de implementación (D1)

Cada paso se aprueba y se verifica antes del siguiente.

1. **Base**: activar Lovable Cloud, login por email, perfiles, `plan_limits` con valores provisionales.
2. **CORE 1**: planes, miembros, invitaciones seguras, archivado + pantallas: mis planes, crear plan, detalle, invitar, unirse por enlace.
3. **CORE 2**: lugares manuales, favoritos y lugares del plan.
4. **CORE 3**: gastos con repartos, balances, liquidaciones propuestas/confirmadas.
5. Más tarde (con autorización expresa): suscripciones en modo prueba, patrocinio Premium real, Places, IA, votación, itinerario, PDF.

## 8. Riesgos y costes (D9)

- Fase actual: coste 0 €; Lovable Cloud dentro del uso incluido. Nada de Places, IA ni Stripe.
- Places: exige facturación y cobra al superar la franquicia → solo con caché y cuotas, tras aprobación.
- IA: coste por uso → cuotas y opción de desactivar.
- Stripe: modo prueba sin coste; comisiones solo en real.
- Riesgos técnicos: céntimos por redondeo, condiciones de carrera en invitaciones y límites, abuso del patrocinio Premium (mitigado por el límite de miembros y por ligarlo a una suscripción activa), coherencia de gastos tras bajas de usuarios.

## 9. Criterios de aceptación

**CORE 1**
- Un usuario crea un plan y queda como único owner.
- Un usuario gratuito no puede tener un segundo plan activo ni más de 4 participantes (pendiente D8).
- El token de invitación no aparece en la base de datos; un token caducado, revocado o agotado falla con el mismo mensaje genérico.
- Dos aceptaciones simultáneas de una invitación de 1 uso: solo una entra.
- Un no miembro no puede leer el plan ni sus datos.
- Un plan archivado es de solo lectura; un plan con gastos no se puede borrar.

**CORE 2**
- Un usuario crea un lugar manual, lo marca como favorito y lo añade a un plan; otros miembros lo ven, no miembros no.
- No se puede añadir dos veces el mismo lugar al mismo plan.

**CORE 3**
- Un gasto con un beneficiario ajeno al plan se rechaza.
- Un gasto cuyos repartos no suman exactamente el importe se rechaza.
- 10,00 € entre 3 personas se reparte 3,34 / 3,33 / 3,33 de forma estable.
- Reenviar el mismo gasto (mismo identificador de envío) no crea duplicados.
- Una liquidación propuesta no cambia balances; confirmada, sí. No se pueden abrir dos propuestas iguales a la vez.
- La suma de balances del plan es siempre 0.
- Caso del documento: 4 amigos, 2 gastos → balance correcto.

**Premium (para fases posteriores)**
- Los roles del plan no cambian al activar o perder Premium.
- Un miembro de un plan patrocinado usa funciones Premium solo dentro de ese plan.

## 10. Puntos abiertos para tu decisión
- Aprobación comercial del modelo gratuito (1 plan, 4 participantes).
- ¿Puede un admin (no solo el owner) confirmar liquidaciones ajenas? Propuesta actual: sí.
- Duración por defecto de las invitaciones (propuesta: 7 días, 1 uso).
- Autorización expresa para empezar el paso 1 del §7.
