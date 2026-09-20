# Uploading Many Small Files

Read only when transferring many small files into a Space workspace. When per-file uploads are costly, prefer packaging the required directory as a ZIP, uploading one archive, and extracting it in the destination workspace. Already-compressed files may not shrink much; the main benefit is fewer upload requests.

## Default switching threshold

Count only files actually needed for this transfer after exclusions, including required hidden files but excluding directories:

- Fewer than 100 files: upload directly by default.
- 100 files or more: prefer ZIP upload followed by extraction, subject to the permissions, tools and capacity checks below.
- Fewer than 100 files, but direct uploads are observably slow or repeatedly rate-limited: consider packaging earlier. Check existing upload state first to avoid overwrites or duplicate transfers.

100 is an initial operating rule, not a measured optimum or a platform limit. Handle large files and archive size limits according to actual transfer constraints; file count alone must not force packaging.

## Upload and verification

- Confirm the user's target Space, upload and extraction directories, and remote execution access. Never use a read-only reference Space as the destination. If execution permission or an extraction tool is missing, explain the limitation; upload success is not extraction success.
- Exclude `.git`, dependencies, caches, credentials and unrelated files. Preserve required hidden files, directory structure and assets; inspect relative archive paths. Check size limits and free space, including additional space for extraction.
- Check current `spaces files upload --help` and `run --help`. Upload to a fresh temporary directory without overwriting existing archives. Substitute verified targets and paths:
  ```sh
  cohub -s <target-space-id> spaces files upload ./bundle.zip --dir <fresh-temporary-directory> --json
  ```
- Confirm the returned path and archive integrity, then use an available extraction tool through `cohub -s <target-space-id> run --command '<extraction command>'` to extract into a new directory. Check that absolute paths, `..` entries and symlinks cannot write outside the destination; do not force overwrites on conflicts. If executable permissions or symlinks matter, verify they survive the chosen archive tools rather than assuming ZIP preserves everything.
- Verify the extracted file inventory, count and critical contents; compare checksums when stronger integrity is needed. Check entry points and relative assets before continuing the original task. On failure, retain the archive and known state and resume from the failed step instead of repeatedly uploading everything. Clean up only this task's temporary files after successful verification and when no longer needed.

**Direct local website publication still uses `apps publish --source local --dir`.** Do not force a workspace upload just to apply this optimization, or treat a ZIP as a runnable webpage. Extracted workspace directories still require the normal publishing workflow.
