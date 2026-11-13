# Fase 02 — Infraestructura, autenticación y perfiles

**Estado:** implementada el 13 nov 2026. Falta la prueba de extremo a extremo con un buzón real (ver §6).
Referencias: [phase-01.md](phase-01.md), [ADR-001](../adr/ADR-001-arquitectura-base.md), [ADR-002](../adr/ADR-002-autenticacion-perfiles.md).

## 1. Alcance entregado
- Lovable Cloud activado solo para autenticación, perfiles y límites.
- Registro, inicio y cierre de sesión, y recuperación de contraseña por email. La confirmación del email es obligatoria.
- Protección de contraseñas filtradas activa: rechaza contraseñas débiles o que aparecen en filtraciones conocidas.
- Perfiles (nombre visible, avatar opcional por URL https, idioma).
- `plan_limits`: free = 1 plan activo propio / 4 participantes; premium = sin límite.
- Interfaz en español (predeterminado) e inglés, adaptada a móvil.
- Fuera de alcance: Google/Apple, planes, invitaciones, lugares, gastos, Stripe, Places, IA.

## 2. Pantallas
| Ruta | Acceso | Contenido |
|---|---|---|
| `/` | pública | Portada Plan · Go · Share |
| `/auth` | pública | Entrar / Crear cuenta / Recuperar contraseña |
| `/reset-password` | pública | Nueva contraseña (enlace de recuperación) |
| `/app` | privada | "Mis planes" (vacío hasta CORE 1) y límites gratuitos |
| `/profile` | privada | Edición de nombre, avatar e idioma |

Las rutas privadas están bajo `src/routes/_authenticated/`, se muestran solo en el navegador (sin renderizado en servidor) y redirigen a `/auth` si no hay sesión.

## 3. Base de datos
Migraciones: `drizzle/migrations/0000_phase02_profiles_limits.sql`, `0001_phase02_revoke_anon.sql`.

- **profiles**: `id` (PK, FK `auth.users`, cascade), `display_name` (1–80), `avatar_url` (https o nulo), `locale` (`es`/`en`, por defecto `es`), `deleted_at`, `created_at`, `updated_at`.
  - Se crea con el trigger `on_auth_user_created` → `handle_new_user()` (security definer, solo ejecutable por el sistema), usando el nombre y el idioma enviados en el registro.
  - El trigger `profiles_protect` impide que un usuario cambie `id`, `created_at` o `deleted_at`.
- **plan_limits**: `tier` (PK), `max_active_owned_plans`, `max_members_per_plan` (nulo = sin límite), `features jsonb`.

## 4. Permisos y RLS
| Tabla | anon | authenticated |
|---|---|---|
| profiles | sin permisos | SELECT/UPDATE solo de la fila propia (`auth.uid() = id`); sin INSERT ni DELETE |
| plan_limits | sin permisos | solo SELECT |

La lectura de perfiles de compañeros de plan se añadirá en CORE 1, cuando exista `plan_members`.

## 5. Internacionalización
- `src/lib/i18n/dictionaries.ts`: `LOCALES`, `DEFAULT_LOCALE = "es"` y un diccionario por idioma, con las mismas claves.
- Para añadir un idioma: añadir el código a `LOCALES`, crear su diccionario y ampliar la restricción `locale` de `profiles`.
- La preferencia se guarda en el navegador y en el perfil.

## 6. Verificación (13 nov 2026)
| Criterio | Resultado |
|---|---|
| Al registrarse se crea exactamente un perfil con nombre e idioma | OK (prueba SQL con usuarios temporales, revertida) |
| Un usuario solo ve su perfil (ve 1 fila de 2) | OK |
| Un usuario no puede modificar el perfil de otro (0 filas) | OK |
| Un usuario puede editar su propio perfil | OK |
| Un usuario no puede crear perfiles ni modificar `plan_limits` | OK |
| `plan_limits` free = 1 / 4 | OK |
| Un visitante anónimo no puede leer `profiles` ni `plan_limits` | OK (API pública devuelve vacío; permisos de anon revocados) |
| Sin sesión, `/profile` y `/app` llevan a `/auth` | OK (navegador) |
| Cambio de idioma ES/EN | OK (navegador, móvil 390 px) |
| Contraseña débil o filtrada rechazada con un mensaje traducido | OK |
| Ninguna clave privada en el código del navegador | OK |
| Tests automáticos (`bunx vitest run`) | OK: 5 tests |
| Registro → email → confirmación → entrada | **Pendiente**: el servicio de email rechaza dominios de prueba; hay que probarlo con un buzón real |
| Recuperación de contraseña de extremo a extremo | **Pendiente**: necesita un buzón real |
| Cerrar sesión y mantener la sesión al recargar | **Pendiente**: necesita una cuenta confirmada |

## 7. Costes
0 € adicionales. No se han activado servicios de pago. Los emails de acceso usan el remitente por defecto de Lovable Cloud.
