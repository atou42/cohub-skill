# Optional Plugin Interaction

The plugin bundles this same Cohub Skill and adds shared drafts and result presentation. It is not required for any standalone CLI workflow. Codex CLI can also load plugins: tool availability and card rendering are separate host capabilities.

## Select the Interaction

- When Cohub plugin tools are available, use a shared draft for generation unless the user explicitly chooses direct CLI use. On a host with card support, call `prepare_generation` to show the editable card; do not replace it with browser links or screenshots. Expanding details and returning to the chat keeps the same draft.
- If the tools work but the host has no cards, present the same saved draft and complete brief in conversation; explicit text approval authorizes `submit_generation` for the current revision. Lack of card rendering is not a plugin failure.
- Without plugin tools, use the conversation brief and official CLI in [Generate](generate.md). Do not require installing a plugin. If the user explicitly selected a card workflow and tools fail or are missing, report and diagnose that failure; do not silently switch submission paths. Reconcile any previous attempt before changing paths, and never resubmit an unknown result.
- Natural requests for Cohub images, video, speech or music enter this workflow without requiring tool names. Capability/idea questions do not create a draft or task automatically. Project sync, conversation import and game production retain their own routes. Respect another explicitly selected product.

## The Shared Draft

Apply [Creative brief and authorization](creative-approval.md). Put the plan and creative choices in `brief.summary`, output scope in `brief.output`, and the complete prompt, references, model and parameters in their dedicated fields. Read official model pricing; never invent a quote. With visible cards, briefly direct the user to the card rather than duplicating the complete brief in chat.

| Tool | Use |
| --- | --- |
| `prepare_generation` | Once per new creation, with `spaceId`, `model`, `prompt`, `media`, `parameters` and `meta`; model may be unset while the user is choosing. Save returned `draft.id`. |
| `read_generation_draft` | Read current contents, `draft.revision`, model declaration and validation before editing or submitting. |
| `update_generation_draft` | Use `draftId`, current `baseRevision` and `patch`. `media`, `parameters` and `meta` replace whole values; first merge with current user edits. |
| `add_generation_reference` | Use the same draft, current revision, media `type` and one source: HTTPS `url`, authorized local `filePath`, or file-picker `base64`. Retain declared `role` when required. |
| `submit_generation` | Only after the current brief is approved or within explicit task-scoped autonomy. Reread and check current content against that authority; submit current `baseRevision`. |

For `REVISION_CONFLICT`, reread and merge only intended changes while preserving the user's latest edits. Do not repeatedly try an old revision or prepare a replacement draft to avoid the conflict.

Use the returned official model declaration for types, inputs, roles and required parameters. Read `cohub models ls --model-type multimodal --json` and `cohub models show <model> --json` if needed; do not guess fields. Higgs currently accepts the default voice or one reference audio; weighted multiple-voice mixing is not supported by the official CLI, so omitting weights does not implement it.

Local references are staged first, at most 20 MiB per file; submission uploads them to a public asset URL in the selected Space. Add only user-selected or authorized material, and disclose that transfer before approval. For private-input/no-public-upload requirements, this plugin path is unsuitable: explain the constraint before submission and, if the user selects direct CLI, follow its supported `--inline` handling. Do not silently switch or upload publicly.

## Confirmation and Paused Drafts

The card's “Confirm and generate” action directly submits without another chat round-trip. A user's explicit text approval after reviewing the brief may also authorize agent submission of that same unpaused draft. Do not call app-only `confirm_generation` or `cancel_generation`, or operate those controls for the user.

Card confirmation binds the shown draft revision, model settings and quote; changes require renewed review and confirmation. Cancellation keeps the draft paused after agent edits. A card-paused draft resumes only through the user's confirmation control; agent text approval or autonomy cannot override that stored pause. In a host without the required control, report that limit and retain the draft rather than replacing it. Already approved text plans need no duplicate question, but any stored pause or stale-confirmation check still applies.

## Finite Card Batches

For prepared, independent drafts in the same Space, list at most 19 subsequent IDs in the main draft's `continuationDraftIds`. Prepare them before listing them. The user selects drafts, supplies an estimated-cost budget and chooses automatic continuation for this task. That click submits only these reviewed drafts in order; it does not authorize new plans, prompt edits or stages depending on earlier outputs.

Stop when a quote is unknown, the estimated budget would be exceeded, or a draft/quote changes. Preserve receipts and unsubmitted drafts after errors; a stopped batch cannot be resumed or retried as a batch. Read each original draft to determine what completed; unsubmitted selections remain paused. The budget checks current determinable quotes, not a server-side spending cap. Unknown-priced models can still be approved individually. Finite card selection is distinct from explicit broader agent autonomy described in [Creative brief and authorization](creative-approval.md).

## Receipts and Delivery

While `submitting`, keep reading the original draft. For `unknown` or ambiguous responses, reconcile the original attempt and never resubmit or create a duplicate draft. For `submitted`, retain `taskRunId` for follow-up. Recover failed presentation by reading again. A user-requested new edit starts a new draft using the actual earlier output. Report cost from actual billing records; missing records do not mean zero.

Use `show_generation({spaceId,id})` for actual existing tasks. Publish using the official CLI and [Publish](publish.md), with the same authorization policy. Read back `cohub -s <spaceId> apps get <appId> --json` for the actual URL, version and visibility, then use `show_publication({spaceId,id})` when available. Covers come from real App `meta.image` or a verified screenshot. Preserve the publication card's required factual handoff. State separately what was published and what was functionally checked; native interaction is verified only after testing it in the actual host.
