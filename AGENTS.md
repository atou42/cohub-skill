# Cohub source and distributions

This repository is the authoring source for Cohub Skill and its optional plugin.

- Author the complete standalone editions in `skills/cohub` and `zh-CN/skills/cohub`. Keep their behavior equivalent and each edition self-contained. They must work without the plugin or its Node dependencies.
- `plugin/` owns shared-draft tools and UI only. Do not introduce a second author-written Skill there. Packaging copies one complete canonical edition byte for byte; external mode carries it without registering another entry.
- Preserve the public Skill install paths, `versions.json` schema, existing immutable tags, and the legacy plugin identity `cohub-cards@cohub-cards-local`. Preserve the draft state directory and protocol identifiers.
- A release cannot advertise an uncreated tag. Publish and verify the primary release before updating stable pointers, then update the compatibility bridge in the old `cohub-plugin` repository.
- Never fix duplicate discovery by deleting user skills, overwriting customized installations, or silently changing global configuration. Report all locations inspected and stop on ambiguous or damaged state.
- Before fixes, reproduce a meaningful failure. Run root `node --test tests/*.test.mjs`, all three sync/build `--check` scripts, and `npm test` plus `npm run build` in `plugin/`. Install/upgrade tests must use isolated profiles with no paid generation.
- Local runtime mounts and the personal `codex-skills-shared` repository are consumers, not another product authoring source.

See `plugin/AGENTS.md` for generation and UI invariants.
