# Installation and Migration

Install only one instruction language: English at `skills/cohub`, Chinese at `zh-CN/skills/cohub`. Both share the name, functionality and version; language is en or zh-CN. Keep references, scripts and version.json, not only SKILL.md.

## Before Installation

1. Identify actual skill search locations from host documentation or known configuration. Do not guess fixed locations or scan the entire home directory. Check known project, user and plugin scopes; resolve symlinks and deduplicate real paths. Report the inspection scope; do not claim unknown locations are duplicate-free.
2. Find existing cohub and cohub-app-developer entries. Read version, instruction language and customizations. Missing metadata means unknown; the conversation language does not establish the installed language.
3. On first installation, offer an instruction language, suggesting the current conversation language when unspecified and explicitly stating the choice. Preserve the installed language on upgrade; ask when unknown. Switch only when requested.
4. If multiple active installations or standalone App Developer exist, list their paths, languages and versions and establish which to retain. Pause adding another copy; do not silently overwrite, delete or move files.

## Migration and Verification

2.0.0 embeds App Developer in references/app-developer and no longer ships a standalone skill. Compare customizations in both old skills and merge relevant content into the confirmed single cohub installation. Removing or disabling old entries needs explicit authorization; use supported host mechanisms and keep backups outside scanned skill directories. Do not modify shared mounts, plugin caches or uncertain ownership.

Install stable packages from the selected language directory at a published tag, not main. Use main only for explicitly requested development testing and label it unreleased. Verify the public release pointer before describing a version as stable.

Verify that the host discovers exactly one cohub and no active legacy cohub-app-developer. Check relative references, version and language metadata. If host discovery cannot be observed, report it unverified; copying files is not enough. Preserve customizations and existing Init cleanup state.

Report version, instruction language, actual directory and stable/development status, and say instruction language does not change the agent's conversation language. Do not alter host language, global instructions or user preferences.
