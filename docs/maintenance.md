# Maintenance Guide

This project intentionally embeds upstream q.uiver with a minimal VS Code wrapper.

## What is vendored

- Upstream source: `vendor/quiver/src/*`
- Upstream metadata and notices:
  - `vendor/quiver/UPSTREAM_LICENSE`
  - `vendor/quiver/UPSTREAM_README.md`
  - `vendor/quiver/VENDOR_METADATA.json`
  - `vendor/quiver/NOTICE.md`

## Local patch policy

Keep local changes small and only for VS Code webview compatibility.

Current local patches live in `patches/quiver/`:

1. `0001-vscode-webview-service-worker-guard.patch`
: disable service-worker registration for VS Code webview protocols.
2. `0002-vscode-webview-bridge.patch`
: add host bridge hooks and storage hardening used by the VS Code panel wrapper.
3. `0003-vscode-webview-pointer-viewport-coordinates.patch`
: align pointer drag coordinates with the visible viewport in VS Code webviews.

## Syncing with upstream q.uiver

Use the sync script:

```bash
pnpm sync:quiver
```

This runs, in order:

1. `scripts/vendor_quiver.sh`
2. `scripts/apply_quiver_patches.sh`
3. `pnpm lint && pnpm test && pnpm build`

If the pinned ref should change, set `QUIVER_REF` when vendoring:

```bash
QUIVER_REF=<git-sha-or-tag> pnpm vendor:quiver
```

Then update/refresh patch files in `patches/quiver` if upstream changed targeted sections.
