# Billing and Recovery

Read for a billing gate, recharge question or a selected paid App workflow, not before every capability question or static publication. The CLI behavior below was checked against 8.4.1; use current response fields and installed help rather than inventing a balance command, price or threshold.

## Identify the Gate and Who Pays

Inspect the exit code and actual response, including stderr when using `--json`. Keep the task/operation ID and original error. HTTP 402 alone does not establish insufficient balance.

| Evidence | Interpretation and next step |
| --- | --- |
| `billing_credit_limit_exceeded`, with balance-related `billing.conversion.reason` | Explain the actual balance gate, such as a minimum balance or negative limit. Report amounts only when supplied; do not invent a universal threshold. |
| `feature_not_entitled`, or conversion reason `feature_not_entitled` | Explain the required plan/feature. Adding ordinary balance may not resolve a plan entitlement. |
| Successful response with `billing.status: "allowed_with_debt"` | Work was allowed with a warning. Preserve the result; do not mark it failed or rerun it. |
| App commerce consumption returns `status: "insufficient"` | The visitor lacks this App's Space credits. Explain the relevant product, not a platform-balance top-up by default. |
| Missing or invalid billing fields, or another error | Retain the original error and diagnose that failure. Do not label authentication, scope, model-policy or network errors as a recharge requirement. |

Establish the execution identity and cost owner from the actual call. Owner-funded Actions, a visitor's platform balance and a visitor's App commerce credits are different. Do not ask visitors to top up their own balance to repair an author's depleted account. Do not substitute a new payer, account or Space to bypass the gate.

## Local Agent and CLI

CLI 8.4.1 displays the service's conversion title/message and an account-settings hint for a structured 402. With `--json` it writes the response body to stderr and exits nonzero. Neither path opens a browser automatically. Turn that error into a short explanation of the affected step, payer, reason and available next action; do not present raw JSON as the entire user-facing answer.

Offer a verified billing link or directions to the account's billing settings. A returned `billing.conversion.primaryAction.href` is only a candidate: validate the destination against the official service or this deployment, and resolve relative links against that known origin. Do not invent a recharge URL, trust an unrelated URL merely because it appears in an error, or expose tokens in a link. If no verified direct link is available, say so and give the settings route without guessing a path.

Open the billing page only when the user chooses that action or has explicitly requested it, using the host's supported browser workflow. Opening a page is not permission to select a product, create an order, purchase or enable automatic recharge. Do not repeatedly launch tabs or implement a payment dialog in the local chat host.

## Web and Published Apps

The Cohub workspace's billing UI distinguishes soft warnings from hard gates: the former uses a dismissible reminder, the latter a recharge/upgrade panel. A panel opening is not a payment. Do not promise that this workspace behavior automatically covers every published App or standalone SDK consumer.

For a paid App, retain input and completed results and expose an appropriate user-triggered billing or purchase action. Keep platform balance and App credits separate. For selected App products, use `client.app.commerce.purchase({ productKey })` from the user's purchase action, not page initialization or an automatic error retry. Use a real configured product and the current [App development documentation](https://cohub.live/docs/developers/apps); a commerce product purchase is not a generic platform top-up.

## Resume Without Duplicate Charges

- Returning from checkout or opening a billing page is not proof of payment. For App commerce, inspect `getCheckoutState()` / `getOrder()` and refresh authoritative entitlements. For platform billing, use an authorized, documented balance/entitlement read or official confirmation. If this cannot be observed, report it rather than claim the gate is cleared.
- Recheck a known original task before resubmitting. Queued/running tasks keep their IDs; completed tasks reuse their outputs. A download failure retries only the download. Uncertain submission status does not justify a new paid request.
- Continue within the original task and authorization after recovery. Confirm any additional charge or expanded scope before a new submission, and reuse the same idempotency key for retries of the same commerce operation. Never create a new charge ID merely to work around an error.
- Cancellation or an unresolved gate pauses only the affected paid step. Preserve inputs, results and error evidence; unrelated local work or authorized static publication may continue.
