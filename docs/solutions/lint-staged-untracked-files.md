---
title: lint-staged processes all files in working tree, not just staged
category: tooling
tags: [lint-staged, prettier, husky, pre-commit, ci]
created: 2026-03-26
problem: "Commits blocked by prettier errors in untracked files that weren't even being committed"
solution: "Delete or fix malformed untracked files before committing — lint-staged scans everything"
---

## Problem

lint-staged (via husky pre-commit hook) runs prettier on ALL files matching its glob in the working tree, not just files in the git staging area. Untracked files with invalid syntax (e.g., JSON logs from ralph loop) cause prettier to fail, blocking all commits.

## Solution

Before committing, ensure no malformed files exist in the working tree:

- Delete old `logs/*.json` files from ralph loops
- Delete any temporary files that don't parse cleanly
- Or add them to `.prettierignore`

```bash
# Quick fix: remove ralph loop logs
rm -rf logs/

# Permanent fix: add to .prettierignore
echo "logs/" >> .prettierignore
```

## How to avoid

Add transient output directories (`logs/`, `tmp/`, `ralph/`) to `.prettierignore` proactively.
