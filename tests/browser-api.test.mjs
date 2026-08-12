// Verifies that the shared namespace bridge prefers Firefox's `browser` API
// and falls back to Chromium's `chrome` API.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "src", "browser-api.js"), "utf8");

function loadBridge(namespace) {
  const api = { name: namespace };
  const sandbox = {
    browser: namespace === "browser" ? api : undefined,
    chrome: namespace === "chrome" ? api : undefined,
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return { api, selected: sandbox.ForceBGTabApi };
}

test("bridge selects Firefox browser namespace", () => {
  const result = loadBridge("browser");
  assert.strictEqual(result.selected, result.api);
});

test("bridge selects Chromium chrome namespace", () => {
  const result = loadBridge("chrome");
  assert.strictEqual(result.selected, result.api);
});
