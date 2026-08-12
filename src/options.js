// ForceBGTab — full-window settings controller

const api = globalThis.ForceBGTabApi ?? globalThis.browser ?? globalThis.chrome;
const tools = globalThis.ForceBGTabSettings;

const els = {
  version: document.getElementById("version"),
  master: document.getElementById("master-toggle"),
  rulesList: document.getElementById("rules-list"),
  rulesCount: document.getElementById("rules-count"),
  rulesEmpty: document.getElementById("rules-empty"),
  exportRules: document.getElementById("export-rules"),
  importFile: document.getElementById("import-file"),
  importText: document.getElementById("import-text"),
  rulesJson: document.getElementById("rules-json"),
  transferStatus: document.getElementById("transfer-status"),
};

let settings = tools.normalizeSettings(tools.DEFAULTS);

function setStatus(message, kind = "") {
  els.transferStatus.textContent = message;
  els.transferStatus.className = "transfer-status" + (kind ? ` is-${kind}` : "");
}

function loadSettings() {
  return api.storage.local.get(tools.DEFAULTS).then((stored) => {
    settings = tools.normalizeSettings(stored);
  });
}

function saveSettings() {
  return api.storage.local.set(settings);
}

function renderMaster() {
  els.master.checked = settings.enabled;
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

    const select = document.createElement("select");
    select.className = "rule-select";
    select.title = `Rule for ${host}`;
    select.setAttribute("aria-label", `Rule for ${host}`);
    for (const [value, label] of [["bg", "Background"], ["fg", "Foreground"]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === rule;
      select.append(option);
    }
    select.addEventListener("change", () => {
      settings.siteRules[host] = select.value;
      saveSettings()
        .then(() => setStatus(`Updated ${host}.`, "success"))
        .catch(() => setStatus("Could not save that rule.", "error"));
    });

    const remove = document.createElement("button");
    remove.className = "rule-remove";
    remove.type = "button";
    remove.title = `Remove rule for ${host}`;
    remove.setAttribute("aria-label", `Remove rule for ${host}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      delete settings.siteRules[host];
      saveSettings()
        .then(() => {
          renderRules();
          setStatus(`Removed ${host}.`, "success");
        })
        .catch(() => setStatus("Could not remove that rule.", "error"));
    });

    li.append(name, select, remove);
    els.rulesList.append(li);
  }
}

function downloadRules(json) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "forcebgtab-site-rules.json";
  document.body.append(link);
  link.click();
  link.remove();
  // Give slower browsers time to consume the download before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportRules() {
  const json = tools.serializeSiteRules(settings.siteRules);
  els.rulesJson.value = json;
  downloadRules(json);
  setStatus("Rules exported to the text box and a JSON file.", "success");
}

function importRules(text) {
  let report;
  try {
    report = tools.parseRulesJson(text);
  } catch (error) {
    setStatus(error.message, "error");
    return Promise.resolve(false);
  }

  const skipped = report.skipped.length;
  const warning = skipped ? ` ${skipped} invalid entr${skipped === 1 ? "y was" : "ies were"} skipped.` : "";
  if (!window.confirm(`Replace the current site rules with ${Object.keys(report.rules).length} imported rule(s)?`)) {
    return Promise.resolve(false);
  }

  settings.siteRules = report.rules;
  return saveSettings()
    .then(() => {
      renderRules();
      setStatus(`Imported ${Object.keys(report.rules).length} rule(s).${warning}`, "success");
      return true;
    })
    .catch(() => {
      setStatus("Could not save the imported rules.", "error");
      return false;
    });
}

els.master.addEventListener("change", () => {
  settings.enabled = els.master.checked;
  saveSettings()
    .then(() => setStatus("Global setting saved.", "success"))
    .catch(() => setStatus("Could not save the global setting.", "error"));
});

els.exportRules.addEventListener("click", exportRules);
els.importText.addEventListener("click", () => importRules(els.rulesJson.value));
els.importFile.addEventListener("change", () => {
  const file = els.importFile.files && els.importFile.files[0];
  if (!file) return;
  file
    .text()
    .then(importRules)
    .catch(() => setStatus("Could not read that JSON file.", "error"))
    .finally(() => {
      els.importFile.value = "";
    });
});

function init() {
  els.version.textContent = "v" + api.runtime.getManifest().version;
  loadSettings()
    .then(() => {
      renderMaster();
      renderRules();
    })
    .catch(() => setStatus("Could not load saved settings.", "error"));
}

init();
