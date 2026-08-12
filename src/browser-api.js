// Small namespace bridge shared by Chrome and Firefox builds.
//
// Firefox exposes the Promise-based WebExtension API as `browser`, while
// Chromium exposes the compatible API as `chrome`. Keeping the choice in one
// place lets every extension page use the same source files.
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  if (!api) {
    throw new Error("ForceBGTab could not find a WebExtension API namespace");
  }
  globalThis.ForceBGTabApi = api;
})();
