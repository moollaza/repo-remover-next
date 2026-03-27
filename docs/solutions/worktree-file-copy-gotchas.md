---
title: Git worktree file operations require special handling
category: tooling
tags: [worktrees, git, cp, shell, ci]
created: 2026-03-27
problem: "cp from worktree to main repo fails silently or prompts for overwrite in non-interactive shell"
solution: "Use Write tool or cat > redirect instead of cp for cross-worktree file operations"
---

## Problem

When working with `.claude/worktrees/` for parallel agent development:

1. `cp` from worktree → main repo prompts "overwrite?" in non-interactive shell, failing silently
2. `cp -f` also fails because zsh has `noclobber` or alias overriding `-f`
3. `cat file > dest` fails with "file exists" in some shell configs
4. Worktree directories get accidentally staged by `git add -A`
5. Vitest discovers test files inside worktree directories, running duplicate/broken tests

## Solution

1. **Use Write/Edit tools** for cross-worktree file transfer (read from worktree, write to main repo)
2. **Add `.claude/worktrees/` to `.gitignore`** to prevent accidental staging
3. **Add `"**/.claude/worktrees/**"` to vitest exclude** in `vitest.config.ts`
4. **Never `git add -A`** when worktrees exist — always add specific files

```bash
# vitest.config.ts
exclude: ["**/e2e/**", "**/node_modules/**", "**/.claude/worktrees/**"],
```

## How to avoid

Always add `.claude/worktrees/` to `.gitignore` and vitest exclude at the start of any session using parallel worktree agents.
