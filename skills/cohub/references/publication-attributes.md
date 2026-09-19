# Publication Attributes: Resolve Uncertainty

- Separate login and authorization: signed-out users first log in when requesting authorization through an action, then enter authorization. Passive context reads or token refresh should not automatically redirect to login. Not every visit requires login.
- Account purpose and authorization trigger points summarize App behavior, not a platform enum setting. List multiple purposes/triggers separately. For each trigger verify the operation, requested permissions, target, and purpose; distinguish initial grants, reuse of valid grants, and supplementary permission requests. Being signed in does not mean authorized; login or purchase alone is not a capability grant.
- `generation.create` needs user authorization; this identifies who may initiate it, not by itself the final billing owner. Generation also needs permission to read results.
- App Actions execute in the App's Space with author-paid platform costs. Visitor products, credits, and entitlements are separate. Verify other calls by actual runtime identity and current billing rules; do not apply Action rules universally.
- Storage, access, and cost are independent facts. When writing into the author's Space, explain visibility to the author/relevant members under Storage; no extra dimension is needed.
- Realtime room messages are not durable or replayed; they do not prove result archiving. The App must implement saving.
- Retain Remix banner and use [Remix banner status](remix-banner-status.md). Do not rename it brand bar or substitute brand bar settings for Remix status.

Read relevant entries only when evidence is missing or conflicting. If still uncertain, write “To verify” rather than guess.

## Data Display Bar

Use “Data display bar” in the card for the top share-page Cohub bar. Report it separately from Remix without merging or substitution.

- Read `app.meta.presentation.hideCohubBar` from `apps get <appId> --json`: `true` configures hidden, `false` or omission of this optional field configures visible. Failed requests, malformed structures, and invalid field types are not defaults.
- Verify at the real share page, listing only information actually shown, such as author, version, or visits; do not promise every field always appears. Without inspection, report “Unverified,” optionally with known settings. Explain mismatches between settings and display.
- Check current help before changes: `--hide-cohub-bar` / `--show-cohub-bar` control this bar; hiding may depend on entitlement. Reporting does not automatically modify settings.
- Visibility is not a Remix switch, data access setting, or analytics collection switch; hiding does not establish that analytics stop.
