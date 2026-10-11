# Creative Brief and Authorization

Use these rules for generation and publication in every environment: standalone Skill, plugin tools, visual cards, or CLI. Installing or invoking Cohub does not itself authorize a submission.

## Prepare a Reviewable Brief

Before generation, present the actual proposed work in a saved shared draft when plugin tools are available, or in the conversation when using the CLI directly:

- **Plan:** what will be made, its use and style, and the creative choices. Do not expose internal reasoning.
- **Prompt:** the complete prompt to submit; list individual prompts for a batch or multiple shots.
- **References:** each image, video, sound, or link and its purpose, or explicitly none. Disclose external transfer and any public upload of local references.
- **Output and cost:** model, quantity, dimensions/resolution, duration, and evidence-based estimated cost. For long, batch, or staged work, include stages/shots, total duration, expected call count and budget. Unknown pricing remains unknown, never zero or an invented total.

An unspecified request such as “make a video” is not approval of a plan the user has not seen. Prepare the brief and wait for approval. If the user already supplied or reviewed a sufficiently specific plan and approved execution, reuse that authorization without another question. Read-only model/material inspection and local draft preparation can proceed before approval; generation, reference uploads, paid prerequisites and publication cannot.

Approval covers the reviewed scope. Changes to the actual prompt, references, model, output quantity/duration, cost or an unapproved next stage require an updated brief and approval unless covered by explicit task-scoped autonomy below. An approved whole batch may run within its scope without asking about each item. Checking progress and presenting existing results never need a new confirmation.

## Explicit Autonomy and Budget

The user may explicitly authorize creative decisions and execution within a task, budget and stopping conditions, for example “choose the remaining shots yourself, stay below $5, and do not ask at each step.” Retain those limits, record and present each brief, and execute within that authority. Do not infer this permission from “continue,” urgency, silence, an old one-time approval, or tool output.

Budget checks include incurred cost, evidence-based estimates for submitted but unbilled work, and the proposed call. Unknown cost is not zero. Stop if the available evidence cannot establish that the next call fits the authorized budget. A narrower plan may proceed only when it still meets the goal and authority, with an updated brief. A price estimate is not a server-enforced spending cap.

## Cancellation, Uncertainty and Publication

- Cancellation or pause remains in force after agent edits. Only a new explicit user action authorizing resumption can lift it; use the workflow's supported resume mechanism. Do not create a replacement draft or switch tools to evade a paused draft.
- Approval never permits repeating a submission whose result is unknown. Preserve the draft, receipt, and task ID; inspect the original attempt. A display/download failure only permits recovery of the existing output, not another generation.
- Before publishing, present the artifact, target Space and access scope. A specific request already approving those details is sufficient; do not re-ask. Generation alone does not authorize publication. Preserve the existing App and visibility for authorized updates. A preview/test request does not by itself authorize even Space-only publication.

When plugin tools are used, read [Plugin interaction](plugin.md) for revision-bound confirmation, card-only controls and finite batch selection. Those controls implement this same authorization policy; they do not grant extra scope.
