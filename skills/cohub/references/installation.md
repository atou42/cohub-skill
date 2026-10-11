# Installation and Migration

Install only one instruction language: English at `skills/cohub`, Chinese at `zh-CN/skills/cohub`. Both share the name, functionality and version; language is en or zh-CN. Keep references, scripts and version.json, not only SKILL.md.

The standalone Skill is independently usable with the official Cohub CLI. The optional Cohub plugin contains this exact Skill and adds shared-draft/result tools. Codex CLI can load plugins too; visual cards depend on the host. Choose by environment, not a reduced/full capability split.

## Before Installation

1. Identify actual skill search locations from host documentation or known configuration. Do not guess fixed locations or scan the entire home directory. Check known project, user and plugin scopes; resolve symlinks and deduplicate real paths. Report the inspection scope; do not claim unknown locations are duplicate-free.
2. Find existing cohub, legacy plugin cohub-cards and cohub-app-developer entries. Read version, instruction language, ownership and customizations. Missing metadata means unknown; the conversation language does not establish the installed language. Identify whether the Skill is independently installed or belongs to a plugin cache before planning an upgrade.
3. On first installation, offer an instruction language, suggesting the current conversation language when unspecified and explicitly stating the choice. Preserve the installed language on upgrade; ask when unknown. Switch only when requested.
4. If multiple active installations or standalone App Developer exist, list their paths, languages and versions and establish which entry this host will use. Pause adding another copy; do not silently overwrite, delete or move files. An installation needed by another environment is not disposable merely because Codex can also see it.

## Unified Plugin Installation

Determine the stable Skill from the public `versions.json`, then verify that its release is published and the tag resolves to the recorded commit. A working-tree version alone does not prove release status. Preserve the repository URL, language paths, old tags and checker endpoint. For stable plugin installation, resolve and verify the main repository's published release tag and commit, including any independently numbered plugin release, then run its root installer. Use a candidate checkout only for explicitly requested development testing; report it as unreleased.

Installer commands, run from that verified checkout:

```bash
bash scripts/install.sh --language en --check
bash scripts/install.sh --language en
```

Use `--language zh-CN` for Chinese instructions. Full plugin installation requires Node.js 24+, npm, Git, Codex CLI and Cohub CLI. These are plugin installation requirements, not a new requirement to install the standalone Skill package. The complete options are `--language en|zh-CN`, `--skill-mode auto|bundled|external`, `--skill-path <absolute-path>`, and `--check`.

- **auto (default):** a compatible user-level standalone installation selects external mode; no existing entry selects bundled mode. Compatibility requires the same version and language plus matching package content. Only correctly completed Init cleanup is allowed as a content difference. A project-only Skill cannot suppress the user-level plugin entry; retain and resolve such scope conflicts rather than treating it as a reusable global installation.
- **external:** retains the user-level independently installed entry. The plugin still carries the exact Skill under `bundled-skills` but registers no Skill from that directory. Pass `--skill-path` for an explicit known user-level installation; a project-only location is not eligible. Do not replace its files with a plugin copy.
- **bundled:** registers the plugin's `skills/cohub` entry. Use only where no competing active entry exists; it is not a way to bypass a duplicate warning.

Old versions, customizations, bad metadata and damaged files stop installation rather than being treated as an empty environment. Preserve and review differences; perform any requested standalone upgrade separately before trying external mode again. Do not automatically delete, globally disable or rewrite a Skill to satisfy the installer. If a customized installation remains incompatible, explain the conflict and retain it until the user chooses a supported arrangement.

Packages are created in fresh `plugin/.packages/<id>` directories, not by overwriting a previously installed release. Retain the active source directory until Codex no longer references it. The user-facing name is Cohub; the internal identity remains `cohub-cards@cohub-cards-local` so existing installations upgrade rather than acquire a second plugin.

The old `cohub-plugin` repository's `git pull` then `bash scripts/install.sh` path is retained by a bridge pinned to the verified main-repository release tag and commit. Activate that bridge only after the main release and stable pointer succeed. It must never redirect existing stable users to an unreleased branch.

## Migration and Verification

2.0.0 embeds App Developer in references/app-developer and no longer ships a standalone skill. Compare customizations in both old skills and merge relevant content into the confirmed single cohub installation. Removing or disabling old entries needs explicit authorization; use supported host mechanisms and keep backups outside scanned skill directories. Do not modify shared mounts, plugin caches or uncertain ownership.

Install stable packages from the selected language directory at a published tag, not main. Use main only for explicitly requested development testing and label it unreleased. Verify the public release pointer before describing a version as stable.

If this Skill is in a plugin-managed cache or bundle, upgrade its owning plugin as a unit; never overwrite or independently update the cached Skill. Reusing an external Skill requires rechecking compatibility with the new plugin package. Preserve completed Init cleanup, draft data and user content. Do not change global host configuration as an automatic duplicate-removal step.

Verify that the host discovers exactly one cohub, no active legacy cohub-cards Skill and no active legacy cohub-app-developer. The unchanged internal plugin identity is not a duplicate Skill. Check relative references, version and language metadata. If host discovery cannot be observed, report it unverified; copying files is not enough. Preserve customizations and existing Init cleanup state.

Report version, instruction language, actual directory and stable/development status, and say instruction language does not change the agent's conversation language. Do not alter host language, global instructions or user preferences.
