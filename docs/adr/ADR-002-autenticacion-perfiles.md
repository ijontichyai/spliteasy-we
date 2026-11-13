# ADR-002: Autenticación, perfiles e internacionalización

- **Estado:** Aceptado — 13 nov 2026
- **Ámbito:** Fase 02. Detalle en [phase-02.md](../architecture/phase-02.md).

## Contexto
SplitEasy necesita identidad de usuario segura antes de CORE 1, con un presupuesto de 0 € y una interfaz bilingüe.

## Decisión
1. Solo email y contraseña, con confirmación obligatoria del email y protección de contraseñas filtradas. Sin proveedores sociales en esta fase.
2. Los perfiles se crean con un trigger en el registro (security definer), nunca desde el navegador. Los usuarios no tienen permiso de INSERT ni DELETE sobre `profiles`.
3. RLS: cada usuario solo lee y edita su propio perfil. Sin acceso anónimo a ninguna tabla.
4. Las columnas protegidas (`id`, `created_at`, `deleted_at`) se bloquean con un trigger. La baja de cuenta se hará anonimizando (`deleted_at`).
5. Los límites gratuitos están en `plan_limits`, solo lectura para usuarios, y se podrán cambiar sin modificar la estructura de la base de datos.
6. Rutas privadas bajo un layout `_authenticated` que solo se muestra en el navegador. La sesión vive en el navegador y el servidor no puede leerla.
7. i18n propia y ligera (diccionarios tipados, español por defecto, inglés), sin librería externa. Cada idioma debe tener las mismas claves, y un test lo comprueba.

## Alternativas descartadas
- Alta automática sin confirmar el email: menos segura (rechazada por el usuario).
- Librería de i18n externa: innecesaria para 2 idiomas. Se puede adoptar más adelante sin cambiar las claves.
- Crear el perfil desde el cliente tras el registro: podría dejar perfiles sin crear o permitir suplantaciones.

## Consecuencias
- El registro no inicia sesión hasta confirmar el email, y la interfaz lo explica.
- Probar el registro de extremo a extremo requiere un buzón real.
