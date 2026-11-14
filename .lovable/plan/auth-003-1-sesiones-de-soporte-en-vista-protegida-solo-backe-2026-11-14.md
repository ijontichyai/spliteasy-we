# AUTH-003.1 — Sesiones de soporte en Vista protegida (solo backend)

Alcance exacto de la primera etapa. Solo base de datos y pruebas; sin pantallas, sin datos reales, sin cambios de login ni de las políticas RLS existentes, sin publicar.

## Qué incluye
1. **Solicitud de ayuda** por el usuario (tema breve, máx. 3 abiertas).
2. **Aceptación** por personal de soporte/admin (queda asignado).
3. **Autorización del usuario**, eligiendo qué compartir:
   - "Mi cuenta": estado general (nº de planes, límites Free, idioma). Basta su consentimiento.
   - "Un plan compartido": requiere además la **aprobación del organizador** de ese plan (si el usuario no es el organizador). Sin esa aprobación la sesión no puede empezar.
4. **Sesión de 15 minutos**, de un solo uso, solo lectura, con código de activación de un solo uso.
5. **Vista protegida únicamente**: se devuelve la estructura con todo dato identificable sustituido:
   - nombres de planes y lugares → "Plan 1", "Lugar 2"
   - personas → "Participante 1..n" (el propio usuario como "Tú")
   - importes → ocultos; solo indicadores (p. ej. "hay 3 gastos", "saldos cuadran: sí/no")
   - fechas → solo relativas ("en 2 semanas"); ciudades, direcciones, notas, emails → nunca
6. **Revocación inmediata** por el usuario o el organizador que aprobó; fin por el personal; caducidad automática.
7. **Avisos a los participantes** del plan compartido (aviso en la app, sin datos sensibles: "Se ha abierto una sesión de soporte en un plan en el que participas", con hora de inicio/fin). Solo se guardan; mostrarlos llega en AUTH-003.2.
8. **Auditoría completa** en el registro existente: solicitud, aceptación, autorizaciones, aprobación del organizador, inicio, cada consulta, fin/caducidad/revocación y todo intento denegado (sin deshacerse).

## Qué NO incluye
- Modo de datos reales (no existe ni como opción).
- Ninguna escritura sobre datos del usuario.
- Pantallas de usuario o de soporte (AUTH-003.2 / 003.3).
- Cambios en login, roles existentes, cuentas de prueba o políticas actuales.

## Pruebas (cuentas A admin, B participante, C externo, D soporte)
- Sin autorización: D/A consultan sin sesión → denegado y registrado.
- B autoriza "Mi cuenta" a D → D ve solo datos ocultos (verificado que no aparece ningún nombre, importe, ciudad ni email real).
- B autoriza el plan compartido sin aprobación de A → la sesión no arranca; A aprueba → arranca; los participantes reciben aviso sin datos sensibles.
- C intenta autorizar un plan ajeno → denegado.
- Fuera de alcance: D pide otro plan → denegado.
- Caducidad (forzada desde el backend en un registro de prueba) → denegado y no reutilizable.
- Revocación por B y por A a mitad de sesión → siguiente consulta denegada.
- Reutilizar el código / otro miembro del personal usa el código → denegado.
- Escalada: D se autoriza a sí mismo, escribe directamente en las tablas, o pierde el rol a mitad → denegado.
- Aislamiento: durante la sesión D sigue sin ver nada del plan por las vías normales.
- Integridad: una entrada por evento; el registro no se puede editar ni borrar.
- Regresión: AUTH-002.1b (8/8) y AUTH-002.2 (29/29).

Entregables: informe `docs/security/auth-003-1-report.md`, actualización del documento de diseño con estas decisiones, CHANGELOG. Al terminar, me detengo hasta tu autorización para AUTH-003.2.

## Detalles técnicos
- Migración aditiva: enums `support_status`, `support_target` (`account`, `plan`); tablas `support_requests`, `support_grants` (staff_id, user_id, target, plan_id, organizer_approved_by/at, nonce_hash, used, started_at, expires_at CHECK ≤ +15 min, ended_at, revoked_at/by, end_reason), `support_notifications` (user_id, grant_id, kind, created_at, read_at).
- RLS: lectura propia (usuario, staff asignado, organizador del plan afectado para aprobación); notificaciones solo del destinatario. Sin INSERT/UPDATE/DELETE para nadie; GRANT SELECT a authenticated, ALL a service_role, nada a anon.
- Funciones SECURITY DEFINER que nunca lanzan error al denegar (registran y devuelven `{ok:false,error}`): `support_request_create`, `support_request_accept`, `support_grant_authorize`, `support_grant_approve_plan` (organizador), `support_session_start`, `support_view_account`, `support_view_plan`, `support_session_end`, `support_grant_revoke`; `assert_support_grant` interna sin EXECUTE.
- La redacción se hace en el servidor dentro de las funciones de vista; nunca se devuelven columnas reales identificables.
- Sin tareas programadas: caducidad comprobada en cada llamada. Coste 0 €.
