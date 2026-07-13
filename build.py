#!/usr/bin/env python3
"""ForceBGTab v0.1.0 build script.

Produces a versioned, Web-Store-ready / unpacked-loadable ZIP in dist/. The ZIP
is the install asset: load it unpacked, or drag it onto chrome://extensions.
Chromium rejects self-signed CRX3 packages (CRX_REQUIRED_PROOF_MISSING), so no
CRX is produced. Nothing here is code-signed.
"""
from __future__ import annotations

import json
import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")

# Files/dirs that make up the shippable extension.
INCLUDE_FILES = ["manifest.json"]
INCLUDE_DIRS = ["src", "icons"]


def read_version() -> str:
    with open(os.path.join(ROOT, "manifest.json"), encoding="utf-8") as fh:
        return json.load(fh)["version"]


def collect() -> list[tuple[str, str]]:
    """Return (absolute_path, archive_name) pairs."""
    members: list[tuple[str, str]] = []
    for name in INCLUDE_FILES:
        members.append((os.path.join(ROOT, name), name))
    for folder in INCLUDE_DIRS:
        base = os.path.join(ROOT, folder)
        for dirpath, _dirs, files in os.walk(base):
            for fname in files:
                abspath = os.path.join(dirpath, fname)
                arcname = os.path.relpath(abspath, ROOT).replace(os.sep, "/")
                members.append((abspath, arcname))
    return members


def build_zip(version: str) -> str:
    out = os.path.join(DIST, f"ForceBGTab-{version}.zip")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for abspath, arcname in collect():
            zf.write(abspath, arcname)
    print(f"built {out}")
    return out


def main() -> None:
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    version = read_version()
    build_zip(version)


if __name__ == "__main__":
    main()
