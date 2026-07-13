# Changelog

All notable changes to ForceBGTab are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); this project uses semantic-ish
`vMAJOR.MINOR.PATCH` versions.

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
