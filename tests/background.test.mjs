// Exercises src/background.js under a stubbed `chrome`, driving the
// onCreated -> onActivated event dance to confirm focus switches back to the
// opener, and that exclusions (internal URLs, opener-less tabs, fg rules) hold.
//
// Run: node --test
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "src", "background.js"), "utf8");

// Build a fresh, isolated background-worker instance for each scenario.
function loadWorker(settings) {
  const listeners = { onCreated: [], onActivated: [], onRemoved: [], onChanged: [] };
  const updateCalls = [];
  const timers = [];

  const chrome = {
    tabs: {
      onCreated: { addListener: (fn) => listeners.onCreated.push(fn) },
      onActivated: { addListener: (fn) => listeners.onActivated.push(fn) },
      onRemoved: { addListener: (fn) => listeners.onRemoved.push(fn) },
      update: (id, props) => {
        updateCalls.push({ id, props });
        return Promise.resolve();
      },
    },
    storage: {
      local: { get: () => Promise.resolve(settings) },
      onChanged: { addListener: (fn) => listeners.onChanged.push(fn) },
    },
  };

  const sandbox = {
    chrome,
    URL,
    console,
    // Capture timers so the harness can flush them deterministically.
    setTimeout: (fn, ms) => {
      timers.push({ fn, ms });
      return timers.length;
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);

  const flush = () => {
    // Run purge/switch-back callbacks (skip the 500ms safety purge so the
    // recentlyCreated flag is still present when onActivated fires).
    const due = timers.filter((t) => t.ms < 500);
    timers.length = 0;
    for (const t of due) t.fn();
  };

  return {
    fire: (name, arg) => listeners[name].forEach((fn) => fn(arg)),
    updateCalls,
    flush,
    // Let the loadSettings() promise resolve before events fire.
    ready: () => Promise.resolve().then(() => Promise.resolve()),
  };
}

test("link-opened active tab switches focus back to opener", async () => {
  const w = loadWorker({ enabled: true, siteRules: {} });
  await w.ready();

  w.fire("onActivated", { tabId: 1 }); // user is on tab 1
  w.fire("onCreated", { id: 2, active: true, openerTabId: 1, pendingUrl: "https://example.com/" });
  w.fire("onActivated", { tabId: 2 }); // browser focuses the new tab
  w.flush(); // run the settle-time fallback

  // Early (onCreated) + fallback (onActivated) reverts may both fire; every one
  // must re-activate the opener (tab 1), never the new tab.
  assert.ok(w.updateCalls.length >= 1, "opener should be re-activated");
  assert.ok(w.updateCalls.every((c) => c.id === 1 && c.props.active === true));
});

test("Ctrl+T style tab (no opener) is left in the foreground", async () => {
  const w = loadWorker({ enabled: true, siteRules: {} });
  await w.ready();

  w.fire("onActivated", { tabId: 1 });
  w.fire("onCreated", { id: 2, active: true, openerTabId: undefined, pendingUrl: "chrome://newtab/" });
  w.fire("onActivated", { tabId: 2 });
  w.flush();

  assert.equal(w.updateCalls.length, 0);
});

test("internal-scheme tab is never backgrounded", async () => {
  const w = loadWorker({ enabled: true, siteRules: {} });
  await w.ready();

  w.fire("onActivated", { tabId: 1 });
  w.fire("onCreated", { id: 2, active: true, openerTabId: 1, pendingUrl: "chrome://settings/" });
  w.fire("onActivated", { tabId: 2 });
  w.flush();

  assert.equal(w.updateCalls.length, 0);
});

test("global toggle off leaves tabs in the foreground", async () => {
  const w = loadWorker({ enabled: false, siteRules: {} });
  await w.ready();

  w.fire("onActivated", { tabId: 1 });
  w.fire("onCreated", { id: 2, active: true, openerTabId: 1, pendingUrl: "https://example.com/" });
  w.fire("onActivated", { tabId: 2 });
  w.flush();

  assert.equal(w.updateCalls.length, 0);
});

test("per-site fg rule wins even when globally enabled", async () => {
  const w = loadWorker({ enabled: true, siteRules: { "example.com": "fg" } });
  await w.ready();

  w.fire("onActivated", { tabId: 1 });
  w.fire("onCreated", { id: 2, active: true, openerTabId: 1, pendingUrl: "https://docs.example.com/" });
  w.fire("onActivated", { tabId: 2 });
  w.flush();

  assert.equal(w.updateCalls.length, 0, "subdomain should inherit the fg rule");
});

test("per-site bg rule wins even when globally disabled", async () => {
  const w = loadWorker({ enabled: false, siteRules: { "example.com": "bg" } });
  await w.ready();

  w.fire("onActivated", { tabId: 1 });
  w.fire("onCreated", { id: 2, active: true, openerTabId: 1, pendingUrl: "https://example.com/" });
  w.fire("onActivated", { tabId: 2 });
  w.flush();

  assert.ok(w.updateCalls.length >= 1, "opener should be re-activated");
  assert.ok(w.updateCalls.every((c) => c.id === 1 && c.props.active === true));
});
