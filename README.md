# ForceBGTab

[![Version](https://img.shields.io/badge/version-0.2.0-cba6f7)](https://github.com/SysAdminDoc/ForceBGTab/releases)
[![License](https://img.shields.io/badge/license-MIT-a6e3a1)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-89b4fa)](#install)
[![Manifest](https://img.shields.io/badge/manifest-v3-f9e2af)](manifest.json)

**Keep your focus where you're reading.** ForceBGTab forces new tabs opened from
links, `target="_blank"`, or `window.open()` to open in the **background** — so a
click never yanks you away from the page you're on.

It is a small, auditable, **open-source** Manifest V3 extension built from
trusted source code. It requests only the `tabs` and `storage` permissions:
**no content scripts, no host permissions, no access to any page's contents.**

---

## Features

- **Background tabs by default** — links open behind the current tab instead of stealing focus.
- **Global on/off** toggle in the toolbar popup.
- **Per-site rules** — force a site to *always* open in the background or *always* in the foreground. Rules match subdomains (`example.com` covers `docs.example.com`).
- **Full-window settings** — manage all site rules at once and import or export them as JSON.
- **Sensible exclusions** — internal pages (`chrome://`, `edge://`, extension pages, the new-tab page) and fresh tabs you open yourself (Ctrl+T) are left alone.
- **Minimal footprint** — background-only service worker, two permissions, zero page access.
- **Dark, clean UI** — Catppuccin Mocha popup.

## How it works

In Chromium, when a link opens a foreground tab the browser activates it *before*
any extension code runs — so an extension can't *prevent* the switch. ForceBGTab
watches `tabs.onCreated` → `tabs.onActivated`, flags the just-opened tab, and when
it becomes active immediately re-activates the tab that opened it. The result is a
brief flicker, then focus snaps back to where you were, with the new tab loading
quietly in the background. This is done entirely in the browser background
context via the compatible `tabs` API — no code is injected into any web page.

## Install

### From source (unpacked)

1. Download or clone this repo.
2. (Optional) Regenerate icons: `python generate_icons.py`
3. Open `chrome://extensions` (or `edge://extensions`).
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the repo folder.

### From a build

1. Run `python build.py` to produce both browser packages:
   `dist/ForceBGTab-<version>.zip` for Chrome/Edge and
   `dist/ForceBGTab-<version>-firefox.zip` for Firefox.
2. For Chrome/Edge, on `chrome://extensions` with Developer mode on, drag the
   ZIP in, or **Load unpacked** the extracted folder.
3. For Firefox, extract the `-firefox.zip`, open `about:debugging`, choose
   **This Firefox**, then **Load Temporary Add-on** and select its
   `manifest.json`.

> Distributed **unsigned**. Chrome may warn about developer-mode extensions —
> that is expected for a self-hosted, open-source extension.

## Usage

Click the toolbar icon:

- **Force new tabs to background** — the master switch. On by default.
- **This site** — set a Default / Background / Foreground rule for the site in the active tab.
- **Site rules** — review and remove saved per-site overrides.
- **Full settings** — open the full-window rule manager. It includes an
  editable JSON transfer box, a JSON file export, and JSON file import.

Import replaces the current site rules. Exports use a versioned JSON envelope;
the importer also accepts a plain `{ "example.com": "bg" }` rule map.

Rule precedence: a per-site **Foreground** or **Background** rule always wins;
otherwise the global toggle decides. Middle-click and Ctrl-click already open in
the background natively — ForceBGTab only affects opens that would otherwise take
focus.

## Build

```bash
python generate_icons.py   # (re)generate icons from the Pillow-drawn master
python build.py            # -> Chrome + Firefox ZIPs in dist/
```

`build.py` emits an unpacked-loadable / Web-Store-ready Chrome ZIP and an
AMO-ready Firefox ZIP. The Firefox manifest uses a background event script and
the shared `browser`/`chrome` namespace bridge. No CRX is produced — Chromium
rejects self-signed CRX3 packages, and this project is never code-signed.

## Project layout

```
manifest.json          # MV3 manifest — tabs + storage only
manifest.firefox.json  # Firefox MV3 manifest + Gecko metadata
src/background.js       # service worker: the focus-switch logic
src/popup.html/.css/.js # toolbar popup UI
src/options.html/.css/.js # full-window settings UI
src/browser-api.js      # browser/chrome namespace bridge
src/settings.js         # shared settings + JSON rule helpers
icons/                  # 16/32/48/128/512 PNGs
generate_icons.py       # icon master (Pillow)
build.py                # Chrome + Firefox ZIP packaging
```

## Tests

The focus-switch logic runs under a stubbed `chrome` API with Node's built-in
test runner — no browser required:

```bash
node --test
```

Covered: switch-back to the opener on a link-opened tab, the Firefox namespace
bridge, every focus exclusion (Ctrl+T / opener-less tabs, internal schemes,
global toggle off, per-site foreground/background rules with subdomain
matching), and the options-page JSON rule format.

## Privacy

ForceBGTab reads tab URLs only to apply your per-site rules and to skip internal
pages. Everything stays in local `chrome.storage`. Nothing is transmitted, and no
content script ever runs on the pages you visit.

## License

[MIT](LICENSE) © 2026 Matthew Parker
