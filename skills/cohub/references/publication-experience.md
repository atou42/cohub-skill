# Help Real Users Complete Their Goal After Publication

Use this guide before and after Cohub publication according to the project's purpose. Preserve approved design and features. For publishing finished work, fix necessary publication issues without automatically redesigning, adding login, AI, or charging. Offer larger experience changes as suggestions without blocking the user's chosen publication; label unimplemented demo features honestly.

## Choose Checks from the Usage Goal

Use the project and conversation to establish who opens it, what they should accomplish first, and their main devices. Do not repeat an answered interview. Assess frontend files, external services, and Cohub runtime separately: static frontends may call online APIs, opening HTML does not prove offline use, and a backend does not mandate migration.

A finished link permits inspecting the public interface, not assuming possession of source, backend, or publishing rights. Request only necessary missing source. Do not include private service code, secrets, or the whole working directory in public artifacts.

When retaining external services, check browser requests, allowed origins, HTTPS, and identity settings at the new public entry. Do not move private keys into the frontend. For offline promises, distinguish downloaded local use from losing connectivity after loading; test assets and core operations accordingly. Do not promise that opening an online share link for the first time needs no network.

## First Open and Core Workflow

Choose relevant checks; not every App must implement this whole list:

| Purpose | Actual result to reach |
|---|---|
| Report or portfolio | First screen explains purpose and scope; latest conclusions are easy to find, historical results are dated, charts, samples, and downloads work |
| Game | Find the start, complete a round of core gameplay, restart as designed; check actual touch interactions when relevant |
| Editing or generation tool | Submit valid input, see processing state, obtain and open a usable result; test promised saving, copying, or downloading |
| Data App or online service | Empty first use explains the next step; reading, submission, or saving completes; promised retained data survives refresh |

Inspect the first screen, main actions, long content, and results at the agreed screen sizes. Text must be readable and main buttons reachable without obstruction from Cohub's outer toolbar. Check images, fonts, audio/video, relative paths, and applicable deep links/refresh. Do not impose a color scheme, navigation, animation, or page structure for consistency.

For public sharing, retain or supply a recognizable title, short purpose description, and existing icon. Check actual Cohub support and rendering of share previews before claiming metadata took effect. Generation tools should explain required input and expected output. Use authorized example materials; never pass prepared results off as live generation. Keep Space IDs, scopes, and deployment instructions out of ordinary user flows.

Cover only relevant states: first-use empty, running, success, failure; test denial and expiration when login/authorization exists, and cost explanations and insufficient balance when paid features exist. Errors should preserve input and acquired results and give an actionable next step, not pretend failure means no data or endless waiting.

## Cohub Identity, Generation, and Cost

Static reading needs no account or generation integration merely for testing. Only when runtime capabilities are selected, read the relevant [App Developer](app-developer/index.md) module and verify current documentation and version.

- Establish separately who can open the page, execute features, where results are stored, and who pays platform costs. A public App does not imply anonymous generation or a public Space.
- Choose between retaining a backend and integrating Cohub according to the user's goal. Use runtime identity, never author credentials in the frontend; do not force every App onto one calling pattern.
- Do not transplant Neta's signup credits, free allowance applications, or charging rules into Cohub promises. Verify visitor commerce credits separately from platform balance; author Action execution cost is separate from visitor entitlements.
- Test promised paths beyond the owner: anonymous public reading or an authorized ordinary signed-in user. Without an account, budget, or tools, identify unverified parts. Do not register accounts, purchase, expand permissions, or substitute owner access without authorization.
- For generation tools, reach real usable output within existing authorization; a task ID or success message is not a finished artifact. If real generation or charging cannot be tested, distinguish page checks, simulations, and unverified real use.

## Continue from Symptoms, Not Assumed Causes

| Symptom | Investigation and condition for continuing |
|---|---|
| Page opens but assets are missing | Check request addresses, published directory, and permissions; correct the proven issue and recheck publicly, not universally replace with absolute paths |
| Button does nothing or waits indefinitely | Distinguish missing events, failed requests, ongoing tasks, and result-read failures; inspect the original task when one exists |
| Owner succeeds but friends cannot | Compare tested identities, data scope, authorization, and cost ownership; do not grant all permissions or assume owners bypass every check |
| Repeated clicks conflict | Establish original operation state and ownership; reuse or create according to semantics. Do not reuse another user's same-name session or randomize names to create duplicate tasks/costs |
| Nested pages or duplicate toolbars after sharing | Check the actual returned App entry and embedding layers; fix duplicate wrappers without substituting a raw CDN asset for the share entry |
| Interrupted upload, rate limiting, or unclear publication state | Preserve known upload/App state, follow returned recovery information, and establish whether publication completed before retrying. Do not claim unsupported resume behavior; report blockers instead of deleting work, changing accounts, or repeatedly resubmitting everything |

## Evidence for Delivery

Verify promised core flows at the actual returned Cohub App link. Local previews do not replace runtime, visitor identity, or charging checks. Distinguish successful page publication from all features working.

Read the [Publication card](publication-card.md) only at final delivery of a publication result; do not preload it or its references here. For updates, confirm the same App, agreed visibility, new version, and stable entry. Retain recoverable source and artifacts. Continue from the user's specific reported state without requiring them to learn platform internals.
