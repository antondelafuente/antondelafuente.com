#!/usr/bin/env python3
"""Fail-closed classifier for the visualization publish review lane.

The fast lane is intentionally tiny: modifications to existing page-local TSX
files whose changed lines are only allowlisted presentation tags/attributes.
Everything else receives a real cross-family review.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


PAGE_ROOT = "site/src/routes/visualizations"
PRESENTATION_TAGS = "div|section|main|header|footer|article|aside|details|summary|span"
CLASS_CHARS = r"[-A-Za-z0-9_:/ .!]*"
LITERAL_CLASS = rf'(?:"{CLASS_CHARS}"|\'{CLASS_CHARS}\')'
ATTRIBUTE = rf"(?:className={LITERAL_CLASS}|open)"
TAG_LINE = re.compile(
    rf"^\s*</?(?:{PRESENTATION_TAGS})(?:\s+{ATTRIBUTE})*\s*/?>\s*$"
)
ATTRIBUTE_LINE = re.compile(rf"^\s*{ATTRIBUTE}\s*$")


class ClassifierError(RuntimeError):
    pass


def git(repo: Path, *args: str, check: bool = True) -> str:
    result = subprocess.run(
        ["git", "-C", str(repo), *args], capture_output=True, text=True
    )
    if check and result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "git command failed"
        raise ClassifierError(detail)
    return result.stdout


def changed_lines(repo: Path, base: str) -> list[str]:
    diff = git(repo, "diff", "--no-ext-diff", "--unified=0", base, "--")
    lines: list[str] = []
    in_hunk = False
    for line in diff.splitlines():
        if line.startswith("diff --git "):
            in_hunk = False
            continue
        if line.startswith("@@"):
            in_hunk = True
            continue
        if in_hunk and line.startswith(("+", "-")):
            lines.append(line[1:])
    return lines


def classify(repo: Path, base: str, slug: str) -> dict[str, object]:
    git(repo, "rev-parse", "--verify", f"{base}^{{commit}}")
    ancestry = subprocess.run(
        ["git", "-C", str(repo), "merge-base", "--is-ancestor", base, "HEAD"],
        capture_output=True,
        text=True,
    )
    if ancestry.returncode != 0:
        raise ClassifierError(
            f"HEAD does not contain fresh {base}; rebase or merge the claimed branch before classifying"
        )
    status_lines = [
        line
        for line in git(repo, "diff", "--name-status", "--find-renames", base, "--").splitlines()
        if line.strip()
    ]
    untracked = [
        line
        for line in git(repo, "ls-files", "--others", "--exclude-standard").splitlines()
        if line.strip()
    ]

    if not status_lines and not untracked:
        raise ClassifierError(f"no changes relative to {base}")

    reasons: list[str] = []
    files: list[str] = []
    prefix = f"{PAGE_ROOT}/{slug}/"

    if untracked:
        files.extend(untracked)
        reasons.append("new or untracked files require review")

    mode_changes = [
        line.strip()
        for line in git(repo, "diff", "--summary", base, "--").splitlines()
        if "mode change" in line
    ]
    if mode_changes:
        reasons.append("file mode changes require review")

    for entry in status_lines:
        fields = entry.split("\t")
        status = fields[0]
        paths = fields[1:]
        files.extend(paths)
        if status != "M":
            reasons.append(f"{status} file status requires review: {' -> '.join(paths)}")
            continue
        path = paths[0]
        if not path.startswith(prefix) or not path.endswith(".tsx"):
            reasons.append(f"non-page-local file requires review: {path}")
            continue
        exists = subprocess.run(
            ["git", "-C", str(repo), "cat-file", "-e", f"{base}:{path}"],
            capture_output=True,
            text=True,
        )
        if exists.returncode != 0:
            reasons.append(f"new page file requires review: {path}")

    unsafe_lines = [
        line
        for line in changed_lines(repo, base)
        if line.strip() and not TAG_LINE.fullmatch(line) and not ATTRIBUTE_LINE.fullmatch(line)
    ]
    if unsafe_lines:
        reasons.append(
            "changed lines include prose, data, links, behavior, or non-allowlisted structure"
        )

    return {
        "lane": "reviewed" if reasons else "polish",
        "base": base,
        "slug": slug,
        "files": sorted(set(files)),
        "reasons": reasons,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--base", default="origin/main")
    parser.add_argument("--slug", required=True)
    parser.add_argument("--json", action="store_true")
    parser.add_argument(
        "--require-polish",
        action="store_true",
        help="exit 3 unless the deterministic verdict is polish",
    )
    args = parser.parse_args()

    try:
        result = classify(args.repo.resolve(), args.base, args.slug)
    except ClassifierError as exc:
        print(f"BLOCK: {exc}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print(f"LANE={result['lane']}")
        for reason in result["reasons"]:
            print(f"REASON={reason}")
    if args.require_polish and result["lane"] != "polish":
        print("BLOCK: fast landing requires LANE=polish", file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
