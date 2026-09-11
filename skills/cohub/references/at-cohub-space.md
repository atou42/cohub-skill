## At Cohub Space: Read Only When Needed

Use this fallback when the skill and relevant CLI help cannot establish the next action, evidence conflicts, or the same problem persists after a targeted correction. Do not retry just to reach a failure count. Routine parameter fixes, login, and explicit permission denials do not by themselves require Space research.

1. State one concrete unanswered question and retain the relevant error, attempted correction, and CLI/SDK version.
2. Use the current skill, relevant command help, and available local docs/types first. If sufficient, continue without opening the reference Space.
3. Otherwise read the most relevant one or two documents from the source below. Use known paths directly; list only the relevant directory when a path is unknown. Do not recursively scan or download the whole repository.
4. Only if documents are insufficient, locate the relevant example, type, or implementation. Before broadening the search, identify the remaining evidence gap. Reuse applicable evidence from this task instead of rereading it.
5. Once the question is answered, return to the original task. Keep a short note of the source path, relevant finding, and version caveat. If targeted lookup still cannot establish the API, report the precise blocker rather than searching indefinitely or guessing.

Space files may lead deployment; reconcile them with installed versions and observed behavior. On denied access, report the restriction and use accessible official documentation or user-provided material; do not change permissions or seek restricted copies. Reading is not authorization to execute in the Space, modify it, delegate to remote agents, or send local project content there. Never print credentials or complete Space metadata.

This fallback is separate from creative capability routing: a selected Style, Game Maker, Fandom, OKP, or Character Traits source remains a normal required entry, not a last resort.

## Reference Source

Cohub source Space: `cf327f11-5065-4f3a-bfe5-cdb0a70f3377`. This is a reference only; preserve the user's publication or generation destination. Follow the main skill's CLI and identity checks; verify flags against installed command help.

```sh
cohub -s cf327f11-5065-4f3a-bfe5-cdb0a70f3377 spaces files cat packages/cli/README.md
```

Select by question; do not load all entries:
- CLI usage or version differences: `packages/cli/README.md`, `packages/cli/CHANGELOG.md`.
- Publishing forms: `docs/apps-guide.md`.
- If docs are insufficient, locate the relevant implementation under `packages/cli/` first.

App SDK/API development remains outside this skill. Use cohub-app-developer when requested; research does not expand the task.

