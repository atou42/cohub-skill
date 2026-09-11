---
name: cohub-app-developer
metadata:
  version: "1.1.0"
description: Adapt existing projects, clear ideas, or plans into Cohub Apps; explain and optionally integrate runtime generation, Actions, Spaces, desktop features, and management. Use for Cohub App development, integration, publishing, and management, not as a replacement for product-design or general development skills.
---

# Cohub App Developer

## Every Invocation: Check for Updates

Read and follow [Update check](references/updates.md) before the workflow. Check upstream every invocation; notify only, never update the installation automatically.

The user and their local agent decide what to build. This skill brings their work into Cohub and explains what Cohub can add.

## Boundaries

- Preserve the project's structure, stack, design, and approved plan. Existing local skills continue to own general development, aesthetics, and product decisions; this skill supplies Cohub-specific knowledge.
- Do not restart requirements interviews, require brainstorming, or turn publishing into product redesign. Ask only about missing information that materially affects hosting, integration, or external actions.
- Separate required adaptation from optional enhancements. Explain recommendations, costs, and limitations without automatically adding generation, login, monetization, or management UI.
- Information is not authorization. Creating remote resources, publishing, expanding permissions, purchasing, and running paid tasks remain subject to the user's current authorization, not to loading this skill.

## Workflow

1. Inspect the existing project or plan and identify whether it needs publishing, runtime integration, or management. Cloud development is not a prerequisite.
2. Load only the relevant modules below. Before implementing SDK/API calls, use [source verification](references/sources.md) to consult current documentation rather than guessing interfaces.
3. Briefly explain that Cohub is more than hosting: App visitors can generate images, video, audio, or use AI conversations at runtime. Do not repeat this when the user already understands or has declined it. Mention one relevant option without blocking an already approved publication.
4. When relevant, explain authorization, access, versions, analytics, or entitlement options in terms of what they enable. Do not substitute scope lists for explanations or make the user's choices for them.
5. Implement the selected path, verify it using the relevant module, and report actual status, returned links, and unfinished work.

## Modules

| Task | Read |
|---|---|
| Use Style, Game Maker, Fandom, OKP search, or Character Traits | [Creative Spaces](references/creative-spaces.md) |
| Turn existing HTML, a build, a service, or a clear development plan into an App | [Integration and publishing](references/publishing.md) |
| Discover or integrate generation, conversations, Actions, Spaces, or desktop capabilities | [Capability discovery and integration](references/capabilities.md) |
| Sharing, authorization, cost ownership, commerce, versions, and analytics | [Operations and management](references/management.md) |
| Initial setup, API implementation, new capabilities, conflicting docs, or permission errors | [Source verification](references/sources.md) |

Modules work independently. Static publishing does not require SDK integration or learning Space administration.

## Completion

Judge the actual assignment: preserve the existing work's core behavior, verify selected Cohub capabilities, respect the agreed publication and permission scope, and explain access and updates. A page opening is not evidence that generation, authorization, or management works.
