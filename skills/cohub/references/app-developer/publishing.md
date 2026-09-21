# Integration and Publishing

## Choose Hosting

Preserve existing work and explain only choices that affect delivery.

| Existing output or constraint | First option to consider |
|---|---|
| Standalone HTML | File App; include relative dependencies or use a directory bundle |
| Static site or frontend build | Directory App containing `index.html`, using the existing build process |
| Persistent server required | Assess whether the existing backend can remain; consider a port App only for a Cohub Sandbox service |
| Document, media, or Board | Current native file/Board preview; do not rebuild it as a website just to publish |
| Clear plan, not yet implemented | Keep the user's local development workflow and integrate Cohub where needed |

File/directory/port are hosting targets; window/overlay/embed are presentation choices. Do not treat them as one option set or turn every page into an overlay.
A port means a supported public Cohub Sandbox port, not local localhost; do not promise permanent process uptime. Static publishing does not automatically host SSR, databases, or local backends.

## Publish Local Work

1. When rebuilding is needed, use the project's existing build process and checks relevant to the change; otherwise inspect the existing build output directly. Exclude `.env`, credentials, development files, and private data. Do not publish the repository root as dist.
2. Check `cohub apps publish --help`. Establish the account, target Space, slug, visibility, and whether this updates an existing App. Do not overwrite an unrelated same-name App. If no destination is specified, establish the CLI's actual default; never use the reference Space as the default.
   Tell the user the final link name (slug) is customizable and show the chosen name. If unspecified, choose a readable name and proceed. Do not rename an existing link unprompted; explain address changes and do not promise automatic redirects.
3. Execute only within approved publication scope. Replace verified targets in these templates; use `public` only when the user chose public access:

```sh
cohub -s <target-space-id> apps publish <slug> --source local --file ./index.html --visibility public --json
cohub -s <target-space-id> apps publish <slug> --source local --dir ./dist --visibility public --json
```

Static Apps normally need no `--app-scope`. Direct local publishing does not require uploading the project into the Space workspace first.
The SDK's `targetRef` is not the same local-path interface as CLI `--source local`.

4. Read the returned App ID, URL, and status. Consult `cohub apps get --help` and confirm the result. Do not construct a success URL yourself or substitute a CDN asset URL for the App entry point.
5. Distinguish source edits, settings edits, and publishing a new version. Editing source does not update the published version. For local updates, republish the local build rather than blindly running `publish-version` on an old workspace target.

## Verify

Select applicable user journeys from [Publication experience](../publication-experience.md), then apply these Cohub integration checks.

- Open the returned App link and check key interactions, relative assets, layouts for the promised devices, and existing routes. HTTP 200 on an error shell is insufficient.
- Verify SDK integrations in a real App runtime. Localhost/file previews cannot establish that authorization, generation, or commerce works. Without publication authorization, report this part as unverified.
- If visitor behavior matters, test the agreed anonymous or other signed-in-user path. Do not pass off an owner session as a visitor or use an unauthorized account.
- At every successful publication handoff, including updates to an existing App and republication after fixes, read [Publication card](../publication-card.md) and return the link and ten attributes. Do not load it during integration, before publication, or while diagnosing failures. Append a reusable update command when useful. On failure, preserve errors and remote state rather than deleting the App or creating another Space to retry.

Before updating an App, read its current identity, target, and visibility. Preserve visibility unless the user explicitly requests a change; the public example is not permission to widen access.
