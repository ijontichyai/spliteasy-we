# SplitEasy — Cierre de Fase 01 y plan de Fase 02

Al aprobar este plan solo se actualiza la documentación (Parte A). La Fase 02 (Parte B) queda descrita y **no se ejecuta** hasta que des tu autorización expresa en un mensaje aparte.

## Parte A — Documentación de cierre de Fase 01 (lo único que se hará al aprobar)

### A1. Actualizar `docs/architecture/phase-01.md`
- Estado: "Fase 01 aprobada y cerrada a nivel de diseño (13 nov 2026)".
- §3 Modelo gratuito: pasa de "provisional pendiente" a **aprobado provisionalmente para el MVP**: 1 plan activo propio, 4 participantes por plan gratuito, participación libre en planes de otros.
- §4.3 y §6 Liquidaciones: **solo el receptor (`to_user`) confirma o rechaza**. Owner y admin solo ven el estado. Se quita "u owner/admin" de la tabla RLS y de las reglas.
- §4.1 Invitaciones: confirmado 7 días, 1 uso, revocación por owner/admin.
- §9: nuevo criterio "un admin u owner que no es receptor no puede confirmar una liquidación".
- §10: puntos abiertos cerrados con su decisión; enlace a ADR-001.

### A2. Crear `docs/adr/ADR-001-arquitectura-base.md`
Formato: Contexto, Decisión, Alternativas descartadas, Consecuencias, Estado (Aceptado, 13 nov 2026). Decisiones registradas:
1. Lovable Cloud (PostgreSQL + Auth + RLS) como backend; lógica de servidor con funciones del propio proyecto.
2. Operaciones de varias filas (gasto + repartos, aceptar invitación, liquidaciones, archivado) en funciones transaccionales de base de datos.
3. Balances calculados, no almacenados; importes `numeric(12,2)`; reparto determinista de céntimos.
4. Liquidaciones en dos estados; solo confirma el receptor.
5. Invitaciones con token hasheado, 7 días, 1 uso, revocables, consumo atómico.
6. Archivado en lugar de borrado con historial financiero.
7. Roles del plan separados de derechos Premium; patrocinio de plan por owner Premium.
8. Modelo gratuito 1 plan / 4 participantes, configurable en tabla de límites.
9. Orden CORE 1 → 2 → 3; sin servicios con coste (Places, IA, Stripe) hasta autorización.

También guardaré en la memoria del proyecto la regla de liquidaciones (solo el receptor confirma).

---

## Parte B — Plan de Fase 02: infraestructura, autenticación y perfiles (pendiente de autorización)

### B1. Alcance
- Activar Lovable Cloud.
- Inicio de sesión por email y contraseña, con confirmación de email.
- Recuperación de contraseña (pantalla "olvidé mi contraseña" y página para fijar una nueva).
- Perfiles: nombre visible, avatar opcional (URL o subida más adelante), idioma.
- Tabla de límites (`plan_limits`) con valores gratuitos aprobados.
- Pantallas mínimas con identidad visual SplitEasy: portada, acceso/registro, perfil, y una zona privada vacía ("Mis planes" llegará en Fase 03 / CORE 1).
- Fuera de alcance: Google/Apple, planes, invitaciones, lugares, gastos, Stripe, Places, IA.

### B2. Operaciones previstas (en orden)
1. Activar Lovable Cloud (crea la base de datos y la autenticación).
2. Activar acceso por email y contraseña; mantener confirmación de email activa.
3. Migración 1 — base:
   - `profiles` (id = usuario, display_name, avatar_url, locale, deleted_at, fechas) con permisos explícitos solo para usuarios autenticados y RLS: leer y editar el propio perfil. (La lectura de compañeros de plan se añade en Fase 03, cuando exista `plan_members`.)
   - Trigger que crea el perfil al registrarse (nombre tomado del formulario o del email).
   - Trigger de `updated_at`.
   - `plan_limits` con filas `free` (1 plan, 4 participantes) y `premium` (sin límite); solo lectura para autenticados, sin escritura desde el navegador.
4. Código de la app:
   - Escucha de cambios de sesión en la raíz de la app.
   - Zona privada protegida (redirige a acceso si no hay sesión).
   - Páginas: `/` portada, `/auth` acceso/registro, `/reset-password`, `/profile` (privada), `/app` (privada, vacía).
   - Títulos y descripciones propios en cada página.
5. Pruebas automáticas de las reglas de esta fase y comprobación en el navegador con un usuario real.
6. Actualizar `docs/architecture/phase-02.md` y añadir ADR-002 (autenticación y perfiles).

### B3. Dependencias
- Requiere tu autorización para activar Lovable Cloud.
- Fase 01 cerrada (sí).
- El envío de emails de confirmación usa el remitente por defecto de Lovable Cloud (sin dominio propio; se podrá configurar después).
- Ninguna dependencia externa de pago.

### B4. Riesgos
- Emails de confirmación en spam o con límite de envío del remitente por defecto → pruebas con pocas cuentas; dominio propio más adelante.
- Registro que no inicia sesión hasta confirmar el email → pantalla clara de "revisa tu correo".
- Perfiles huérfanos si falla el trigger → prueba de registro de extremo a extremo.
- Exposición de datos personales → RLS estricta, sin acceso anónimo, sin emails visibles a otros usuarios.
- RGPD: el borrado de cuenta se diseña como anonimización (implementación en fase posterior).

### B5. Costes
- 0 €: Lovable Cloud dentro del uso gratuito incluido; sin Places, IA ni Stripe.
- El trabajo en el editor consume créditos de Lovable como cualquier otra petición.
- No se publica la app.

### B6. Criterios de aceptación
- Un usuario se registra, recibe el email, confirma y entra.
- Al registrarse se crea exactamente un perfil con su nombre.
- Un usuario puede editar su nombre e idioma; no puede leer ni modificar el perfil de otro.
- Sin sesión, `/app` y `/profile` llevan a la pantalla de acceso.
- Cerrar sesión devuelve a la portada; recargar la página mantiene la sesión.
- "Olvidé mi contraseña" envía el email y `/reset-password` permite fijar una nueva.
- `plan_limits` devuelve free = 1 plan / 4 participantes; un usuario no puede modificarla.
- Un visitante anónimo no puede leer `profiles` ni `plan_limits`.
- Ninguna clave privada aparece en el código del navegador.

### B7. Preguntas para cuando autorices la Fase 02
- ¿Idioma de la interfaz: solo español al inicio, o español e inglés?
- ¿Mantener la confirmación por email (recomendado por seguridad) o permitir entrar sin confirmar durante las pruebas?
