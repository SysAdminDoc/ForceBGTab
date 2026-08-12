// Shared settings and site-rule helpers for the popup and options page.
(() => {
  const DEFAULTS = { enabled: true, siteRules: {} };
  const VALID_RULES = new Set(["bg", "fg"]);

  function normalizeHost(value) {
    if (typeof value !== "string") return null;
    let host = value.trim().toLowerCase().replace(/\.$/, "");
    if (host.startsWith("www.")) host = host.slice(4);
    if (!host || /[\s\\/]/.test(host) || host.includes("..")) return null;
    if (host.startsWith(".") || host.endsWith(".")) return null;

    // URL.hostname returns ordinary DNS names, IPv4 addresses, and (in some
    // browsers) bracketed IPv6 literals. Keep imports limited to host-shaped
    // values so arbitrary keys cannot become rules.
    if (/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host)) return host;
    if (/^\[[0-9a-f:]+\]$/i.test(host)) return host;
    return null;
  }

  function normalizeSiteRulesWithReport(rawRules) {
    const rules = {};
    const skipped = [];
    if (!rawRules || typeof rawRules !== "object" || Array.isArray(rawRules)) {
      return { rules, skipped: ["siteRules"] };
    }

    for (const [rawHost, rawRule] of Object.entries(rawRules)) {
      const host = normalizeHost(rawHost);
      if (!host || !VALID_RULES.has(rawRule)) {
        skipped.push(rawHost);
        continue;
      }
      rules[host] = rawRule;
    }
    return { rules, skipped };
  }

  function normalizeSiteRules(rawRules) {
    return normalizeSiteRulesWithReport(rawRules).rules;
  }

  function normalizeSettings(rawSettings) {
    const source = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
    return {
      enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULTS.enabled,
      siteRules: normalizeSiteRules(source.siteRules),
    };
  }

  function serializeSiteRules(siteRules) {
    return JSON.stringify(
      { version: 1, siteRules: normalizeSiteRules(siteRules) },
      null,
      2,
    ) + "\n";
  }

  function parseRulesJson(text) {
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Paste or choose a JSON file first.");
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("The selected text is not valid JSON.");
    }

    const wrapped =
      parsed && typeof parsed === "object" && !Array.isArray(parsed) &&
      Object.prototype.hasOwnProperty.call(parsed, "siteRules");
    const report = normalizeSiteRulesWithReport(wrapped ? parsed.siteRules : parsed);
    if (report.skipped.length && !Object.keys(report.rules).length) {
      throw new Error("The JSON contains no valid site rules.");
    }
    return report;
  }

  globalThis.ForceBGTabSettings = Object.freeze({
    DEFAULTS,
    normalizeHost,
    normalizeSiteRules,
    normalizeSettings,
    serializeSiteRules,
    parseRulesJson,
  });
})();
