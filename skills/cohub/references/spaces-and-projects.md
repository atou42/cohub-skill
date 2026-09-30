# Spaces and Projects

A Space is the destination for project files, conversations and works, not a mandatory first step for media generation. Installing the CLI does not turn a local folder into a Space; passing `-s` does not sync files or conversations. Explain usage questions without requiring login or resource creation.

## Two Working Styles

- Ad hoc work: preserve the current directory and context; let ordinary commands resolve their target, falling back to Home only without an explicit target or directory binding. Do not require a new Space for tidiness.
- Project organization: retain the user's project directory and Space. Reuse an existing Runtime binding; when only generation or publication needs a destination, pass `-s` without enabling Runtime. Read [Local connection](local-connection.md) only when the user explicitly wants directory and conversation connection.

## Check the Actual Target

Ordinary Space commands in CLI 8.4.0 resolve in this order:

1. The command's `-s/--space`.
2. The current `COHUB_SPACE_ID`.
3. The current directory's Runtime binding, matched by canonical directory, authenticated account and environment.
4. Home Space.

Bindings do not automatically cover arbitrary subdirectories. Run from the actual project root; do not write immediately after changing directories to obtain references. When targeting needs verification, use read-only commands confirmed by the installed help from that directory:

```bash
cohub spaces get --json
cohub -s <projectSpaceId> spaces get --json
```

Check a known ID directly rather than enumerating all Spaces. Use `cohub spaces ls --json` only when finding a project by name. Extract the actual ID and name from the response; check project access when relevant without dumping sensitive metadata. Ask when a name cannot uniquely identify the target.

The environment variable overrides a directory binding. If it points to A but the user explicitly requests B, pass `-s B` for this operation rather than clearing or permanently changing the environment. Preserve errors and stop affected writes on unclear targeting, permission failures, corrupt bindings or locks; never turn these into "no binding" and write to Home.

After establishing the target, use each creative source's own `-s` for cross-Space reads, and explicitly pass the confirmed project ID for generation, uploads and publication. Retain the account, environment, directory and destination relationship; Style/Game Maker sources are not project destinations.

## Neither Connection nor Cleanup

Runtime commands do not fall back to Home; an unbound directory needs a confirmed connection target. `runtime up --space` affects the directory binding and requires a local-Runtime-compatible target. It is not an ordinary Space selector.

"Keep context clean" means use relevant project information, not automatically delete files, conversations or history. Do not invent another binding file or hand-edit the CLI binding registry. Connection, migration and deletion each follow the user's actual authorization.
