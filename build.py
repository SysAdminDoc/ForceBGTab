#!/usr/bin/env python3
"""ForceBGTab build script.

Produces versioned Chrome and Firefox ZIPs in dist/. The ZIPs are the install
assets: load the extracted Chrome bundle unpacked, or submit the Firefox bundle
to AMO. Nothing here is code-signed.
"""
from __future__ import annotations

import json
import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")

# Files/dirs that make up the shippable extension.
INCLUDE_DIRS = ["src", "icons"]
TARGETS = {
    "chrome": {"manifest": "manifest.json", "suffix": ""},
    "firefox": {"manifest": "manifest.firefox.json", "suffix": "-firefox"},
}


def read_manifest(filename: str) -> dict:
    with open(os.path.join(ROOT, filename), encoding="utf-8") as fh:
        return json.load(fh)


def read_version() -> str:
    return read_manifest("manifest.json")["version"]


def collect(manifest_name: str) -> list[tuple[str, str]]:
    """Return (absolute_path, archive_name) pairs for one browser target."""
    members: list[tuple[str, str]] = [
        (os.path.join(ROOT, manifest_name), "manifest.json")
    ]
    for folder in INCLUDE_DIRS:
        base = os.path.join(ROOT, folder)
        for dirpath, dirs, files in os.walk(base):
            dirs.sort()
            for fname in sorted(files):
                abspath = os.path.join(dirpath, fname)
                arcname = os.path.relpath(abspath, ROOT).replace(os.sep, "/")
                members.append((abspath, arcname))
    return members


def build_zip(version: str, target: str, manifest_name: str, suffix: str) -> str:
    out = os.path.join(DIST, f"ForceBGTab-{version}{suffix}.zip")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for abspath, arcname in collect(manifest_name):
            zf.write(abspath, arcname)
    print(f"built {target} {out}")
    return out


def main() -> None:
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    version = read_version()
    for target, config in TARGETS.items():
        target_version = read_manifest(config["manifest"])["version"]
        if target_version != version:
            raise ValueError(
                f"{config['manifest']} version {target_version} does not match "
                f"manifest.json version {version}"
            )
        build_zip(version, target, config["manifest"], config["suffix"])


if __name__ == "__main__":
    main()
