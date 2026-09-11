# Cohub Skill

[English](README.md) | [简体中文](README.zh-CN.md)

A minimal skill for local agents to generate media and publish local websites with the Cohub CLI. Keep your existing development tools; use Cohub for generation and hosted links.

This is a personally maintained skill, not an official Cohub release.

## Versioning

Current versions: **cohub 1.1.0** and **cohub-app-developer 1.0.0**. See the [changelog](CHANGELOG.md) for changes.

Each skill uses semantic versions independently: MAJOR for incompatible workflow or installation changes, MINOR for compatible capabilities, PATCH for fixes and clarifications. English and Chinese editions advance together. Unversioned older installations remain version-unknown.

For a release, update both editions' `SKILL.md metadata.version` and `version.json`, the root `versions.json`, and both changelogs together. Check version agreement and links before publishing. After authorized publication, tag each skill as `cohub-v1.1.0` or `cohub-app-developer-v1.0.0` respectively; never move an existing release tag. Do not label a local candidate as released before publication succeeds. Source Space content updates alone need no skill release.

## Available Skills

| Skill | Purpose | English | Chinese |
|---|---|---|---|
| `cohub` | Lightweight media generation and local publishing | [Install source](skills/cohub/SKILL.md) | [中文版](zh-CN/skills/cohub/SKILL.md) |
| `cohub-app-developer` | Adapt existing projects into Cohub Apps and optionally integrate runtime generation, Actions, Spaces, and management | [Install source](skills/cohub-app-developer/SKILL.md) | [中文版](zh-CN/skills/cohub-app-developer/SKILL.md) |

Install either skill independently, or both. App Developer preserves your existing product-design and development workflow; it does not restart requirements discovery. It explains relevant Cohub options without adding features you did not choose.

To install App Developer, ask your agent:

> Install cohub-app-developer from https://github.com/atou42/cohub-skill, directory skills/cohub-app-developer. Preserve any existing customizations. Check the CLI and guide me through login if needed.

For Chinese, use `zh-CN/skills/cohub-app-developer`. Install only one language per skill name, keeping the entire directory including `references/`. App Developer's setup instructions remain available; it does not use the removable init flow described below for `cohub`.

Example requests: "Publish my existing project as a Cohub App without redesigning it" or "Explain how this App could use runtime generation, then integrate only the option I choose."

App Developer references current files in the Cohub source Space; access is account-dependent. It does not require Feishu access. Both editions were checked for structure and reference links; live publication and paid execution have not been tested for this package.

## Install

Both skills check the public upstream `versions.json` at each invocation and compare it with their installed `version.json`. New releases trigger a notice, never an automatic installation or overwrite. Failed checks are reported without blocking the task. This check survives init cleanup. Maintainers keep English and Chinese versions in sync.

App Developer also directly loads the selected Style, independent AVG, Fandom, OKP search, or Character Traits Space through its [creative modules](skills/cohub-app-developer/references/creative-spaces.md). Website onboarding is not part of this change.

The following sections describe the lightweight `cohub` skill.

Ask your skill-capable agent:

> Install the cohub skill from https://github.com/atou42/cohub-skill, directory skills/cohub, then guide me through its first-time setup. If I already have a cohub skill, compare the versions and preserve my customizations rather than overwriting it.

For manual installation, place the entire `skills/cohub` directory in your agent's supported skills directory. Keep `references/` alongside `SKILL.md`; do not overwrite an existing installation without reviewing it.

For Chinese instructions, install `zh-CN/skills/cohub` instead. Both editions use the skill name `cohub`; install only one. When switching languages, preserve local customizations and completed setup rather than blindly replacing the installed files.

The skill includes a one-time init guide. Your agent checks for the CLI, installs it with your approval if missing, helps you log in, and verifies your identity. It does not bundle the CLI. To install and log in manually:

```bash
npm install -g @neta-art/cohub-cli
cohub auth login
```

After successful setup, the agent removes only the init guide and its marked entry section from an authorized, writable local installation. Failed setup keeps the guide for retry. Source checkouts, shared mounts, plugin caches, and read-only installations retain it; this public repository always ships the complete guide. The ongoing CLI and identity checks remain in the skill after cleanup.

## Use

- "Show me Cohub's creative capabilities, then help me choose a workflow."
- "Use Cohub to generate a background image and save it in this project's assets directory."
- "Publish this local website publicly with Cohub."
- "Generate the media, integrate it into this page, then publish the page publicly with Cohub."

The [entry point](skills/cohub/SKILL.md) contains the creative capability table and routes to separate [generate](skills/cohub/references/generate.md) and [publish](skills/cohub/references/publish.md) instructions. Generation alone does not authorize public publication.

## Direct Capability Access

Style, AVG, Fandom, OKP search, and Character Traits are listed directly in `SKILL.md`, with their purpose, source Space ID, and entry path. After authentication, the agent reads the chosen source directly. There is no intermediate directory or catalog-version negotiation, and upstream packages are not bundled here.

Source Spaces and external services retain their own permissions and dependencies. Character Traits was opened for anonymous reading, not execution; an AVG build needs its runtime and assets, not just a text instruction. There is no paid gate or guarantee that every signed-in user can access every source. Adding capabilities or changing entry paths requires updating the skill; changes within a source do not. The former directory Space is retained but no longer used by this skill.

## Scope and Compatibility

Supports media generation and editing where the selected model provides them, local HTML or built static-site publishing, and direct access to the listed creative sources. It does not cover internal Space administration, agent delegation, Actions, or Commerce. Capability-specific backends are not deployed by this bootstrap skill. Publishing a static build does not deploy its backend.

Command parameters were checked against CLI 6.9.1. Local publishing requires at least 6.7.0; Home Space defaults are supported from 6.8.0. Always inspect the installed CLI's help and current model schemas. Live paid generation and end-to-end app publication were not exercised as part of packaging this skill.
