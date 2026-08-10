# Changelog

All notable changes to ForceBGTab are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); this project uses semantic-ish
`vMAJOR.MINOR.PATCH` versions.

## [0.1.1] - 2026-07-13

### Changed
- Minimized the brief foreground flash when a tab is sent to the background. The
  new tab is now reverted to the opener at the earliest signal (`onCreated`, via
  `openerTabId`) instead of only after the delayed `onActivated` path, cutting
  the visible flash toward the ~1-frame platform minimum. The settle-time
  `onActivated` revert is retained as a reliable fallback (both target the same
  opener tab, so there is no double flash). The flash cannot be fully eliminated:
  Chromium activates and paints a link-opened tab before any extension code runs.

## [0.1.0] - 2026-07-13

Initial release. Clean-room, open-source Manifest V3 extension.

### Added
- Core focus management: new tabs opened from links, `target="_blank"`, or
  `window.open()` are sent to the background instead of stealing focus.
- Background-only architecture — only `tabs` and `storage` permissions; no
  content scripts, no host permissions, no page access.
- Global on/off toggle in the toolbar popup.
- Per-site rules (Default / Always background / Always foreground), with
  subdomain matching (a rule for `example.com` covers `docs.example.com`).
- Internal pages (`chrome://`, `edge://`, extension pages, the new-tab page)
  and opener-less tabs (e.g. Ctrl+T) are left in the foreground automatically.
- Catppuccin Mocha popup UI.
- Icon generator (`generate_icons.py`) and build script (`build.py`) producing
  an unpacked-loadable / Web-Store ZIP, plus an optional self-hosted CRX3.

## Roadmap archive — 2026-08-10 — ROADMAP.md

<details>
<summary>Original roadmap snapshot</summary>

```markdown
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
```

</details>
