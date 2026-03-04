# vscode-quiver

`vscode-quiver` embeds [q.uiver](https://github.com/varkor/quiver) directly in a VS Code webview.

## Scope

This extension is intentionally minimal:

- Open q.uiver in a VS Code panel.
- Apply lightweight compatibility patches required for webview execution.
- Keep vendored q.uiver assets reproducibly synced with upstream.

It does not implement editor apply/export/synchronization workflows.

## Command

- `vscode-quiver: Open Panel` (`vscode-quiver.openPanel`)

## Vendoring and Patches

Vendored assets live under `vendor/quiver`.

Local compatibility patches are tracked in `patches/quiver` and re-applied using:

```bash
pnpm vendor:quiver
```

For full sync and validation:

```bash
pnpm sync:quiver
```
