# Source Verification

## Environment

Check `command -v cohub` and `cohub --version` before installing anything.
If missing, explain that the official npm package is needed and follow the current installation authorization:

```sh
npm install -g @neta-art/cohub-cli
cohub auth login
cohub auth whoami --json
```

Guide the user through the device authorization returned by the CLI. Never request or print tokens or embed local credentials in an App. Report authentication failures instead of automatically logging out or overwriting configuration. Identify an actual incompatibility before proposing an upgrade; do not upgrade just to read help.

## Reference Source

Confirmed source: tzwm's Cohub Space, ID `cf327f11-5065-4f3a-bfe5-cdb0a70f3377`.
This is a read-only reference source, not the destination for user Apps, generation, or data.

```sh
cohub -s cf327f11-5065-4f3a-bfe5-cdb0a70f3377 spaces files ls docs --json
cohub -s cf327f11-5065-4f3a-bfe5-cdb0a70f3377 spaces files cat docs/apps-guide.md
```

Read only relevant files. List directories before selecting examples; do not download the whole repository.

| File or directory | Purpose |
|---|---|
| `docs/apps-guide.md` | Hosting, Actions, desktop, embedding, permissions, and management |
| `packages/sdk/docs/app-runtime-guide.md` | SDK initialization, runtime, generation, conversations, realtime rooms, and errors |
| `packages/sdk/src/` | Relevant types and implementation when docs are insufficient; locate files first |
| `packages/cli/README.md`, `packages/cli/CHANGELOG.md` | CLI usage and changes; verify flags against installed command help |
| `packages/sdk/CHANGELOG.md` | SDK capability and compatibility changes |
| `docs/app-commerce-guide.md` | Products, entitlements, credits, and checkout |
| `docs/examples/app-capability-lab/` | Runtime and Action examples |
| `docs/examples/desktop-surfaces/` | Desktop presentation examples |

The source was readable on 2026-09-11; access for other accounts is not guaranteed. On 401/403, explain that this account cannot read the source and use user-provided material or accessible official documentation. Pause an integration if its API cannot be established. Do not invent behavior, open source-Space permissions, or require access to internal chats.

## Conflicting Evidence

- Feishu discussions inform requirements, announcements, and examples; they do not prove deployed API behavior. Distributed skills must not depend on Feishu access or copy internal chats.
- Space files reflect a working tree and may lead deployment. Reading docs is not an end-to-end test. Record the actual CLI/SDK versions used and reconcile command help, types, and observed behavior.
- The runtime guide's publishing section has described workspace paths even though the CLI supports `--source local`. Do not force an upload because of this discrepancy.
- The App guide describes arbitrary file previews while older SDK examples cover HTML only. Verify the selected target instead of turning an old limitation into a permanent rule.
- Use a verified SDK version and exports, not placeholder SDK URLs, model IDs, or Space IDs from examples.
- Do not print complete Space metadata. Project only necessary fields such as id/name; configuration may contain credentials in `extraEnv`.
