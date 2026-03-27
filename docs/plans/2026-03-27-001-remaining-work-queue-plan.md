---
title: "Remaining work queue"
type: refactor
status: active
date: 2026-03-27
---

# Remaining Work Queue

## Completed This Session (2026-03-26/27)

- [x] PR #77 MERGED — Audit remediation: cherry-pick bug fixes, security hardening, 200+ tests
- [x] PR #79 OPEN — Dependency updates: all deps updated, 325 tests passing
- [x] CI fully green (lint 0 errors, 325/325 tests, build passes, typecheck clean)

## Queue (priority order)

### 1. Remove @heroui/theme (Medium effort)

Last HeroUI dependency. Used in `tailwind.config.ts` for semantic color classes (`bg-content1`, `text-foreground`, `border-divider`).

**Approach:** Replace HeroUI semantic colors with either:

- Plain Tailwind colors via CSS custom properties in `globals.css`
- Direct Tailwind classes (`bg-white dark:bg-gray-900` etc.)

**Files to change:** `tailwind.config.ts`, `package.json`, every component using semantic colors (grep for `content1`, `content2`, `foreground`, `divider`, `default-`).

### 2. SEO + Copy Optimization (Small effort)

- Meta tags, Open Graph, structured data
- Landing page copy polish
- Performance: lazy load below-fold sections

### 3. Sentry + Fathom Activation (Tiny — infra only)

Set env vars in Cloudflare Workers dashboard:

- `VITE_SENTRY_DSN` — get from sentry.io project
- `VITE_FATHOM_SITE_ID` — get from usefathom.com

Code is already fully implemented. Just needs env vars.

### 4. E2E: Remove Real API Calls from CI (Small effort)

Current E2E tests hit real GitHub API (needs `GITHUB_TEST_TOKEN`). Should mock API in E2E using Playwright's `page.route()` for CI. Keep real API testing for manual/opt-in workflow.

### 5. Rewrite 15 Deferred Component/E2E Tests (Medium effort)

Tests written for HeroUI components need rewriting for Tailwind:

- `src/components/header.test.tsx` (6 failing)
- `src/components/dashboard.test.tsx`
- `src/components/repo-loading-progress.test.tsx`
- `src/components/scroll-button.test.tsx`
- `src/components/repo-table/confirmation-modal.test.tsx`
- `src/components/repo-table/repo-table.test.tsx`
- `src/components/repo-table/repo-filters.test.tsx`
- E2E page objects: `e2e/pages/dashboard.ts`, `e2e/pages/home.ts`
- E2E specs: `e2e/dashboard.spec.ts`, `e2e/home.spec.ts`
- E2E mocks: `e2e/utils/github-api-mocks.ts`

### 6. Token Input type="password" (Tiny)

Change token inputs from `type="text"` to `type="password"` with visibility toggle:

- `src/components/github-token-form.tsx`
- `src/components/landing/get-started-section.tsx`

### 7. Wire Up Remember Me Checkbox (Small)

`github-token-form.tsx` has a hardcoded `checked={true}` readOnly checkbox. Wire it up to actually control the `remember` parameter on `setPat`.

### 8. Sentry Scrub event.tags/extra (Tiny — defense-in-depth)

Add scrubbing for `event.tags`, `event.extra`, `event.contexts` in `src/utils/sentry-before-send.ts`.

### 9. Compound Engineering Optimization

Optimize repo to follow https://every.to/guides/compound-engineering patterns:

- Document solutions in `docs/solutions/` for institutional knowledge compounding
- Set up proper `compound-engineering.local.md` with review agents for automated reviews
- Ensure skills, hooks, and workflows are optimized for agent-native development
- Capture learnings from this session (fingerprint fix, HeroUI→Tailwind migration, lint-staged gotchas, ralph loop patterns)

## Execution Strategy

### Parallelization (use worktrees or parallel agents)

These items are **independent** and can be worked on simultaneously:

**Batch A** (no shared files):

- Item 1: Remove @heroui/theme
- Item 2: SEO + copy optimization
- Item 3: Sentry + Fathom activation (manual — just env vars)

**Batch B** (E2E related):

- Item 4: Mock E2E API calls
- Item 5: Rewrite deferred tests

**Batch C** (small independent fixes):

- Item 6: Token input type="password"
- Item 7: Wire up Remember Me
- Item 8: Sentry scrub event.tags

**Batch D** (meta/process):

- Item 9: Compound Engineering optimization

### Recommended approach (CE workflows)

1. Merge PR #79 (deps update) if CI green
2. **Batch C** — 3 parallel `/lfg` agents in worktrees (tiny independent fixes)
3. **Item 1** — `/slfg` for @heroui/theme removal (medium, benefits from swarm parallelism)
4. **Batch B** — `/slfg` for E2E mocking + test rewrites (multiple independent test files)
5. **Item 2** — `/lfg` for SEO + copy optimization
6. **Item 9** — `/ce-compound` after each batch to capture learnings
7. Item 3 is manual (Cloudflare dashboard env vars) — do separately

### CE workflow mapping

| Item                   | CE Command                      | Why                                              |
| ---------------------- | ------------------------------- | ------------------------------------------------ |
| Batch C (items 6+7+8)  | `/lfg` x3 in parallel worktrees | Tiny independent fixes, full quality loop each   |
| Item 1 (@heroui/theme) | `/slfg`                         | Medium effort, multiple files, swarm parallelism |
| Batch B (items 4+5)    | `/slfg`                         | Multiple independent test files, swarm           |
| Item 2 (SEO)           | `/lfg`                          | Small, sequential work                           |
| Item 9 (learnings)     | `/ce-compound`                  | Document solutions after each batch              |

### Tools for parallelization

- **Git worktrees** (`/compound-engineering:git-worktree`) — isolated branches for simultaneous work
- **Parallel agents** (Agent tool with `isolation: "worktree"`) — multiple `/lfg` agents on independent tasks
- **Ralph loop** (`/ralph-loop:ralph-loop`) — iterative loops for test rewrites (Item 5)

## Known Issues / Context for Next Session

- `logs/` directory has old ralph loop JSON files that break prettier/lint-staged — delete before committing
- `ralph/CHERRY_PICK_PLAN.md` was committed to main via PR #77 squash merge — gitignored but file exists
- `public/mockServiceWorker.js` shows as modified after `bun install` — MSW auto-generates it, safe to commit or gitignore
- lint-staged runs prettier on ALL files in working tree, not just staged — untracked malformed files will block commits
- Pre-commit hook: `husky` + `lint-staged` (eslint --fix + prettier --write)
- Package manager: `bun` (not npm)
- Test files are in eslint ignorePatterns — not linted in CI
