// Tests the shared site-rule normalization and JSON transfer format without a
// browser DOM. The settings helper exposes its small public API on globalThis.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "src", "settings.js"), "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const tools = sandbox.ForceBGTabSettings;

test("settings normalize host keys and discard invalid rules", () => {
  const rules = tools.normalizeSiteRules({
    "WWW.Example.com.": "bg",
    "docs.example.com": "fg",
    "not a host": "bg",
    "ignored.example": "default",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(rules)), {
    "example.com": "bg",
    "docs.example.com": "fg",
  });
});

test("site rules round-trip through the versioned JSON envelope", () => {
  const json = tools.serializeSiteRules({ "WWW.Example.com": "bg" });
  assert.deepEqual(JSON.parse(JSON.stringify(tools.parseRulesJson(json))), {
    rules: { "example.com": "bg" },
    skipped: [],
  });
});

test("plain rule maps are accepted and malformed-only imports fail", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(tools.parseRulesJson('{"example.com":"fg"}'))), {
    rules: { "example.com": "fg" },
    skipped: [],
  });
  assert.throws(() => tools.parseRulesJson('{"example.com":"default"}'), /no valid site rules/i);
});
