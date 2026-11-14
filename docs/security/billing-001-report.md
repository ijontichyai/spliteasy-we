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
