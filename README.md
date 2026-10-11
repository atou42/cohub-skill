# Cohub

[English](README.md) | [简体中文](README.zh-CN.md)

Let your local agent work with Cohub on games, websites and small apps, media, characters and publishing. Optionally organize projects with Spaces, connect supported local conversations, or add visitor-time generation and Actions. Preserve your design, stack and local workflow.

Personally maintained, not an official Cohub distribution. Source versions: **Skill 2.3.0 / plugin 0.6.0**. Use the [published releases](https://github.com/atou42/cohub-skill/releases) and public version manifest to confirm availability.

## Choose How You Use Cohub

Both options provide the same Cohub workflows and authorization rules. The plugin adds shared editing and presentation; standalone use is complete.

| Where you work | Choose | What you get |
| --- | --- | --- |
| An agent that supports Skills and local commands | **Standalone Skill** | Cohub through conversation and the official CLI; no plugin dependencies. |
| Codex desktop or Codex CLI, with optional richer interaction | **Cohub plugin** | The same Skill plus shared drafts and result tools. Visual cards require a supporting host. |
| Several environments | **Install for each environment** | Keep standalone use where needed; the plugin avoids registering a duplicate Skill when it can reuse a compatible installation. |

A new plugin installation includes the Skill automatically. Existing compatible user-level Skill installations keep their original entry. You do not need to choose between “Cohub” and “Cohub creation.” App Developer remains an internal on-demand module.

Choose one instruction language: [English](skills/cohub/SKILL.md) or [简体中文](zh-CN/skills/cohub/SKILL.md). Functionality is identical. **Do not install both.** Instruction language does not change conversation language.

## Install the Current Stable Skill

The [public version manifest](https://raw.githubusercontent.com/atou42/cohub-skill/main/versions.json) points to the verified release tag and commit. Install the latest stable version from that tag. Existing Skill installation URLs, language directories, release tags and update checks remain valid.

Ask your agent:

> Install the latest stable English cohub from https://github.com/atou42/cohub-skill. First inspect the skill directories you actually load for existing cohub or cohub-app-developer installations and preserve customizations. Do not install both languages. Report the installed version, instruction language and location without changing our conversation language. Guide CLI installation and login only if needed.

Select the verified stable tag's skills/cohub directory; use main only for explicitly requested development testing. Keep references, scripts and version.json. See [installation and migration](skills/cohub/references/installation.md) for existing installations, language changes and legacy App Developer migration. Old installations are not deleted without authorization.

## Install the Cohub Plugin

Ask your agent to install the Cohub plugin from this repository’s verified published tag and commit. It should check existing installations first, preserve customizations, and run the following commands from that checkout. The installer needs Node.js 24+, npm, Git, Codex CLI and Cohub CLI. The standalone Skill does not inherit the plugin's Node.js version or dependencies.

From that checkout, inspect the installation plan first:

```bash
bash scripts/install.sh --language en --check
```

Then install:

```bash
bash scripts/install.sh --language en
```

The installer automatically reuses an existing same-version, same-language, unchanged user-level standalone Skill; otherwise a fresh environment receives the bundled Skill. Older versions, custom edits, missing metadata or damaged files stop installation with an explanation. It does not overwrite standalone files or disable them globally. If your standalone Skill is older, upgrade it while preserving customizations before pairing it with the plugin. A project-only Skill cannot replace the plugin entry for every project.

To point to a known compatible installation, use `--skill-mode external --skill-path /absolute/path/to/cohub`; use `--skill-mode bundled` only when the target host has no competing entry. Keep the selected package directory: Codex may still use it. Read the installation guide for duplicate-entry checks and upgrades. Use the **verified release tag and commit**, never an unreviewed branch for a stable installation.

Already using the old plugin checkout? Follow its [upgrade instructions](https://github.com/atou42/cohub-plugin#readme): `git pull --ff-only` followed by `bash scripts/install.sh`. The compatibility entry is pinned to a verified main-repository release. Existing works and drafts are retained.

## Use

- "Explain the creative capabilities." A question does not trigger login, generation or publication.
- "Make a browser game in this project without publishing yet."
- "Generate background images for this project without publishing it."
- "Publish this finished game without rebuilding it."
- "Add visitor image generation to this App, preserving its design."
- "Explain this directory's Space destination and why local conversations are not on the web."

After first-time setup, introduce generation and editing, creative knowledge and workflows, in-app AI and interaction, publishing and runtime, and project organization and continuity. Then use relevant works to show how capabilities combine. Games and websites are examples, not limits. Continue an explicit task without another capability-list question; do not automatically generate, publish, create Spaces or enable sync. Authorized local Init cleanup remains optional; source and shared installations retain it.

[Spaces and projects](skills/cohub/references/spaces-and-projects.md) supports both ad hoc and project-organized work. [Local connection](skills/cohub/references/local-connection.md) is optional: ordinary CLI calls are not conversation sync. CLI 8.4.0 local connection supports Pi/Codex, not a promise of Claude Code conversation sync.

The Cohub-only [public Explore page](https://cohub.live/atou/home/w/cohub-explore) and the skill's [work references](skills/cohub/references/examples.md) share one [catalog](explore/catalog.json), without Neta Studio examples. Both instruction-language packages use the same [stable public JSON endpoint](https://public.cohub.live/p/863b6242-2ba4-47a9-9bfd-e401020a639f/cohub-explore/catalog.json). Catalog updates do not require reinstalling the skill. See [Explore maintenance](docs/Explore维护.md) for deployment and updates.

## Environment and Boundaries

Requires a local agent with filesystem and command execution. CLI setup needs Node.js/npm; remote capabilities need network access and their respective permissions. Capability questions do not require CLI readiness. Generation and publication examples were originally checked against CLI 6.9.1; Space targeting and local connection against 8.4.0. Installed help remains authoritative.

Style, Game Maker, Fandom, OKP and Character Traits route directly to their sources. Permissions, authentication and dependencies are independent; readable instructions do not establish runtime readiness. See [preparation and acceptance](skills/cohub/references/preparation.md).

Each invocation checks stable releases, notifying without automatic updates. Upgrades preserve instruction language and customizations. Generation does not authorize publication; source Spaces are not write destinations. No internal governance or cross-agent delegation.

## Validation and Maintenance

This is the main source repository for both distributions. The canonical bilingual Skill stays in `skills/cohub` and `zh-CN/skills/cohub`; `plugin/` holds the plugin source and its imported history. Plugin packages include that exact Skill instead of a separate creative Skill. Independent Skill installations never need the plugin source or its dependencies. Personal shared-skill repositories are distribution mirrors, not another authoring source.

Automated checks cover package structure, language consistency, self-contained links and update failure paths. Agent scenarios are recorded in [behavior acceptance](docs/行为验收.md); remote capabilities, paid generation and visitor flows are not claimed fully live-tested.

[Changelog](CHANGELOG.md) · [Maintenance and releases](docs/维护与发布.md)
