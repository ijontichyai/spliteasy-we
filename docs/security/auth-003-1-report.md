# AUTH-003 — Protected View y panel admin (14 nov 2026)

## Estado
Implementación y pruebas funcionales completadas. Revisión automática profunda pendiente: no se presenta como PASS. Sin publicar.

## Fase 1: antes de ampliar
| Suite | Resultado |
|---|---|
| AUTH-003.1 | PASS 49/49 |
| V3 externo C intenta revocar sesión de B | PASS: FORBIDDEN y auditoría; sesión intacta |
| AUTH-002.2 | PASS 29/29 |
| AUTH-002.1b | PASS 8 escenarios / 36 comprobaciones |

Se reutilizaron los scripts anteriores con clientes públicos y sesiones reales A/B/C/D. El cliente privilegiado solo preparó/inspeccionó datos QA, simuló caducidad y comprobó inmutabilidad. No fue el cliente bajo prueba para permisos. Los mismos tres scripts se repitieron después de implementar, con idénticos resultados.

## Entrega
- Perfil → Solicitudes de soporte → pedir ayuda, autorizar/revocar y ver avisos.
- Administrador → panel → usuarios con solicitud → aceptar → iniciar/ver como usuario.
- Solo identificador opaco y proveedor en el panel: no emails, nombres, contraseñas ni temas del usuario.
- Administrador siempre autenticado como sí mismo. No minting de tokens de usuarios ni cambio de auth.uid.
- Organizador aprueba/rechaza plan compartido; quien atiende la sesión no puede aprobar su propio acceso.
- Vista de cuenta: estructura y recuentos. Vista de plan: PlanView existente, nombres y lugares sintéticos, sin importes reales, sin controles de escritura.
- Banner permanente, contador, salida destacada; consultas cada segundo con validación de rol, alcance, caducidad y revocación. Datos dejan de mostrarse al recibir rechazo.
- Nuevo dispatcher SECURITY DEFINER `support_portal` ejecuta las funciones existentes y audita acceso/denegación. No nuevas políticas sobre datos privados ni nuevo proveedor de login.

## Verificación nueva
| Prueba | Resultado / evidencia |
|---|---|
| B/C/D llaman admin, accept, start, view, exit sin admin | PASS 15 comprobaciones: FORBIDDEN y exactamente +1 entrada de auditoría |
| A abre panel | PASS |
| Directorio sin emails/nombres/temas | PASS |
| Proveedor email disponible sin identidad privada | PASS |
| B solo recibe sus solicitudes | PASS |
| Admin sin grant consulta vista | PASS: NOT_FOUND |
| Visitante sin sesión | PASS: sin EXECUTE |
| Total dispatcher | PASS 21/21 |
| Caducidad exacta de 15 min, revocación inmediata, fin definitivo, modo real rechazado | PASS 4 tests unitarios |
| App completa: i18n, dinero, navegación, tema, soporte | PASS 19/19 |
| Navegador C y D sin admin abren /admin | PASS: acceso denegado, no panel |
| B solicita ayuda y consiente plan; D admin temporal acepta | PASS |
| Inicio bloqueado antes de aprobación A organizador | PASS |
| A aprueba; D inicia con código de B | PASS: Plan 1, participantes ocultos, importes Oculto, indicador y salida |
| B revoca; D deja de ver Plan 1 | PASS en la siguiente consulta |
| Salir de Ver como usuario | PASS: indicador desaparece y vuelve al panel |
| Móvil 603×552 y escritorio 1280×1800 | PASS: sin desbordamiento horizontal |
| CORE y autenticación email/password | PASS por regresiones y navegador con sesiones reales |
| Otros métodos de login | NOT TESTED: ninguno adicional implementado; no habilitados |
| Escaneo rápido | Solo INFO: límites del producto visibles a autenticados, intencionado |
| Escaneo profundo | PENDIENTE; analiza versión guardada, no acredita los cambios de este turno |

## Datos QA y límites
- A conserva admin temporal. D recibió admin durante la prueba del flujo y quedó revocado; el soporte temporal de las regresiones también se revocó.
- Conservadas todas las cuentas; nuevas solicitudes/grants/avisos y registros inmutables de auditoría. Se cerraron solicitudes QA antiguas para respetar el máximo de tres abiertas, sin borrar cuentas ni datos reales.
- Directorio limitado a usuarios que pidieron soporte: no búsqueda indiscriminada de cuentas.
- El código se comparte manualmente con el administrador asignado; no se almacena en navegador ni se reenvía automáticamente.
- No acceso real ni escritura de datos del usuario; el resumen protegido no representa importes ni detalles financieros reales.
- Riesgos anteriores R3–R6, falta de salir del plan y crecimiento de auditoría siguen fuera de alcance.
- El PDF Maestro original no se alteró: arquitectura y este informe son el addendum de implementación.
- Pruebas históricas en `/tmp/qa`, comprobaciones de portal/navegador en `/tmp/browser/support`; resultados sin secretos. Los temporales no son artefactos persistentes; las reglas críticas se conservan en `src/test/support.test.ts`.