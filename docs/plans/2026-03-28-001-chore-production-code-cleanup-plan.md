---
title: "chore: Production code cleanup & documentation"
type: chore
status: completed
date: 2026-03-28
---

# Production Code Cleanup & Documentation

## Overview

Make the codebase open-source ready. Remove stale references, internal AI artifacts, and outdated documentation. Update README and rules files to reflect the current Vite + React Router stack.

## Current State Analysis

### Ghost References (files referenced but don't exist)

- `docs/ARCHITECTURE_REVIEW.md` — referenced in CLAUDE.md L84, `.claude/rules/architecture.md` L75
- `docs/RECOMMENDATIONS.md` — referenced in `.claude/rules/architecture.md` L69, L76
- `docs/IMPLEMENTATION_PLAN.md` — referenced in `.claude/rules/architecture.md` L77
- `docs/TESTING_STRATEGY.md` — referenced in `.claude/rules/architecture.md` L78
- `docs/PRESENTATIONAL_CONTAINER_REFACTOR.md` — referenced in `.claude/rules/architecture.md` L58

### Stale Internal Artifacts

- `docs/ai/handoffs/` — AI handoff doc (internal)
- `docs/ai/research/` — AI research doc (internal)
- `docs/superpowers/plans/` — old Superpowers tool plans
- `docs/UI_DENSITY_IMPROVEMENTS.md` — completed improvement doc
- `docs/ROADMAP.md` — check if still relevant

### README.md Problems

- Title says "Next.js" — migrated to Vite months ago
- Commands use `npm` — should be `bun`
- Port references `localhost:3000` — should be `localhost:5173`
- "Built with" lists Next.js — should be Vite 8 + React Router 7
- Testing setup references `npm install` / `npm test`

### .claude/rules/architecture.md Problems

- References 5 non-existent doc files
- Env var names use `NEXT_PUBLIC_` prefix — should be `VITE_`
- Documentation Links section lists Next.js — should be Vite + React Router
- Architecture grades from 2025-10-07 are stale
- P0 recommendations reference completed work and missing files
- Sentry docs link points to Next.js guide

### Source Code (Clean)

- Only 1 TODO in src/ (`repo-table.tsx:151`) — valid feature idea, keep
- No stale console.log — all in debug.ts/analytics.ts utilities (intentional)
- No debugger statements

## What We're NOT Doing

- Adding JSDoc comments (CLAUDE.md says "Don't add docstrings, comments, or type annotations to code you didn't change")
- Refactoring source code
- Changing any functionality
- Removing docs/solutions/ (these are institutional learnings — keep)
- Removing docs/plans/ (these are plan history — keep, mark completed ones)

## Phase 1: Remove Stale Files

### Delete internal AI artifacts

```bash
rm -rf docs/ai/
rm -rf docs/superpowers/
rm docs/UI_DENSITY_IMPROVEMENTS.md
```

### Check and handle docs/ROADMAP.md

Read it — if stale/completed, delete. If still relevant, keep.

### Success Criteria

- [ ] `docs/ai/` directory gone
- [ ] `docs/superpowers/` directory gone
- [ ] `docs/UI_DENSITY_IMPROVEMENTS.md` gone
- [ ] `docs/ROADMAP.md` handled

---

## Phase 2: Fix Ghost References

### 2a. Update `.claude/rules/architecture.md`

**Remove the entire "Architecture Docs" section** (L71-78) that references 5 non-existent files.

**Remove the "Priority Recommendations" section** (L54-69) — references non-existent `docs/RECOMMENDATIONS.md` and `docs/PRESENTATIONAL_CONTAINER_REFACTOR.md`. Many items are completed.

**Remove the "Architecture Grades & Targets" table** (L43-52) — stale 2025-10-07 data.

**Fix Environment Setup section:**

- Change `NEXT_PUBLIC_SENTRY_DSN` → `VITE_SENTRY_DSN`
- Change `NEXT_PUBLIC_FATHOM_SITE_ID` → `VITE_FATHOM_SITE_ID`
- Change `.env.local` → `.env`

**Fix Documentation Links:**

- Remove Next.js link
- Add Vite: https://vitejs.dev/guide/
- Add React Router: https://reactrouter.com/
- Change Sentry link from Next.js guide to React: https://docs.sentry.io/platforms/javascript/guides/react/

### 2b. Update `CLAUDE.md`

**Remove the "Architecture" section line** referencing `docs/` docs:

```
- Architecture docs in `docs/` (ARCHITECTURE_REVIEW, RECOMMENDATIONS, IMPLEMENTATION_PLAN, TESTING_STRATEGY)
```

### Success Criteria

- [ ] No references to non-existent files: `grep -r "ARCHITECTURE_REVIEW\|RECOMMENDATIONS\|IMPLEMENTATION_PLAN\|TESTING_STRATEGY\|PRESENTATIONAL_CONTAINER_REFACTOR" . --include='*.md' --exclude-dir=node_modules --exclude-dir=docs/plans` returns nothing
- [ ] Env var prefixes are `VITE_` not `NEXT_PUBLIC_`
- [ ] Documentation links point to correct frameworks

---

## Phase 3: Update README.md

Rewrite to reflect current stack. Keep the same spirit but fix all inaccuracies.

**Key changes:**

- Title: "Repo Remover" (drop "Next.js")
- Stack: Vite 8, React 18, React Router 7, TypeScript 5.9, Tailwind CSS 4
- Commands: `bun install`, `bun run dev`, `bun run build`
- Port: `localhost:5173`
- "Built with": Vite, React Router, Tailwind CSS 4, Vitest, Playwright, Sentry, Fathom, Cloudflare Workers
- Testing: `bun run test:unit`, `bun run test:e2e`
- Remove `.env.test` setup section (E2E tests now work without real token per PR #87)
- Add "Zero-knowledge architecture" mention in intro

### Success Criteria

- [ ] No references to Next.js or npm
- [ ] All commands use `bun`
- [ ] Port is 5173
- [ ] Stack list is accurate

---

## Phase 4: Verify .gitignore

Current .gitignore is mostly good. Add:

- `.env.test` (contains tokens if present)
- `*.log` (catch any log files)

### Success Criteria

- [ ] `.env.test` in .gitignore
- [ ] `*.log` in .gitignore

---

## Phase 5: Mark Completed Plans

Add `status: completed` to frontmatter of:

- `docs/plans/2026-03-27-002-refactor-remove-heroui-theme-plan.md` (PR #86 merged)
- `docs/plans/2026-03-27-003-fix-e2e-mocking-and-deferred-tests-plan.md` (PR #87)

### Success Criteria

- [ ] Both plans have `status: completed` in frontmatter

---

## Phase 6: Lint & Verify

```bash
bun run lint:fix
bun run build
bun run test:unit
```

### Success Criteria

- [ ] Lint passes
- [ ] Build passes
- [ ] Unit tests pass
