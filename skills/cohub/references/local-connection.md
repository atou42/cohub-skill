# Optional Local Connection

Use this workflow to connect a specific local project, sync conversations, import history or continue from the web. Ordinary installation, login, generation, publication and capability questions do not start it. First distinguish the requested outcome: calling the CLI does not place the same conversation on the web.

## Compatibility and Boundaries First

This section was checked against CLI 8.4.0 help and its packaged implementation. The entry is `cohub runtime`, not `cohub local`. Reuse the entrypoint's version and identity checks, then inspect the current `runtime -h` and relevant subcommand help.

- In 8.4.0, Runtime and historical import support only Pi and Codex. Do not promise Claude Code sync or continuation, switch harnesses, install extensions or migrate history automatically. Unsupported harnesses can still use ordinary generation and publication.
- Local execution, conversations visible on the web, and continuing the same conversation from the web are different states. Harness versions and integration state matter; some conversations may sync read-only. Check current implementation and status rather than only the harness name.
- An existing target must support local Runtime. Do not assume an ordinary cloud Space can be connected or convert its execution domain automatically. Explain and obtain authorization if a separate local Space is needed.
- See [Spaces and projects](spaces-and-projects.md) for ordinary command targeting. Runtime never falls back to Home.

Before connection, confirm the actual project directory, target Space (reuse or create), harness and scope. Explain that authorized Space collaborators can access files through Runtime and execute as the current OS user, beyond the project directory. Native conversation sync may include secrets; historical import requires its own confirmation. Binding a project is not merely adding a label.

The current `up` may also install or maintain native integrations and change user-level configuration; Codex's shared app-server keeps running in the background. Confirm these effects without changing the user's chosen provider, model, route or permissions. If the host or environment requires local execution on an own-account route, verify that first rather than moving execution to the cloud through Runtime.

## Connect the Selected Project

Run only after the scope above is authorized. Replace every placeholder, fix the working directory to this project, and select only an actually supported and authorized harness:

```bash
cohub runtime up <projectDir> --space <localSpaceId> --harness <pi-or-codex> -d --json
```

Creating a local Space requires explicit authorization; then use the current help's `--new` and `--name`. Do not combine creation with an existing Space or clear the environment to force it. Prefer an existing binding; do not repeatedly create Spaces to repair failures.

**Do not add `--yes` merely to run unattended.** In 8.4.0 it can approve not just local execution and native sync, but also importing old conversations in the directory and starting the shared app-server. Prefer answering each interactive prompt; decline historical import when only current conversation sync is authorized. Use this flag non-interactively only when every actual effect is explicitly authorized. Otherwise report the interaction blocker without expanding permission.

A successful `up` does not prove native sync succeeded. Background-start exit code 2 means it is still connecting; do not start another instance or claim the failed startup was cleaned up.

## Verify Status and Conversations

```bash
cohub runtime status --space <localSpaceId> --json
cohub runtime logs --space <localSpaceId> --limit 20 --json
```

Check the actual local process, directory, harnesses, remote components, `remoteError`, `nativeSyncError` and sync state. A local process, a visible web conversation or a background PID alone does not establish cross-client continuation. Read logs only for diagnosis, inspect sensitive content before sharing, and never upload them automatically.

For an already authorized synced conversation, verify its actual session ID in the target Space rather than just its title. Without conversation evidence, report "connection ready; continuation unverified". Do not send a new prompt, incur charges or scan all history merely for acceptance. Claim web continuation only after observing it.

## Historical Import

When history is explicitly requested, establish directory, destination and filters first. `import --dry-run` requires an available Runtime; a failed preview does not authorize starting one.

```bash
cohub runtime import <projectDir> --space <localSpaceId> --harness <pi-or-codex> --session <nativeSessionId> --dry-run --json
```

Prefer a known session; omit `--session` only when the user explicitly requests the project's entire history. Check counts, sizes, target and actual paths in the preview, then remove `--dry-run` to execute within that same authorization. Never expand the project directory to the user's home, read authentication files or call a successful preview an import.

For partial failures inspect the failed entries and preserve evidence. Cancellation can mean pause, not removal of uploaded data. Check the original task before retrying; do not repeat imports or create another Space to bypass errors.

## Stop and Recovery Boundaries

Use the current help's `runtime detach` when the user asks to pause native sync, or `runtime down` when asked to stop Runtime. Both retain data and do not delete uploaded history. Codex's shared app-server may remain running; disclose this without terminating other sessions. Stopping unconfirmed executions requires corresponding authorization; do not automatically add `--yes`.

Preserve errors, directory and necessary identifiers on corrupt configuration, binding conflicts, permission errors or indeterminate sync. Block only the connection step. Do not clear state, delete history, recreate bindings or change permissions to pretend recovery; existing ordinary generation and publication remain independently usable.
