"""Scaffold a kallaway-style Remotion project.

  python new_project.py --dest "<video folder>/kallaway"

Copies template/ + fonts, then links node_modules from an existing Remotion 4.0.524 install
(junction, no download) if one is found; otherwise runs `npm install`.
"""
import argparse
import sys
import shutil
import subprocess
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
KNOWN_NODE_MODULES = []  # add paths to an existing Remotion 4.0.524 node_modules to skip npm install


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--dest", required=True)
    ap.add_argument("--npm", action="store_true", help="force npm install instead of linking")
    a = ap.parse_args()
    dest = Path(a.dest)
    if dest.exists() and any(dest.iterdir()):
        raise SystemExit(f"{dest} is not empty - pick a new folder (template is never merged into old work).")
    shutil.copytree(SKILL / "template", dest, dirs_exist_ok=True)
    shutil.copytree(SKILL / "assets" / "fonts", dest / "public" / "fonts", dirs_exist_ok=True)
    nm = next((p for p in KNOWN_NODE_MODULES if (p / "remotion").exists()), None)
    if nm and not a.npm:
        subprocess.run(["cmd", "/c", "mklink", "/J", str(dest / "node_modules"), str(nm)], check=True, capture_output=True)
        print("node_modules linked ->", nm)
    else:
        subprocess.run(["npm", "install"], cwd=dest, check=True, shell=True)
    print("project ready:", dest)


if __name__ == "__main__":
    main()
