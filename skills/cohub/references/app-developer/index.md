# Cohub App Developer


The user and their local agent decide what to build. This module brings their work into Cohub and explains what Cohub can add.

## Boundaries

- Preserve the project's structure, stack, design, and approved plan. Existing local skills continue to own general development, aesthetics, and product decisions; this skill supplies Cohub-specific knowledge.
- Do not restart requirements interviews, require brainstorming, or turn publishing into product redesign. Ask only about missing information that materially affects hosting, integration, or external actions.
- Separate required adaptation from optional enhancements. Explain recommendations, costs, and limitations without automatically adding generation, login, monetization, or management UI.
- Information is not authorization. Creating remote resources, publishing, expanding permissions, purchasing, and running paid tasks remain subject to the user's current authorization, not to loading this skill.

## Workflow

1. Inspect the existing project or plan and identify whether it needs publishing, runtime integration, or management. Cloud development is not a prerequisite.
2. Load only the relevant modules below. Establish SDK/API behavior from the relevant instructions, command help, and available local docs/types. If insufficient, use [At Cohub Space source verification](sources.md) for targeted current documentation, not a default Space scan.
3. Briefly explain that Cohub is more than hosting: App visitors can generate images, video, audio, or use AI conversations at runtime. Do not repeat this when the user already understands or has declined it. Mention one relevant option without blocking an already approved publication.
4. When relevant, explain authorization, access, versions, analytics, or entitlement options in terms of what they enable. Do not substitute scope lists for explanations or make the user's choices for them.
5. Implement the selected path, verify it using the relevant module, and report actual status, returned links, and unfinished work.

## Modules

| Task | Read |
|---|---|
| Turn existing HTML, a build, a service, or a clear development plan into an App | [Integration and publishing](publishing.md) |
| Discover or integrate generation, conversations, Actions, Spaces, or desktop capabilities | [Capability discovery and integration](capabilities.md) |
| Sharing, authorization, cost ownership, commerce, versions, and analytics | [Operations and management](management.md) |
| Initial environment setup, or insufficient evidence for an interface or next action | [Source verification](sources.md); setup alone does not require reading the Space |

Modules work independently. Static publishing does not require SDK integration or learning Space administration.

## When Instructions Are Insufficient

If this skill and relevant CLI help cannot establish the next action, evidence conflicts, or a problem persists after a targeted correction, use the At Cohub Space procedure in [source verification](sources.md). Read only what answers the specific question, then return to the task. This is not an every-invocation step; selected creative sources still load normally. Explicit login or permission errors alone do not trigger Space research.

## Completion

Judge the actual assignment: preserve the existing work's core behavior, verify selected Cohub capabilities, respect the agreed publication and permission scope, and explain access and updates. A page opening is not evidence that generation, authorization, or management works.
