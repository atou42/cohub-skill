---
name: cohub
description: Use the Cohub CLI to generate or edit images, video, speech, and music for local agents, and publish local websites or apps as stable links. Use when the user requests Cohub publishing, Cohub generation, or a combination of both; not for internal Space administration, cross-agent delegation, or App backend development.
---

# Cohub

Keep working locally with the user's familiar development tools. Use Cohub for generation and published links without requiring a new development environment or knowledge of platform internals.

## Read by Task

- Publish local HTML, a website, or an app, or update a published version: read [Publish](references/publish.md).
- Generate or edit images, video, speech, or music: read [Generate](references/generate.md).
- Generate assets and then publish a page: read Generate first, then Publish. Generation alone does not authorize public publication.

## Shared Rules

1. On first use, check `cohub --version`; use the current subcommand's `-h` as the authority for flags. These parameters were checked against CLI 6.9.1. Local publishing requires at least 6.7.0; Home Space defaults are supported from 6.8.0. Report version mismatches rather than guessing legacy commands or upgrading automatically.
2. If the CLI is missing, explain `npm install -g @neta-art/cohub-cli`. Follow the environment's installation authorization rules; activating this skill does not authorize installation.
3. Before execution, confirm identity with `cohub auth whoami --json`. If unauthenticated, guide the user through `cohub auth login` and wait when user interaction is required. Distinguish network, service, and permission failures from authentication failures.
4. When the user specifies a Space, use `cohub -s <spaceId> ...`. Otherwise preserve the current `COHUB_SPACE_ID` context, with the CLI falling back to Home Space when unset. Do not clear the environment, guess IDs, or create another Space. Clarify uncertain ownership when it affects publication or charges.
5. Read actual response fields with `--json`. Preserve original errors and existing task IDs on failure. Do not expose tokens or authentication files, change permissions to proceed, or overwrite user files.
6. Do not request repeated approval for generation or publication the user explicitly requested. Additional cost scale, wider public exposure, or overwriting an unidentified target is outside that authorization. Check whether the CLI may auto-update in the background; use `COHUB_CLI_AUTO_UPDATE=0` when keeping this run's version stable, without permanently changing configuration.

## Boundaries

Maintain only the publish and generate workflows. Do not load internal organizational knowledge or add Actions, Commerce, App SDK backend development, or experimental capabilities. Explain when a request exceeds this skill's scope; a generic shell command does not substitute for authorization.

Deliver actual links or local files, necessary task identifiers, and any unfinished work. Successful command submission does not prove the result is usable.
