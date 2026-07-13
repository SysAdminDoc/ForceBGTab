# ROADMAP

Open work only. Done items live in the CHANGELOG.

## Next
- Firefox build (`manifest.firefox.json`, `browser` namespace shim). The core
  tabs logic is cross-compatible; needs an AMO-friendly manifest + packaging.
- Options page mirror of the popup for full-window rule management (import /
  export site rules as JSON).

## Considering
- Optional, `optional_permissions`-gated content script to support a modifier
  key (e.g. hold Alt) that inverts the background/foreground decision per click.
- Per-window enable/disable.
- Sync storage option (`chrome.storage.sync`) so rules follow the profile.
