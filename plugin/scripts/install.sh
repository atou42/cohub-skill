#!/usr/bin/env bash
set -euo pipefail
installer_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
command -v node >/dev/null || { echo 'Node.js 24+ is required.' >&2; exit 1; }
exec node "$installer_dir/install.mjs" "$@"
