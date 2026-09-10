# Initialize Cohub

Guide the user's agent through setup, then remove this one-time guide only from an eligible local installation. The distributed repository must retain it.

## 1. Check and Install the CLI

- Explain the setup actions before changing anything: install the CLI if missing, help the user log in if needed, and remove the local init guide after verification when safe and authorized. Follow the environment's authorization rules. Do not ask again for unchanged actions the user already approved; skill activation alone is not approval to install software or delete files.
- Check whether `cohub` is available and run `cohub --version` if it is. Reuse an existing installation. A broken command is not evidence that the CLI is missing; preserve the error and diagnose it instead of reinstalling over it.
- If missing, check that Node.js and npm are available. With installation authorization, run:

```bash
npm install -g @neta-art/cohub-cli
```

- If prerequisites are missing or installation fails, report the concrete blocker and keep this guide. Do not automatically install a runtime, use `sudo`, change permissions, or upgrade an existing CLI. Check the shared version requirements and the installed subcommand's help before proceeding.
- Verify that `cohub --version` now succeeds in the agent's execution environment. Do not treat an npm success message as sufficient.

## 2. Log In and Verify

```bash
cohub auth whoami --json
```

- Reuse a valid session. Report the account identity without exposing credentials. If it is not the user's intended account, resolve that before proceeding; do not silently log out or switch accounts.
- Only when the response indicates an unauthenticated session, inspect `cohub auth login -h` and run `cohub auth login`. Follow the CLI's actual login instructions, let the user complete browser or interactive steps, and wait when their action is required. Do not invent a login URL or ask them to paste tokens into chat.
- Run `cohub auth whoami --json` again afterward. Login-command completion alone does not prove authentication succeeded. Distinguish network, service, and permission errors from missing authentication.
- Keep credentials under the CLI's management, never in skill files or the repository. Preserve the existing Space context. Setup does not require creating a Space, changing a profile, generating paid media, or publishing an App.

Setup is complete only when the CLI version check succeeds, the version supports the requested workflow, and the identity check confirms the intended authenticated account. Failure, cancellation, or uncertainty leaves the init content intact for a later attempt.

## 3. Remove Only the Local Init Content

After successful verification, perform cleanup only if it was authorized as part of setup and the skill is a writable, user-owned local installation. Resolve symlinks and inspect its location first. Skip cleanup in a source/distribution checkout, a shared source mount, a plugin-managed cache, or a read-only directory, and whenever ownership is uncertain. Do not alter permissions or the public repository to enable cleanup. Skipped cleanup does not invalidate successful setup.

For an eligible local copy:

1. Read the current `SKILL.md` and this file. Confirm there is exactly one intact pair of `<!-- COHUB_INIT_START -->` and `<!-- COHUB_INIT_END -->` markers, with only the setup section between them. If the markers or content were customized or are ambiguous, retain the files and explain why.
2. Remove only that marked block, including its markers, using a targeted edit. Preserve every other byte, including the shared CLI and authentication checks, task routing, and user customizations. Verify the edit before deleting this file; if it fails, keep the guide.
3. Delete only this local `references/init.md`, not the references directory. If another installed skill file links to it, retain it and report that cleanup is incomplete rather than breaking the link or editing unrelated files. Do not run recursive deletion or commit or push cleanup changes.
4. Verify that `SKILL.md` no longer references the removed guide, and that the generate and publish references still exist and resolve. If deletion fails, report the retained file; do not claim cleanup succeeded.

Report the CLI version, authenticated account, and whether local init content was removed or retained. Continue the user's originally requested workflow when authorized. Do not run generation or publication just to demonstrate setup.
