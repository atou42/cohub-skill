# Cohub Skill

[English](README.md) | [简体中文](README.zh-CN.md)

Let your local agent work with Cohub on games, websites and small apps, media, characters and publishing. Optionally organize projects with Spaces, connect supported local conversations, or add visitor-time generation and Actions. Preserve your design, stack and local workflow.

Personally maintained, not an official Cohub distribution.

## Install One Skill

Install **cohub** only. App Developer is now an internal on-demand module, not another skill to choose or install.

Choose one instruction language: [English](skills/cohub/SKILL.md) or [简体中文](zh-CN/skills/cohub/SKILL.md). Functionality is identical. **Do not install both.** Instruction language does not change conversation language.

## Install

For the latest stable release, follow [versions.json on main](https://raw.githubusercontent.com/atou42/cohub-skill/main/versions.json), which points to the verified release tag and commit. Install from that tag, not a potentially newer main checkout.

Ask your agent:

> Install the latest stable English cohub from https://github.com/atou42/cohub-skill. First inspect the skill directories you actually load for existing cohub or cohub-app-developer installations and preserve customizations. Do not install both languages. Report the installed version, instruction language and location without changing our conversation language. Guide CLI installation and login only if needed.

Select the verified stable tag's skills/cohub directory; use main only for explicitly requested development testing. Keep references, scripts and version.json. See [installation and migration](skills/cohub/references/installation.md) for existing installations, language changes and legacy App Developer migration. Old installations are not deleted without authorization.

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

Automated checks cover package structure, language consistency, self-contained links and update failure paths. Agent scenarios are recorded in [behavior acceptance](docs/行为验收.md); remote capabilities, paid generation and visitor flows are not claimed fully live-tested.

[Changelog](CHANGELOG.md) · [Maintenance and releases](docs/维护与发布.md)
