# Publish Local Artifacts

## Identify the Artifact and Target

- Use `--file` for a single HTML file and `--dir` for a site directory containing `index.html`. When a build is needed, inspect the project configuration and use its existing build command; do not assume the output is named `dist`.
- Publish build output, not the entire source tree, `.git`, dependencies, or development configuration. Ensure referenced images, fonts, scripts, and styles are included, with no local absolute paths or local-only URLs.
- Check for secrets, internal links, and unsanitized content. Identify affected files before proceeding; do not silently sanitize user source files.
- Reuse the user-specified or existing slug. For a new app, choose a short, readable project name rather than a random UUID. Check the target Space with `cohub apps ls --json` for an App with the same slug. If ownership of the update target is unclear, confirm rather than overwrite.
- An explicit request for public publication authorizes publishing; previewing, testing, or generating alone does not. Use `--visibility space` for Space-only access and `--visibility public` when creating a public App. Before updating, read `cohub apps get <appId> --json` and preserve existing visibility unless the user requests a change.

## Publish and Update

Replace the slug, paths, and visibility with actual values. When the user specifies a Space, add `-s <spaceId>` after `cohub`.

```bash
cohub apps publish <slug> --source local --file ./index.html --visibility public --json
cohub apps publish <slug> --source local --dir ./dist --visibility public --json
```

Always pass `--source local` for this workflow. Do not pass local paths to the workspace source; uploading to a Space workspace first is unnecessary. Choose exactly one of `--file` and `--dir`. This workflow does not publish a local development-server port.

For updates, rebuild and run `apps publish` with the same Space and slug and the new local artifact. `apps publish-version` does not mean re-uploading local files and is not a substitute. A static directory publication does not fully deploy an app that depends on a backend, database, or environment variables; report missing runtime requirements.

## Verify the Actual Result

1. Check the exit status and JSON. Record the actual App ID and returned URL rather than deriving a link from the slug. If only a task ID is returned, inspect the task using current help; do not claim publication is complete.
2. Open the returned URL. Check for error pages, unexpected login walls, blank content, and failed images, scripts, or styles. Verify within the requested visibility scope; do not make the app public just to inspect it.
3. For updates, confirm the App identity and link are unchanged and the content is updated. Report unverified results when CDN delays or unavailable browser access prevent confirmation. Command success does not replace visual verification.

On failure, inspect the original task or App state before creating anything again. If identity configuration lacks a username or Space slug, explain the required public identity and ask the user to provide or confirm it; do not silently change their profile.

Return the actual clickable link and, when useful, a brief description of the published artifact. Logs or URL prefixes are not delivery links.
