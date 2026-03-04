#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PATCH_DIR="${REPO_ROOT}/patches/quiver"

if [[ ! -d "${PATCH_DIR}" ]]; then
  echo "error: patch directory not found: ${PATCH_DIR}" >&2
  exit 1
fi

shopt -s nullglob
patches=("${PATCH_DIR}"/*.patch)
shopt -u nullglob

if [[ ${#patches[@]} -eq 0 ]]; then
  echo "error: no patch files found in ${PATCH_DIR}" >&2
  exit 1
fi

for patch_file in "${patches[@]}"; do
  if git -C "${REPO_ROOT}" apply --check "${patch_file}" >/dev/null 2>&1; then
    echo "==> Applying $(basename "${patch_file}")"
    git -C "${REPO_ROOT}" apply "${patch_file}"
    continue
  fi

  if git -C "${REPO_ROOT}" apply --reverse --check "${patch_file}" >/dev/null 2>&1; then
    echo "==> Already applied $(basename "${patch_file}")"
    continue
  fi

  echo "error: patch failed preflight checks: ${patch_file}" >&2
  exit 1
done
