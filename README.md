# vscode-quiver

A standalone VS Code extension that embeds q.uiver in a VS Code webview.

Scope is intentionally minimal:
- Open q.uiver in a panel
- Apply webview compatibility UI patches
- Keep vendored q.uiver synced with upstream

Command:
- `vscode-quiver.openPanel`

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Vendored q.uiver

`vendor/quiver` is copied from upstream q.uiver with lightweight webview-focused patches.

To update vendored assets and reapply local compatibility patches:

```bash
pnpm vendor:quiver
```

For full sync plus validation:

```bash
pnpm sync:quiver
```

See `docs/maintenance.md` for patch and sync policy.
