# Remix Banner: Capabilities, Integration, and Publication Status

Read only when filling the card's Remix banner field, answering questions about it, or integrating remix capability. Keep the name “Remix banner,” separate from the top “Data display bar.”

## Currently Verified Capabilities

On 2026-09-19, checks against Cohub Space, official repository main (`78d643c7f7d008fc72fd5e7ff33407628fb75864`), and CLI 7.0.1 found **no built-in Remix banner, enable parameter, or one-click App-copy flow in the checked standard App publishing and sharing path**. Do not keep saying “enablement not yet confirmed,” implying an undiscovered switch. Do not generalize this finding to all versions, Neta Studio, or author-built pages.

Evidence:
- `AppPresentationMeta` in `packages/sdk/src/apis/apps.ts` contains only `hideCohubBar` and `surface`; display settings in `AppPublishDialog.svelte` control only the Cohub bar.
- `apps/web/src/routes/(public)/[username]/[spaceSlug]/w/[appSlug]/+page.svelte` and `AppSurface.svelte` render no Remix entry. `CohubBar.svelte` displays branding, work, author, visits, and version actions.
- Packaging in `apps/worker/src/system/jobs/app-publish-asset/index.ts` does not inject a Remix banner. Current `cohub apps --help` has no remix subcommand.
- CLI `apps download` does exist. A published directory App was downloaded successfully and compared with its original files. This verifies downloading, not one-click remix for a new visitor.

Paths refer to the [official repository](https://github.com/talesofai/cohub/tree/78d643c7f7d008fc72fd5e7ff33407628fb75864). If an actual banner, new release documentation, or setting appears, investigate that entry and revise the finding instead of mechanically applying this dated result. Absence from one page alone does not prove platform-wide lack of support.

## When Users Want to Continue Creating from a Work

The executable path is **obtain published files → edit in a separate directory → preview and verify → publish a new App**. This is agent-assisted remix, not platform one-click Remix.

1. Identify source App/version and read details under the current identity. Confirm download availability and permission to use the content; public access is not a remix license.
2. Check current CLI help, then download into a new working directory while preserving the original:
   ```sh
   cohub apps download '<source App URL or ID>' --output '<new working directory>' --json
   ```
   Verify returned version, files, and actual content. Handle file/directory by returned kind. Report unavailable downloads or denied access without bypassing permissions.
3. Check whether the package includes the code and assets needed for changes. Published files may omit the original project, dependency source, or external services. Verify generation, login, Actions, storage, and charging separately; do not claim original permissions, accounts, historical data, products, or services were copied.
4. Make requested changes and verify them. For publication, follow [Publish](publish.md), using a new App identity/name and returning its link plus source information. Do not update the original unless explicitly requested.

## When Users Want a Visible Remix Banner

Explain that the current standard share page does not supply it automatically. If requested, implement **custom remix guidance** in the work without calling it a built-in one-click feature or changing the page merely to fill the card.

A useful minimal guide supplies the source work, remix permissions, how to obtain files, and an instruction visitors can copy to an agent: “Create my version of this work: <source link>. First check whether you can obtain complete files, then modify them as I request. Publish a new work and preserve the original.” Do not invent Cohub prefilled-prompt links, Remix APIs, or metadata switches.

“One click creates an editable copy” additionally requires implemented and verified target Space selection, actual file copying, dependency handling, and new work creation. A homepage link, copied prompt, or download alone does not meet that outcome. Explain any login or cost requirement at the actual operation.

Preserve visual design and main controls. Verify desktop/mobile rendering, entry clicks, obtaining materials, continuing edits, and ownership of the new work within the promised scope. Preserve independent data display bar settings.

## Filling the Publication Card

| Verified condition | Status | User-facing explanation |
|---|---|---|
| The checked standard share page, with no custom entry inside the work | Not provided | This share page has no built-in Remix banner; an agent can download and modify the work. Verify download availability for this particular work. |
| Custom remix guidance with verified content and entry | Visible (remix guidance) | Instructions and materials are available; this does not mean one-click copy creation. |
| A complete, tested remix flow exists | Visible | Explain actual click result, login requirements, and limitations, without omitting unverified steps. |
| A real banner's explicit disable setting is identified and the page has no entry | Hidden | The entry is not displayed; hiding it does not prohibit copying or remixing. |
| The share page cannot be inspected, or a new mechanism conflicts with these sources | Unverified | Name missing evidence and investigate the actual entry; do not substitute the data display bar. |

Missing Remix does not block unrelated ordinary publication. When remix capability is explicitly requested, continue addressing the missing flow as unfinished work rather than leaving a “to confirm” sentence in the card.
