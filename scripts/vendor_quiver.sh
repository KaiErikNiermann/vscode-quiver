#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

QUIVER_REPO_URL="${QUIVER_REPO_URL:-https://github.com/varkor/quiver}"
QUIVER_REF_DEFAULT="eee8a987ce91525d24b1928b6e86547cf82df0cb"
QUIVER_REF="${QUIVER_REF:-$QUIVER_REF_DEFAULT}"

OUTPUT_DIR="${REPO_ROOT}/vendor/quiver"

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: required tool '$1' is not installed" >&2
    exit 1
  fi
}

for tool in git curl unzip rsync make; do
  require_tool "${tool}"
done

WORK_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "${WORK_DIR}"
}
trap cleanup EXIT

SOURCE_DIR="${WORK_DIR}/quiver"

echo "==> Cloning q.uiver (${QUIVER_REPO_URL})"
git clone --filter=blob:none "${QUIVER_REPO_URL}" "${SOURCE_DIR}"
git -C "${SOURCE_DIR}" checkout --detach "${QUIVER_REF}"

COMMIT_SHA="$(git -C "${SOURCE_DIR}" rev-parse HEAD)"
COMMIT_DATE="$(git -C "${SOURCE_DIR}" show -s --format=%cI HEAD)"

echo "==> Building vendored web assets at commit ${COMMIT_SHA}"
# These are the static dependencies required by quiver's web app. We intentionally
# skip icon generation (ImageMagick) and service-worker build (Node/NVM) because
# they are not required for embedded extension webview usage.
make -C "${SOURCE_DIR}" src/KaTeX src/Workbox/workbox-window.prod.mjs

echo "==> Syncing assets into vendor directory"
mkdir -p "${OUTPUT_DIR}"
rsync -a --delete \
  --exclude ".git" \
  --exclude "tests" \
  --exclude "*.zip" \
  "${SOURCE_DIR}/src/" "${OUTPUT_DIR}/src/"

if [[ ! -f "${OUTPUT_DIR}/src/icon-192.png" ]]; then
  cp "${OUTPUT_DIR}/src/icon.png" "${OUTPUT_DIR}/src/icon-192.png"
fi
if [[ ! -f "${OUTPUT_DIR}/src/icon-512.png" ]]; then
  cp "${OUTPUT_DIR}/src/icon.png" "${OUTPUT_DIR}/src/icon-512.png"
fi
if [[ ! -f "${OUTPUT_DIR}/src/service-worker.js" ]]; then
  cat > "${OUTPUT_DIR}/src/service-worker.js" <<'EOF'
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", () => {});
EOF
fi

cp "${SOURCE_DIR}/LICENSE" "${OUTPUT_DIR}/UPSTREAM_LICENSE"
cp "${SOURCE_DIR}/README.md" "${OUTPUT_DIR}/UPSTREAM_README.md"

cat > "${OUTPUT_DIR}/VENDOR_METADATA.json" <<EOF
{
  "name": "q.uiver",
  "upstream_repo": "${QUIVER_REPO_URL}",
  "pinned_ref": "${QUIVER_REF}",
  "resolved_commit": "${COMMIT_SHA}",
  "resolved_commit_date": "${COMMIT_DATE}",
  "fetched_at_utc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

cat > "${OUTPUT_DIR}/NOTICE.md" <<'EOF'
# q.uiver Vendoring Notice

This directory contains vendored assets from the upstream q.uiver project:

- Upstream: https://github.com/varkor/quiver
- License: MIT (see `UPSTREAM_LICENSE`)
- Pinned revision metadata: `VENDOR_METADATA.json`

These assets are vendored for extension-local webview usage to avoid runtime remote dependencies.

To update:

```bash
bash scripts/vendor_quiver.sh
```

To pin a specific revision:

```bash
QUIVER_REF=<git-sha-or-tag> bash scripts/vendor_quiver.sh
```
EOF

echo "==> q.uiver vendor update complete"
echo "    Output: ${OUTPUT_DIR}"
echo "    Commit: ${COMMIT_SHA}"
