# Contributing

## Where to report issues

This extension is a thin wrapper that packages
[q.uiver](https://github.com/varkor/quiver) into a VS Code webview and applies
a small set of patches for webview compatibility. It does **not** reimplement any
diagram editing logic.

### Issues that belong here

- Cursor/pointer alignment problems inside the webview
- Layout or styling glitches caused by the VS Code embedding (topbar, toolbar
  offset, panel theming, etc.)
- Middle-click pan, Ctrl+scroll zoom, or other input handling added by this
  extension
- Extension activation, command registration, or VSIX packaging problems
- Anything related to files under `src/`, `patches/`, or the webview bridge
  scripts in `webview-html.ts`

### Issues that belong upstream

Everything else -- arrow rendering, label editing, tikz-cd import/export, the
side panel UI, keyboard shortcuts defined by q.uiver, KaTeX rendering, and
general diagram behaviour -- is upstream code. Please report those at:

> **https://github.com/varkor/quiver/issues**

If you're unsure, open an issue here and we'll triage it.

## Development setup

```sh
pnpm install
pnpm build
# Run tests
pnpm test
# Lint
pnpm lint
```

Press **F5** in VS Code to launch an Extension Development Host with the
extension loaded.

## Vendor workflow

Upstream q.uiver sources live in `vendor/quiver/` and are not edited directly.
Local fixes are maintained as patch files in `patches/quiver/`.

```sh
# Pull latest upstream and re-apply patches
pnpm sync:quiver
```

When adding a new patch, make your changes in `vendor/quiver/src/`, then
generate a combined diff against the previous patched state:

```sh
git diff HEAD~1 vendor/quiver/src/ui.mjs > patches/quiver/000N-description.patch
```

## Commit style

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(webview): add middle-click to pan
fix(webview): reset body padding to fix pointer offset
ci(release): add release workflow
```
