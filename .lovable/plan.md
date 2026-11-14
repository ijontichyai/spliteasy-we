# RELEASE-001 — Auditoría pre-lanzamiento Beta (solo diagnóstico)

## Estado verificado hoy
- Compilación: sin errores registrados.
- Pruebas de la app: 24/24 PASS.
- Revisión profunda AUTH-003: 0 hallazgos; pero desactualizada (anterior a pantallas de soporte/admin y Premium).
- Base de datos: solo aviso informativo (límites del plan legibles por usuarios registrados, intencionado).
- Dependencias: 12 avisos (6 altos, 6 moderados), heredados de librerías del framework (zod, js-yaml, seroval, source-map-js).
- Stripe: solo Sandbox; precios finales 1,49/3,99/29,99 € verificados en sesión de prueba.
- Existe: registro/login/recuperación, planes, invitaciones, lugares, gastos, balances, liquidaciones, soporte/admin, Premium, demo, Descubre, tema, ES/EN, navegación móvil.

## P0 — bloquean la Beta
1. Pago completo no verificado (4242, tarjeta rechazada, cancelar renovación, Premium activándose por webhook). Riesgo: Premium no se activa. Alcance: prueba manual tuya + verificación mía de BD. Bajo.
2. Revisión profunda desactualizada: repetirla sobre el código actual. Bajo (créditos).
3. Administrador temporal (cuenta QA A) y datos QA: sustituir por la cuenta admin real antes de usuarios reales. Bajo.
4. Fiscalidad: alta 036/037, OSS, mención "IVA incluido" — necesario solo si se cobra de verdad; la Beta queda en Sandbox. Requisito tuyo, no técnico.

## P1 — importantes
1. Actualizar dependencias vulnerables (framework/zod) y repetir pruebas. Riesgo medio: posibles cambios de API.
2. No existe "salir del plan" (R-leave); R3–R6 pendientes (validación de funciones, lugares del creador, enumeración en recuperación, votos).
3. Recorrido end-to-end móvil/escritorio de registro → plan → invitación → gasto → liquidación no repetido tras Premium. Alcance: un script de navegador.
4. Vista protegida muestra "Plan archivado" y balances "a cero" en lugar de "Oculto". Cosmético, bajo.
5. Configuración de publicación: revisar visibilidad, títulos/metadatos por página, URLs permitidas de la clave de Google para el dominio publicado (si no, Descubre falla en producción).

## P2 — mejoras
- Crecimiento del registro de auditoría sin retención.
- Directorio admin repite usuarios por solicitud.
- Pendientes de roadmap: catálogo real Descubre, favoritos/place_id, vista de plan Feature 004.
- Sincronización GitHub no verificable desde aquí.

## Plan mínimo propuesto (tras tu aprobación)
1. Recorrido E2E automatizado A/B/C/D móvil+escritorio (sin cambios de código).
2. Tu prueba manual de pago + verificación.
3. Actualizar dependencias y repetir 24 pruebas + 49/29/8 de seguridad.
4. Corregir textos de vista protegida.
5. Revisión de publicación (metadatos, clave Google, visibilidad) sin publicar.
6. Repetir revisión profunda; informe docs/release/release-001-audit.md y CHANGELOG.
Riesgos: actualización del framework (medio); el resto bajo. Sin pagos reales, sin publicar, sin nuevas funciones.
