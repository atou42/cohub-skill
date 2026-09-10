# Authenticated Capability Directory

## Release Design

The public skill keeps setup, generation, publication, and one small directory connector in English and Simplified Chinese. A separate Cohub Space holds the live bilingual catalog and four source guides. Source packages are not mirrored into this Git repository. Existing local runtime skill installations are not modified by this release.

Directory: `965d7601-25d8-4fd7-a006-7d4f38085bdf`.
Initial version: `2026-09-11.1`.
Scope: Style, AVG, Fandom, OKP search. No source permission changes, bulk package migration, paid gate, user-project uploads, or paid creation runs.

The directory is configured with signed-in `guest` and anonymous `null`. It is a read-only source, never a generation or publication destination. Source access remains independent. In particular, Style requires explicit source access; advertising it is not a grant of access.

## Maintenance

Maintain `README.md`, `catalog.json`, and the selected `guides/*.md` in the directory Space, not in this public repository. Keep consumer instructions free of credentials, internal conversations, local paths, and private project data. Update each guide's release marker together with the catalog version; publish the catalog last and verify readback. Agents stop on inconsistent versions rather than combining them silently.

Use a Cohub checkpoint to retain a reviewed release. This connector reads live workspace files directly; a mounted mod may follow a different checkpoint lifecycle. Do not assume editing an unrelated source updates all consumer mounts. Before changing access or adding paid execution, review and test the new scope separately.

## Acceptance Commands

```bash
node --test tests/capabilities.test.mjs
node scripts/check-capabilities.mjs --live
cohub -s 965d7601-25d8-4fd7-a006-7d4f38085bdf spaces access get --json
git diff --check
```

The offline suite checks catalog shape, unknown versions/statuses, missing translations, duplicate IDs, unsafe paths, shell metacharacters, guide-version mismatch, Markdown links, bilingual commands, and both editions after simulated init cleanup. The live check reads the directory and all four guides using the current account, and probes the file API and public CDN without credentials. It neither executes source scripts nor performs generation.

## Verification Status

Verified on 2026-09-11 (Asia/Shanghai):

| Check | Observed result |
| --- | --- |
| Offline suite | 15 tests passed |
| English and Chinese skill validation | Both passed the skill-creator validator |
| Authenticated directory read | Catalog, README, and all four guides readable; schema and release markers match |
| Access policy readback | `signed_in_user: guest`, `anonymous_user: null` |
| Anonymous file API read | HTTP 401, no catalog content returned |
| Anonymous file API write | HTTP 401 with `unauthorized`; no probe file created |
| Public CDN catalog path | HTTP 404; no public catalog mirror published |
| Missing directory guide | CLI exit 1, `file or directory not found` |
| Source access evidence | Current account reads AVG and OKP as guest; Style remains restricted and requires explicit source access |
| Directory checkpoint | Completed; `d734cd8a-8ced-4512-9bdf-3d7b3b6eb501` |

Directory packaging and current-account retrieval: **PASS**. Full external onboarding: **PARTIAL**. No independent fresh non-member identity was available to test signed-in access or denial of guest writes on this new Space. Owner reads and an access-policy response do not prove that boundary. Source packages, external OKP authentication, and complete paid creative workflows were not exercised by this release. In particular, a new user without Style source access cannot use that entry yet.

The checker is a maintainer acceptance tool, not a runtime security sandbox. Its malformed-catalog tests validate the documented contract; they do not prove that every third-party agent will obey instructions. Runtime authorization remains the responsibility of Cohub and the source services.
