// ForceBGTab v0.1.0 — service worker
//
// Keeps focus on the tab you're reading. When a link, target="_blank", or
// window.open() spawns a NEW active tab, we quietly switch focus back to the
// tab that opened it, leaving the new one loading in the background.
//
// Why the two-listener dance? In Chromium, when a link opens a foreground tab
// the sequence is: onCreated (tab already .active) -> onActivated (new tab).
// You can't *prevent* activation — the browser already did it before any
// listener runs — so we mark the just-created tab, and when it activates we
// re-activate the opener. The visible result is a brief flicker, then focus
// snaps back. Background-only: no content scripts, no host permissions.

const api = chrome;

const DEFAULTS = { enabled: true, siteRules: {} };
let settings = { enabled: true, siteRules: {} };

// Tab that was focused before the current activation — our "switch back" target.
let lastActiveTabId = null;
// Tabs we've flagged to send to the background, cleared shortly after creation.
const recentlyCreatedTabs = new Set();

// URL schemes we never touch — internal pages and the new-tab page. A plain
// Ctrl+T opens chrome://newtab, so this also leaves user-opened blank tabs alone.
const INTERNAL_SCHEMES = [
  "chrome:",
  "chrome-extension:",
  "chrome-search:",
  "edge:",
  "about:",
  "devtools:",
  "view-source:",
  "moz-extension:",
];

// ── Settings ─────────────────────────────────────────────────────────────────

function loadSettings() {
  return api.storage.local.get(DEFAULTS).then((stored) => {
    settings = { ...DEFAULTS, ...stored };
  });
}
loadSettings();

api.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    settings[key] = newValue;
  }
});

// ── Rule matching ────────────────────────────────────────────────────────────

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isInternalUrl(url) {
  if (!url) return true;
  return INTERNAL_SCHEMES.some((scheme) => url.startsWith(scheme));
}

// Returns "bg", "fg", or null. A rule for "example.com" also covers its
// subdomains (e.g. "docs.example.com").
function matchSiteRule(url) {
  const host = hostnameOf(url);
  if (!host) return null;
  const rules = settings.siteRules || {};
  if (rules[host]) return rules[host];
  for (const ruleHost of Object.keys(rules)) {
    if (host === ruleHost || host.endsWith("." + ruleHost)) return rules[ruleHost];
  }
  return null;
}

function shouldBackground(tab) {
  // Only act on tabs spawned from another tab (links / window.open). A tab with
  // no opener is a fresh/session-restored tab and we leave it in the foreground.
  if (!tab || tab.openerTabId == null) return false;
  const url = tab.pendingUrl || tab.url || "";
  if (isInternalUrl(url)) return false;
  const rule = matchSiteRule(url);
  if (rule === "fg") return false;
  if (rule === "bg") return true;
  return !!settings.enabled;
}

// ── Focus management ─────────────────────────────────────────────────────────

api.tabs.onCreated.addListener((tab) => {
  if (tab.active && shouldBackground(tab)) {
    recentlyCreatedTabs.add(tab.id);
    // Safety purge in case the follow-up onActivated never arrives.
    setTimeout(() => recentlyCreatedTabs.delete(tab.id), 500);
  }
});

api.tabs.onActivated.addListener((info) => {
  if (recentlyCreatedTabs.has(info.tabId)) {
    recentlyCreatedTabs.delete(info.tabId);
    const backTo = lastActiveTabId;
    if (backTo != null) {
      // Small delay + catch: survives the transient error when the user is
      // mid-drag on a tab, and lets the browser settle before we switch back.
      setTimeout(() => api.tabs.update(backTo, { active: true }).catch(() => {}), 50);
    }
  } else {
    lastActiveTabId = info.tabId;
  }
});

api.tabs.onRemoved.addListener((tabId) => {
  recentlyCreatedTabs.delete(tabId);
  if (tabId === lastActiveTabId) lastActiveTabId = null;
});
