# Capability Discovery and Integration

Explain what Cohub adds without redefining the user's App. This map is not a feature checklist for every project.

| Capability | User value | Consult before implementing |
|---|---|---|
| Runtime generation | Visitors generate or edit images, video, speech, or music during use, not just once during development | Runtime guide, available models, selected model parameters |
| AI conversations and agents | Invoke conversations or Space workflows and read streaming progress/results | Runtime guide; distinguish model chat from tool-enabled Space prompts |
| App Actions | Expose generation, file processing, and business logic as callable tasks | Run App Actions in apps-guide |
| Space files and sessions | Read/write authorized content and build tools around existing work | Runtime guide, permissions, and data ownership |
| Select or create a Space | Let visitors select a workspace or create their own from the App | Current `requestSpace` / `requestCreateSpace` contracts |
| Desktop context and interaction | Follow the current session or expose UI methods to an agent | Context, surface, and desktop sections in apps-guide |
| Overlays and embedded Apps | Floating tools or compositions of existing Apps | Relevant apps-guide sections and examples |
| Realtime rooms | Shared realtime interactions when needed | Realtime rooms in runtime guide; verify persistence boundaries |
| Entitlements and management | Access control, commerce, versions, and analytics | [Operations and management](management.md) |

## Explain Options

For an existing image editor: "This version can be published as it is. Cohub can also let visitors generate or edit images while using it, rather than only processing prepared assets. We can keep the current behavior or integrate that capability."

Explain actual benefit and integration cost. Do not promise free, unlimited, login-free, or permanently available models. When the user explicitly wants publishing only, mention the option briefly and proceed; do not require another decision to continue.

## Implementation Notes

- Obtain identity through the SDK runtime, not an author token embedded in the browser. The Cohub iframe, standalone broker configuration, and ordinary local previews differ; consult the current runtime guide.
- Distinguish App home Space, opening invocation, current shell location, and user-selected data Space. Select the target for the feature explicitly, not through a universal fallback chain. Possessing an ID does not grant access.
- Discover available models and parameters. Implement task creation, waiting/subscription, result extraction, and visible failures. A Task ID is not a completed generation. Paid verification requires user authorization.
- If `requestCreateSpace` returns a created Space but initialization/authorization failed, report the retained resource rather than repeatedly creating new Spaces.

## App Actions

The checked structure is `.cohub/actions/<action>.ts|js|sh` inside a directory App. The frontend calls `client.app.actions.run({ action, input })` and queries the returned Task Run. Verify imports, return types, and task permissions against current documentation.

- Actions run in the App home Space Sandbox as the App owner, who bears platform execution costs. App commerce entitlement/credit operations target the signed-in visitor. These are different identities and balances.
- Action input is stored in the Task Run and visible to the owner/members who can inspect it; do not use it to secretly transport visitor credentials.
- `.cohub` is included in downloadable published artifacts. Never include secrets. Keep private implementation in the home Space behind a thin published Action when appropriate.
- Browser-supplied prices, entitlements, and user identifiers are not authorization evidence. Verify business charging and entitlements in trusted execution. Reuse idempotency identifiers on retries rather than generating a fresh charge ID each time.
- An Action cannot invoke another App Action; reuse an internal script or API. TypeScript runs through native Node type stripping, not arbitrary compile-time transforms.

Implement only selected capabilities. Verify their normal outcomes and meaningful failure paths, not the entire capability map.
