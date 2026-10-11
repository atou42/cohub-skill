#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for tool in node npm codex cohub; do
  command -v "$tool" >/dev/null || { echo "Missing $tool. See README.md for prerequisites." >&2; exit 1; }
done
node -e 'if(Number(process.versions.node.split(".")[0])<24){console.error("Node.js 24+ is required.");process.exit(1)}'
npm ci --ignore-scripts
npm run build
node scripts/package.mjs
(cd release && npm ci --omit=dev --ignore-scripts)
codex plugin marketplace add "$PWD"
codex plugin add cohub-cards@cohub-cards-local
printf '\nCohub Cards installed. Restart Codex, then ask it to prepare a Cohub creation card.\n'
