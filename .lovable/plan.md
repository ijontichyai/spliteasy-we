# SplitEasy | Plan, Go & Share — Fase 01: Análisis y diseño de datos

He podido leer completo el Documento Maestro (PDF, 3+ páginas) y las instrucciones de la Fase 01. Esta fase es solo de diseño: no se crean tablas, no se toca código, no se activan integraciones.

## 1. Comprensión del Documento Maestro

- **Concepto**: una app que cubre todo el ciclo de un plan en grupo: proponer, descubrir lugares, votar, organizar itinerario y repartir gastos.
- **Público**: amigos, parejas, familias y grupos pequeños (más adelante, equipos de trabajo).
- **Funciones principales**: planes/grupos con invitación por enlace y roles; búsqueda de lugares, favoritos, sugerencias y votación; itinerario y presupuesto; gastos con reparto igual o personalizado, balances, liquidaciones manuales, historial y PDF.
- **Monetización**: 3 suscripciones con las mismas funciones Premium, pago íntegro por adelantado, renovación automática, acceso hasta fin del periodo si se cancela:
  - Weekly Explorer 1,49 € / 7 días
  - Monthly Adventurer 3,99 € / 1 mes
  - Annual Voyager 29,99 € / 12 meses
- **Arquitectura**: React web responsive (PWA después), base de datos PostgreSQL con RLS, autenticación, almacenamiento y lógica de servidor para claves privadas.
- **APIs externas**: Google Places/Maps, Stripe Checkout + Billing (modo test), proveedor de IA con control de consumo.
- **Autenticación**: registro/login, perfiles, aislamiento por grupo.
- **Seguridad**: RLS por pertenencia al plan, secretos solo en servidor, webhooks firmados e idempotentes, RGPD (consentimiento de ubicación, exportación y borrado).

## 2. Contradicciones y ambigüedades detectadas

1. **Plan gratuito no definido**: el documento describe solo Premium. ¿Qué puede hacer un usuario sin suscripción (p. ej. 1 plan activo, sin IA, sin PDF)? Necesario para definir límites.
2. **"Plan" tiene dos significados**: plan de grupo y plan de suscripción. Propongo nombrar las tablas `plans` (grupo) y `subscriptions` con `tier` (suscripción).
3. **Google Places requiere facturación activada**, lo que choca con "presupuesto 0 € / no activar servicios de pago". Propuesta: en CORE 2 usar primero lugares añadidos manualmente y una caché local; conectar Places más tarde con tu autorización y límites estrictos.
4. **"Edge Functions"**: este proyecto usa funciones de servidor integradas de Lovable Cloud, que cumplen el mismo papel (claves privadas, webhooks). No cambia el diseño.
5. **Moneda**: multidivisa es evolución posterior; propongo una moneda por plan (EUR por defecto).
6. **Liquidación**: confirmado que solo se registran pagos, no se mueve dinero.
7. **Tabla `budgets`**: puede ser un campo del plan más un desglose opcional por categoría; propongo empezar con el campo.
8. **Participantes sin cuenta** (alguien invitado que aún no se registra): el documento no lo aclara. Propongo que solo miembros registrados entren en gastos en el MVP.

## 3. Arquitectura propuesta

```text
Navegador (React + TS)
   |  datos propios, filtrados por RLS
   v
Lovable Cloud: Auth + PostgreSQL (RLS) + Storage + funciones de servidor
   |  claves privadas solo aquí
   v
Google Places/Maps (más tarde) · Stripe test (más tarde) · IA (más tarde)
```

Módulos: `auth/perfiles`, `plans` (CORE 1), `places` (CORE 2), `expenses` (CORE 3), y preparados para después `billing`, `itinerary`, `votes`, `activity`.

## 4. Tablas, campos y claves (CORE)

Todos los `id` son `uuid` PK con `gen_random_uuid()`; todas llevan `created_at timestamptz default now()`. Importes en `numeric(12,2)` (nunca float).

### Base (preparación auth)
- **profiles**: `id` PK = FK `auth.users.id` (cascade), `display_name text`, `avatar_url text`, `locale text`, `updated_at`. Creado por trigger al registrarse.

### CORE 1 — Planes y grupos
- **plans**: `owner_id` FK profiles, `name text`, `type` enum (cena, escapada, viaje, celebración, actividad, otro), `start_date date`, `end_date date`, `city text`, `area text`, `estimated_budget numeric`, `currency char(3) default 'EUR'`, `status` enum (borrador, votación, confirmado, en_curso, cerrado), `updated_at`.
- **plan_members**: `plan_id` FK plans (cascade), `user_id` FK profiles, `role` enum (owner, admin, member), `joined_at`. Único (`plan_id`, `user_id`).
- **invitations**: `plan_id` FK, `created_by` FK profiles, `token text unique`, `email text null`, `expires_at`, `max_uses int`, `uses int`, `revoked boolean`.

### CORE 2 — Lugares y favoritos
- **places**: catálogo compartido/caché. `provider` enum (manual, google), `provider_place_id text null`, `name`, `category`, `address`, `lat double`, `lng double`, `price_level smallint`, `rating numeric`, `last_synced_at`, `created_by` FK. Único (`provider`, `provider_place_id`).
- **favorite_places**: `user_id` FK profiles, `place_id` FK places, `note text`. Único (`user_id`, `place_id`).
- **plan_places**: lugares guardados/propuestos en un plan (base de `suggestions`). `plan_id` FK, `place_id` FK, `added_by` FK, `note`. Único (`plan_id`, `place_id`).

### CORE 3 — Gastos y balances
- **expenses**: `plan_id` FK, `paid_by` FK profiles, `created_by` FK, `description text`, `category` enum (comida, transporte, alojamiento, entradas, otros), `amount numeric(12,2) > 0`, `currency`, `expense_date date`, `split_type` enum (equal, custom), `updated_at`.
- **expense_shares**: `expense_id` FK (cascade), `user_id` FK profiles, `amount numeric(12,2)`. Único (`expense_id`, `user_id`). Regla: la suma de partes = importe del gasto (validado en servidor; el reparto igual asigna los céntimos sobrantes de forma determinista).
- **settlements**: `plan_id` FK, `from_user` FK, `to_user` FK, `amount > 0`, `settled_at`, `note`, `created_by`. `from_user <> to_user`.
- **Balances**: no se guardan; se calculan con una vista/función (`pagado − parte asignada ± liquidaciones`) y un algoritmo de "quién debe a quién" con mínimo número de transferencias.

### Preparadas para después (no se crean ahora)
`subscriptions` (user_id, tier, status, current_period_end, cancel_at_period_end, stripe ids), `billing_events` (stripe_event_id único para idempotencia), `suggestions`/`votes`, `itinerary_items`, `activity_log`.

## 5. Relaciones

```text
auth.users 1─1 profiles
profiles 1─N plans (owner)
plans 1─N plan_members N─1 profiles
plans 1─N invitations
profiles N─M places  (favorite_places)
plans    N─M places  (plan_places)
plans 1─N expenses 1─N expense_shares N─1 profiles
plans 1─N settlements (from_user, to_user -> profiles)
profiles 1─N subscriptions (futuro)
```

## 6. Reglas de seguridad (RLS)

- Funciones auxiliares seguras: `is_plan_member(plan_id)` y `plan_role(plan_id)`, para evitar recursión en políticas.
- **profiles**: cada usuario edita el suyo; lectura limitada a compañeros de algún plan.
- **plans**: leer solo miembros; crear cualquier usuario autenticado (se añade como owner automáticamente); editar owner/admin; borrar solo owner.
- **plan_members**: leer miembros del plan; gestionar owner/admin; un usuario puede salir del plan.
- **invitations**: gestionar owner/admin; aceptar invitación solo mediante función de servidor que valida token, caducidad y usos.
- **places**: lectura para autenticados; creación manual por autenticados; datos de Google solo escritos desde el servidor.
- **favorite_places**: solo el propio usuario.
- **plan_places, expenses, expense_shares, settlements**: solo miembros del plan; editar/borrar gasto el creador o owner/admin.
- Sin acceso anónimo a ninguna tabla. Permisos explícitos por tabla junto a RLS.
- Límites del plan gratuito (cuando se definan) validados en servidor, nunca solo en la interfaz.

## 7. Orden recomendado de implementación

1. Activar Lovable Cloud, autenticación email + perfiles (con tu autorización).
2. **CORE 1**: plans, plan_members, invitations + pantallas de crear plan, ver plan e invitar. Verificar.
3. **CORE 3**: expenses, expense_shares, settlements + cálculo de balances con pruebas de redondeo. Verificar con el caso de 4 amigos.
4. **CORE 2**: places (manual), favoritos y lugares del plan. Google Places solo después, con tu permiso.
5. Más adelante: votación, itinerario, historial/PDF, suscripciones Stripe en modo test.

(Propongo CORE 3 antes que CORE 2 porque no depende de APIs externas con coste; si prefieres el orden 1-2-3, se respeta.)

## 8. Riesgos técnicos y costes

- **Google Places**: exige facturación y cobra al superar la franquicia. Mitigación: caché, límites por usuario, empezar manual.
- **IA**: coste por uso. Mitigación: fase posterior, cuotas y desactivable.
- **Stripe**: comisiones reales solo en modo live; modo test sin coste.
- **Lovable Cloud**: incluye uso gratuito; el uso intenso podría generar consumo. Se vigilará.
- **Redondeo de gastos**: céntimos perdidos si no se reparte de forma determinista; se cubre con pruebas.
- **Invitaciones por enlace**: riesgo de filtración; tokens largos, caducidad, revocación.
- **RGPD**: borrado de cuenta debe conservar coherencia de gastos (anonimizar en vez de borrar filas).

## Pendiente de tu decisión antes de implementar
- Qué incluye el usuario gratuito.
- Orden de CORE 2 / CORE 3.
- Autorización explícita para empezar el paso 1.
