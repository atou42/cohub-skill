# Cohub Skill

A minimal skill for local agents to generate media and publish local websites with the Cohub CLI. Keep your existing development tools; use Cohub for generation and hosted links.

This is a personally maintained skill, not an official Cohub release.

## Install

Ask your skill-capable agent:

> Install the cohub skill from https://github.com/atou42/cohub-skill, directory skills/cohub, then guide me through its first-time setup. If I already have a cohub skill, compare the versions and preserve my customizations rather than overwriting it.

For manual installation, place the entire `skills/cohub` directory in your agent's supported skills directory. Keep `references/` alongside `SKILL.md`; do not overwrite an existing installation without reviewing it.

The skill includes a one-time init guide. Your agent checks for the CLI, installs it with your approval if missing, helps you log in, and verifies your identity. It does not bundle the CLI. To install and log in manually:

```bash
npm install -g @neta-art/cohub-cli
cohub auth login
```

After successful setup, the agent removes only the init guide and its marked entry section from an authorized, writable local installation. Failed setup keeps the guide for retry. Source checkouts, shared mounts, plugin caches, and read-only installations retain it; this public repository always ships the complete guide. The ongoing CLI and identity checks remain in the skill after cleanup.

## Use

- "Use Cohub to generate a background image and save it in this project's assets directory."
- "Publish this local website publicly with Cohub."
- "Generate the media, integrate it into this page, then publish the page publicly with Cohub."

The [entry point](skills/cohub/SKILL.md) routes to separate [generate](skills/cohub/references/generate.md) and [publish](skills/cohub/references/publish.md) instructions. Generation alone does not authorize public publication.

## Scope and Compatibility

Supports media generation and editing where the selected model provides them, plus local HTML or built static-site publishing. It does not cover internal Space administration, agent delegation, Actions, Commerce, or App SDK backend development. Publishing a static build does not deploy its backend.

Command parameters were checked against CLI 6.9.1. Local publishing requires at least 6.7.0; Home Space defaults are supported from 6.8.0. Always inspect the installed CLI's help and current model schemas. Live paid generation and end-to-end app publication were not exercised as part of packaging this skill.
