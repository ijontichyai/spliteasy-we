# BILLING-001 — Premium subscriptions (test mode only)

Status: implemented in TEST mode. Live payments NOT activated. Not published.

## Built
- Three plans, auto-renewing, full price charged upfront each period: Weekly Explorer 1,49 € / week, Monthly Adventurer 3,99 € / month, Annual Voyager 29,99 € / year (SaaS tax code).
- /premium: status (plan, renewal date or "Premium until"), responsive plan carousel, embedded checkout, "Cancel payment" → /checkout/cancel, success page /checkout/return, "Manage or cancel renewal" (hosted billing portal, new tab).
- Subscription records written ONLY by the signed payment webhook (/api/public/payments/webhook, HMAC-SHA256 + 5 min tolerance). Users get SELECT on their own rows only; no INSERT/UPDATE/DELETE grants; anon nothing.
- Premium = status active/trialing/past_due/canceled AND current_period_end > now (kept until paid period ends after cancelling renewal). `has_active_subscription(env)` checks only the caller.
- Checkout identity comes from the server-side session, never from the browser; a second active subscription is refused.
- No changes to admin roles, AUTH-002 or AUTH-003.

## Results
| Test | Result |
|---|---|
| Rule tests (prices, grace period, unpaid never Premium, only 3 plans) | PASS 4/4 (23/23 app tests) |
| User inserts/updates own subscription row | PASS — denied (42501) |
| Anonymous read of subscriptions | PASS — denied |
| Forged payment notice without / with wrong signature | PASS — 400, no row created |
| has_active_subscription for non-paying user | PASS — false |
| Checkout opens in test mode for QA B | PASS |
| Cancelled checkout page | PASS (navigation) |
| Successful test payment end-to-end | NOT TESTED — automated card submission did not complete twice; manual 4242 test pending |
| Failed payment (4000 0000 0000 0002) | NOT TESTED |
| Premium activation after payment | NOT TESTED (depends on manual payment) |
| Cancel renewal via portal | NOT TESTED |

## Open issue
Checkout adds VAT on top (1,49 € showed as 1,80 € for a Belgian address). EU consumer prices are normally VAT-inclusive; switching prices to tax-inclusive needs a decision.

## BILLING-001.1 — Precios finales sin recargos (2026-11-14)

Decisión aprobada (Opción A): sin gestión integral de cumplimiento de Stripe (+3,5 %) y sin cálculo automático de impuestos (+0,5 %). Solo Stripe Sandbox.

| Prueba | Resultado |
|---|---|
| Precios Sandbox existentes (`premium_weekly` 149, `premium_monthly` 399, `premium_annual` 2999 EUR, tax_behavior unspecified) | Conservados — no requieren sustitución; Price IDs sin cambios |
| Sesión de pago creada con cliente de Bélgica: total 1,49 / 3,99 / 29,99 €, impuesto 0, gestión integral y cálculo automático desactivados | PASS |
| Prueba automática: el pago no activa gestión integral ni impuestos automáticos | PASS |
| Pruebas de la app (23 previas + 1 nueva) | 24/24 PASS |
| Visualización del formulario con dirección española en navegador | NOT TESTED (sin impuestos automáticos la dirección no cambia el total) |
| Pago completo 4242 / tarjeta rechazada / cancelación | NOT TESTED (pendiente prueba manual) |

### Obligaciones fiscales pendientes antes del lanzamiento comercial
- Alta censal del vendedor en España (modelo 036/037) y epígrafe de servicios digitales.
- IVA del país del consumidor en servicios electrónicos B2C UE: registro en ventanilla única OSS (o IVA español si ventas UE < 10 000 €/año), declaraciones trimestrales (modelo 369).
- Precios publicados como importes finales con la mención "IVA incluido"; el IVA se detrae del precio, reduciendo el ingreso neto según el país.
- Conservar dos pruebas de localización del cliente y emitir factura/recibo conforme.
- Decidir antes de producción si se automatiza el cálculo/declaración de impuestos (requiere aprobación expresa por su coste).
- Precios en Stripe: valorar marcar tax_behavior "inclusive" si en el futuro se activa cálculo automático.

## BILLING-001.2 — Stripe return destinations (2026-11-14)

- Finding lov_finding_ab277a23d6fa6e54 fixed: `createCheckoutSession` and `createPortalSession` ignore any client-sent `returnUrl`. The server takes the request Origin only if it matches the SplitEasy allowlist (`safeOrigin` in src/lib/billing.ts); otherwise it uses https://spliteasy-we.lovable.app. Checkout → `/checkout/return?session_id=…`, portal → `/premium`.
- Tests: 26/26 pass (24 previous + 2 new: checkout and portal return destinations, incl. look-alike domain).
- Sandbox check (test account B): /premium loads the subscription state; choosing a plan creates the checkout session (200) and Stripe's embedded payment form loads.
- Premium activation: webhook and `isPremiumActive` unchanged; covered by the existing unit tests.
- NOT TESTED: completing a 4242 payment, a declined card, opening the subscription management page (needs an account with an active test subscription).
- Quick security scan: only the intentional plan_limits info note. Deep scan re-run (2026-11-14 18:37 UTC): no new findings; only the intentional plan_limits info note remains.
- No publishing, Stripe Live remains off.
