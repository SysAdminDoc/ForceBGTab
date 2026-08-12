// ForceBGTab v0.2.0 — popup controller

const api = globalThis.ForceBGTabApi ?? globalThis.browser ?? globalThis.chrome;
const tools = globalThis.ForceBGTabSettings;

const els = {
  version: document.getElementById("version"),
  master: document.getElementById("master-toggle"),
  siteHost: document.getElementById("site-host"),
  siteRule: document.getElementById("site-rule"),
  rulesList: document.getElementById("rules-list"),
  rulesCount: document.getElementById("rules-count"),
  rulesEmpty: document.getElementById("rules-empty"),
  repoLink: document.getElementById("repo-link"),
  optionsLink: document.getElementById("options-link"),
};

let settings = tools.normalizeSettings(tools.DEFAULTS);
let currentHost = null;

function hostnameOf(url) {
  try {
    return tools.normalizeHost(new URL(url).hostname);
  } catch {
    return null;
  }
}

function getSettings() {
  return api.storage.local.get(tools.DEFAULTS).then((stored) => {
    settings = tools.normalizeSettings(stored);
  });
}

function save() {
  return api.storage.local.set(settings);
}

// ── Rendering ────────────────────────────────────────────────────────────────

function renderMaster() {
  els.master.checked = !!settings.enabled;
}

function renderSiteRule() {
  const active = currentHost ? settings.siteRules[currentHost] || "default" : "default";
  for (const btn of els.siteRule.querySelectorAll(".seg")) {
    btn.classList.toggle("is-active", btn.dataset.rule === active);
    btn.disabled = !currentHost;
  }
}

function renderRules() {
  const entries = Object.entries(settings.siteRules).sort((a, b) => a[0].localeCompare(b[0]));
  els.rulesCount.textContent = String(entries.length);
  els.rulesEmpty.hidden = entries.length > 0;
  els.rulesList.textContent = "";

  for (const [host, rule] of entries) {
    const li = document.createElement("li");
    li.className = "rule-item";

    const name = document.createElement("span");
    name.className = "rule-host";
    name.textContent = host;

    const badge = document.createElement("span");
    badge.className = "rule-badge " + rule;
    badge.textContent = rule === "bg" ? "background" : "foreground";

    const remove = document.createElement("button");
    remove.className = "rule-remove";
    remove.type = "button";
    remove.title = "Remove rule";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      delete settings.siteRules[host];
      save().then(() => {
        renderRules();
        renderSiteRule();
      });
    });

    li.append(name, badge, remove);
    els.rulesList.append(li);
  }
}

// ── Events ───────────────────────────────────────────────────────────────────

els.master.addEventListener("change", () => {
  settings.enabled = els.master.checked;
  save();
});

els.siteRule.addEventListener("click", (event) => {
  const btn = event.target.closest(".seg");
  if (!btn || !currentHost) return;
  const rule = btn.dataset.rule;
  if (rule === "default") {
    delete settings.siteRules[currentHost];
  } else {
    settings.siteRules[currentHost] = rule;
  }
  save().then(() => {
    renderSiteRule();
    renderRules();
  });
});

els.optionsLink.addEventListener("click", () => {
  const openOptions = api.runtime.openOptionsPage;
  if (typeof openOptions === "function") {
    Promise.resolve(openOptions.call(api.runtime)).catch(() => {});
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────

function init() {
  const manifest = api.runtime.getManifest();
  els.version.textContent = "v" + manifest.version;

  Promise.all([
    getSettings(),
    api.tabs.query({ active: true, currentWindow: true }),
  ]).then(([, tabs]) => {
    const tab = tabs && tabs[0];
    currentHost = tab ? hostnameOf(tab.url || tab.pendingUrl) : null;
    els.siteHost.textContent = currentHost || "no site";
    renderMaster();
    renderSiteRule();
    renderRules();
  });
}

init();
