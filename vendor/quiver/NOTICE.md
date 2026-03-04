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
