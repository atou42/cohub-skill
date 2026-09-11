# Operations and Management

Explain the available behavior and implement the confirmed choice. Permissions and cost are operating conditions, not an automatic requirements interview or a mandate to decide for the user.

## Explain to the User

- Who can open the App and who can execute features. A public page does not imply anonymous generation or a public Space.
- Which Space supplies data and stores results, and who can see them.
- What the visitor authorizes, whether the author bears execution costs, and what a purchase provides if monetization is selected.
- Versions, visibility/permissions, disabling, and analytics are available management options. Introduce promotion links and commerce when relevant, not tracking by default.

Respect existing choices without repeating a questionnaire. Explain specific missing permissions; do not fix errors by granting every scope.

## Implementation Boundaries

App-side grants apply only to the App's own Space and are platform-bounded. Viewer grants are constrained by the visitor's current access and distinguish target Spaces. Neither gives access to another Space merely from its ID.

Direct `generation.create` and account-level scopes cannot be inserted into publishing `appScopes`. Owner-executed App Actions are a separate path, not browser-side direct generation. Verify permitted scopes using current CLI help and the App guide.

`user.space.list` lists Spaces; it does not grant access to their contents. Public Apps, public Space files, and runtime authorization are separate settings.

Explain authorization purpose, trigger it from an appropriate user action, and handle denial, revocation, and insufficient permissions. Never silently widen scope or loop consent dialogs. Missing result-read permissions must not be hidden as a task that is still running.

## Cost and Commerce

Verify the execution actor, platform cost owner, visitor entitlements, and result destination separately. Login alone does not establish who pays.

App commerce Space credits differ from platform Cohub Balance. Read `docs/app-commerce-guide.md` when implementing monetization, including entitlement lookup, purchase, return confirmation, and consumption where required. Do not promise undocumented automatic payouts, subscriptions, or refunds.

Never initiate a purchase during initialization. For potentially repeated tasks, consumption, or resource creation, inspect existing operation state before retrying. Actual charges, product configuration, and permission expansion require corresponding authorization.

## Management Entry Points

Read `cohub apps --help` and the relevant subcommand help first. Use only what the task needs:

- `get`, `versions`: inspect settings and versions.
- `update`, `publish-version`: manage settings and workspace-sourced versions; see the publishing module for local updates.
- `grants`, `revoke`: inspect/revoke the current user's grants, not all visitors' grants.
- `stats`: view analytics; consult `promotions` only for promotion needs.
- `download`: recover supported published artifacts, not necessarily all original source or private Action implementations.
- Disabling, deleting, or changing visibility: explain impact and follow task authorization; do not delete as a debugging shortcut.

## Verification Boundaries

Test promised identity paths rather than requiring every App to support anonymous use. Verify public browsing, signed-in use, or denied consent according to integration scope.
Record the tested identity type. Without another account or paid-test authorization, report those paths as untested; owner success is not evidence of visitor or charging success.
