#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

bash "${REPO_ROOT}/scripts/vendor_quiver.sh"
bash "${REPO_ROOT}/scripts/apply_quiver_patches.sh"

if command -v pnpm >/dev/null 2>&1; then
  echo "==> Running validation"
  (
    cd "${REPO_ROOT}"
    pnpm lint
    pnpm test
    pnpm build
  )
fi
