# Cohub Skill

[English](README.md) | [简体中文](README.zh-CN.md)

Let your local agent use Cohub for media, characters, games and publishing, with optional visitor-time generation, Actions and management. Preserve your design, stack and local workflow.

Personally maintained, not an official Cohub distribution.

## Install One Skill

Install **cohub** only. App Developer is now an internal on-demand module, not another skill to choose or install.

Choose one instruction language: [English](skills/cohub/SKILL.md) or [简体中文](zh-CN/skills/cohub/SKILL.md). Functionality is identical. **Do not install both.** Instruction language does not change conversation language.

## Install

This checkout is the **unreleased 2.0.0 development candidate**. [versions.json](versions.json) points to stable releases; the latest stable cohub is still 1.1.0 and does not contain this consolidation. Do not recommend main as a stable upgrade.

Ask your agent:

> Install the latest stable English cohub from https://github.com/atou42/cohub-skill. First inspect the skill directories you actually load for existing cohub or cohub-app-developer installations and preserve customizations. Do not install both languages. Report the installed version, instruction language and location without changing our conversation language. Guide CLI installation and login only if needed.

To explicitly test this development candidate, select main's skills/cohub directory. Keep references, scripts and version.json. See [installation and migration](skills/cohub/references/installation.md) for existing installations, language changes and legacy App Developer migration. Old installations are not deleted without authorization.

## Use

- "Explain the creative capabilities." A question does not trigger login, generation or publication.
- "Generate background images for this project without publishing it."
- "Publish this finished game without rebuilding it."
- "Add visitor image generation to this App, preserving its design."

Setup checks the CLI, guides login as needed and reports identity. Suggest one or two context-relevant next actions without automatically generating paid media or publishing. Authorized local Init cleanup remains optional; source and shared installations retain it. An onboarding website is not implemented.

## Environment and Boundaries

Requires a local agent with filesystem and command execution. CLI setup needs Node.js/npm; remote capabilities need network access and their respective permissions. Capability questions do not require CLI readiness. Command examples were checked against CLI 6.9.1; installed help remains authoritative.

Style, Game Maker, Fandom, OKP and Character Traits route directly to their sources. Permissions, authentication and dependencies are independent; readable instructions do not establish runtime readiness. See [preparation and acceptance](skills/cohub/references/preparation.md).

Each invocation checks stable releases, notifying without automatic updates. Upgrades preserve instruction language and customizations. Generation does not authorize publication; source Spaces are not write destinations. No internal governance or cross-agent delegation.

## Validation and Maintenance

Automated checks cover package structure, language consistency, self-contained links and update failure paths. Agent scenarios are recorded in [behavior acceptance](docs/行为验收.md); remote capabilities, paid generation and visitor flows are not claimed fully live-tested.

[Changelog](CHANGELOG.md) · [Maintenance and releases](docs/维护与发布.md)
