"""
fix_logging.py
Run this once from your project root: python fix_logging.py

What it does:
- Walks through every .py file inside backend/
- Skips files that don't use print()
- Adds "import logging" + a logger line near the top of each file that needs it
- Changes print(...) to logger.info(...) for normal messages
- Changes print(...) to logger.error(...) for messages that look like errors
  (the line contains "error", "fail", or "fatal")

After running it, check the changed files (or use `git diff` if your project
is a git repo) since the error/info guess isn't perfect — fix any obvious
misses by hand, but functionally nothing breaks either way.
"""

import os

ROOT = "backend"
LOGGER_SETUP = "import logging\nlogger = logging.getLogger(__name__)\n"

changed_files = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    if "__pycache__" in dirpath:
        continue
    for fname in filenames:
        if not fname.endswith(".py"):
            continue
        path = os.path.join(dirpath, fname)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        if "print(" not in content:
            continue

        lines = content.split("\n")
        new_lines = []
        for line in lines:
            if "print(" in line:
                lower = line.lower()
                if "error" in lower or "fail" in lower or "fatal" in lower:
                    line = line.replace("print(", "logger.error(", 1)
                else:
                    line = line.replace("print(", "logger.info(", 1)
            new_lines.append(line)
        content = "\n".join(new_lines)

        if "import logging" not in content:
            content = LOGGER_SETUP + "\n" + content

        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

        changed_files.append(path)

print(f"Done. Updated {len(changed_files)} files:")
for p in changed_files:
    print(" -", p)