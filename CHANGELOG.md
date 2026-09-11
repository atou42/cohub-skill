# Changelog

## Unreleased: cohub 2.0.0

- Consolidate App Developer into the single cohub package as an on-demand module.
- Add single-language installation, migration and conversation-language preservation.
- Separate stable release pointers from candidates; retain per-invocation checks with a tested read-only checker.
- Add capability preparation and acceptance guidance; retain optional Init cleanup and original-task recovery.


## Unreleased: cohub 1.2.1 / cohub-app-developer 1.1.1

- Add an on-demand At Cohub Space reference workflow to both skills and languages.
- Prefer skill instructions, CLI help, and local evidence; bound remote reading to unresolved questions and stop when answered or blocked.
- Preserve normal creative-source loading and read-only reference boundaries.

## Unreleased: cohub 1.2.0 / cohub-app-developer 1.1.0

- Replace the standalone AVG source with the game-skills Space in both languages.
- Route AVG, city builders, and fighting games directly to their package entries; use game-maker for other or unspecified game types.
- Preserve publish-only workflows. No remote Space or source data is deleted.

[English](CHANGELOG.md) | [简体中文](CHANGELOG.zh-CN.md)

Versions are independent per skill. English and Chinese editions share the same version.
Release tags identify the exact published revision for each skill.

## cohub-app-developer 1.0.0

Release date: 2026-09-11.

- Initial English and Chinese App Developer skill.
- Separate publishing, capability integration, management, and source-verification modules.
- Direct access to Style, independent AVG, Fandom, OKP search, and Character Traits Spaces.
- Preserve existing product plans and local development skills; optional capabilities do not expand scope.
- Read-only upstream version checks on every invocation; notify without automatic updates.

## cohub 1.1.0

Release date: 2026-09-11.

- Add installed version metadata and read-only upstream update notifications.
- Correct AVG to its independent Space and clarify Character Traits read access.
- Preserve existing generation, publishing, and removable setup workflows.

Earlier repository revisions were unversioned; no 1.0.0 release is implied for cohub.
