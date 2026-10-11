# Cohub cards

Use the official installed Cohub CLI for generation and publishing. Generation uses one shared editable draft for the agent and the user. Store only drafts, selected reference files, and submission receipts as versioned local files. Cohub owns generation jobs and results. Do not add a Board, authentication store, generic shell tool, database, or independent job queue.

Keep UI mostly visual: large media, two visible actions at most, secondary information in details. Follow DESIGN.md: Cohub tokens, Geist, coral only for the primary action, focus and live states. Surface errors and invalid upstream shapes. Do not treat missing required fields as successful empty results.

Both user and agent must update drafts through the same revision check. Submission reads the saved revision and records its state before making the external request. Never resubmit an uncertain attempt. Preserve unsupported fields and show an error rather than silently dropping them.

Run `npm test` and `npm run build`. Before fixes, add and observe a failing regression test. Real generation and publishing receipts belong in ignored `evidence/`; never include account data or credentials in the plugin package.
