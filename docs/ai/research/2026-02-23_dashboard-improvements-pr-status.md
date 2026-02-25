# Research: dashboard-improvements PR Status & Launch Readiness

## Research Question

Review the current PR (`dashboard-improvements` branch), check what's been done, what's left, and determine a path to launch. Is dark mode working? Are Sentry/Fathom in place? Is the code in good shape?

## Summary

The `dashboard-improvements` branch is a substantial PR (~86 files, +7916/-2053 lines) representing months of architectural improvements. The good news: **dark mode works well**, **116 unit tests pass**, **lint is clean**, and the architecture is solid. The bad news: **35+ TypeScript compilation errors** need fixing before merge. There are also **uncommitted UI density changes** in progress that need to be finished and committed.

Sentry and Fathom analytics infrastructure is fully built into the codebase — they just need production environment variables configured. The analytics code is guarded so it silently no-ops without the env vars, meaning the app works fine without them in development.

## Detailed Findings

### Visual State (Playwright verified)

**Light Mode**: Clean and polished. Hero, feature cards, "See It In Action" (light purple), "Over 235,000" impact (light green), testimonials, token form, and footer all look correct.

**Dark Mode**: Also working correctly. Background is `#111111`, text is white/light. The colored sections render as dark purple / dark green with readable white text. No black-on-black issues. **Dark mode is NOT broken.**

Console warnings observed (non-blocking):
- `Fathom Analytics: NEXT_PUBLIC_FATHOM_SITE_ID is not set` — expected without env vars

### Test State

| Check | Status | Details |
|-------|--------|---------|
| Unit tests | ✅ 116/116 passing | 13 test files, 7.50s |
| Lint | ✅ Clean | No ESLint warnings or errors |
| TypeScript | ❌ 35+ errors | 4 files affected |

**TypeScript errors by file:**

1. **`src/components/header.test.tsx`** (2 errors, lines 5-6)
   - `Cannot find name 'vi'` — Vitest's `vi` not imported

2. **`src/components/repo-table/confirmation-modal.test.tsx`** (1 error, line 24)
   - Mock context missing required `progress` property on `GitHubContextType`

3. **`src/components/repo-table/repo-table.stories.tsx`** (4 errors, lines 16/23/30/37)
   - `isLoading` prop referenced but no longer exists on `RepoTableProps`

4. **`src/hooks/use-repo-filters.test.ts`** (28+ errors)
   - `key` field used in test fixtures but not in Octokit `Repository` type
   - Mock owner objects missing `avatarUrl` and `resourcePath` from `Actor` type

Non-fatal test warnings (tests still pass):
- Multiple `act(...)` warnings in `repo-table-skeleton.test.tsx`, `header.test.tsx`, `github-data-provider.test.tsx`
- `Web Crypto API not available, falling back to plain storage` (expected in test env)

### Uncommitted Changes (in-progress, not yet committed)

The git status shows 7 modified files representing **UI density improvements** per the plan in `docs/UI_DENSITY_IMPROVEMENTS.md`:

| File | Change |
|------|--------|
| `src/components/dashboard.tsx` | Header size `text-3xl→text-2xl`, padding reduction |
| `src/components/repo-table/repo-filters.tsx` | `size="sm"` on inputs, `size="md"` on buttons, gap reduction |
| `src/components/repo-table/repo-filters-skeleton.tsx` | Heights reduced from `h-14` → `h-10` |
| `src/components/repo-table/repo-table.tsx` | Border wrapper div + `classNames` for table styling |
| `src/components/repo-table/repo-table-skeleton.tsx` | Matching border wrapper + classNames |
| `src/components/repo-table/repo-table.test.tsx` | Updated test expectations for new styling |
| `src/components/repo-table/repo-table-skeleton.test.tsx` | Updated test expectations for new styling |

These changes are consistent and coherent — they're implementing the UI density plan from `docs/UI_DENSITY_IMPROVEMENTS.md`.

### Architecture State (What Was Built in This PR)

**Major additions:**
- `src/components/dashboard.tsx` — Presentational/container pattern split (container in `page.tsx`, presentational here)
- `src/hooks/use-repo-filters.ts` + `use-repo-pagination.ts` — Extracted logic from `RepoTable`
- `src/components/error-boundary.tsx` — Error boundary wrapping entire app
- `src/components/fathom-analytics.tsx` + `src/utils/analytics.ts` — Fathom integration
- `instrumentation-client.ts` + `instrumentation.ts` + `sentry.server.config.ts` — Sentry integration
- `src/utils/secure-storage.ts` — AES-GCM encrypted localStorage for PAT tokens
- `src/utils/debug.ts` — Debug utility replacing console.log
- `src/config/repo-config.ts` + `api-config.ts` — Centralized constants
- `src/mocks/story-handlers.ts` + `src/mocks/static-fixtures.ts` — Improved test infrastructure
- `src/utils/test-utils/render.tsx` — Custom render utility wrapping GitHubDataProvider
- `src/components/repo-loading-progress.tsx` — Progress indicator for data fetching
- `src/components/scroll-button.tsx`, `src/components/token-form-section.tsx` — New UI components
- Progressive loading with parallel fetching (Phase 3 improvements)

### Sentry & Fathom Status

**Sentry:**
- ✅ Client config: `instrumentation-client.ts` — privacy-first, token sanitization, production-only
- ✅ Server config: `sentry.server.config.ts` — same privacy guards
- ✅ Error boundary: Integrated into `layout-content.tsx`
- ✅ CSP headers: `*.sentry.io` in `connect-src` in `next.config.mjs`
- ❌ Missing: `NEXT_PUBLIC_SENTRY_DSN` env var (needs to be set in production)

**Fathom Analytics:**
- ✅ Component: `src/components/fathom-analytics.tsx` — production-only, excludes localhost
- ✅ Event tracking: `src/utils/analytics.ts` — archive/delete/CTA/token events
- ✅ Layout: `FathomAnalytics` included in `src/app/layout.tsx`
- ✅ CSP headers: `*.fathom.com` in `next.config.mjs`
- ❌ Missing: `NEXT_PUBLIC_FATHOM_SITE_ID` env var

### Theme / Dark Mode Implementation

- Theme switcher: `src/components/theme-switcher.tsx` using `next-themes`
- Provider: `next-themes` with `defaultTheme: "light"`, `attribute: "class"`
- Tailwind: `darkMode: "class"` + HeroUI dark theme with `background: "#111111"`
- Colors: 100% semantic HeroUI colors (`bg-background`, `text-foreground`, `border-divider`)
- No hardcoded hex colors or Tailwind color utilities in component files
- The `bg-secondary-100`/`bg-success-100` sections adapt correctly in dark mode (render as dark purple/green)

## Key Files Reference

- `src/app/dashboard/page.tsx` — Container component (hooks, routing, data fetching)
- `src/components/dashboard.tsx` — Presentational component (pure UI)
- `src/components/repo-table/repo-table.tsx` — Main table with filtering/pagination
- `src/hooks/use-repo-filters.ts` — Filter logic extracted from RepoTable
- `src/hooks/use-repo-pagination.ts` — Pagination logic extracted from RepoTable
- `src/utils/secure-storage.ts` — AES-GCM token encryption
- `src/utils/analytics.ts` — Fathom event tracking
- `src/components/fathom-analytics.tsx` — Fathom initialization
- `instrumentation-client.ts` — Sentry client configuration
- `docs/UI_DENSITY_IMPROVEMENTS.md` — In-progress UI density plan

## Launch Readiness Blockers

### Must Fix Before Merge
1. **TypeScript errors** (35+ in 4 files) — `npx tsc --noEmit` must pass
2. **Commit uncommitted UI density changes** — or revert if incomplete

### Must Configure Before Going Live
3. **Sentry DSN** — Set `NEXT_PUBLIC_SENTRY_DSN` in production env
4. **Fathom Site ID** — Set `NEXT_PUBLIC_FATHOM_SITE_ID` in production env

### Should Verify Before Merge
5. **E2E tests** — Run `npm run test:e2e:fast` to validate dashboard flow
6. **Build** — Run `npm run build` to catch any remaining issues

### Nice to Have (Post-Launch)
7. Fix `act()` warnings in tests (non-critical, tests still pass)
8. Complete remaining UI density changes from `docs/UI_DENSITY_IMPROVEMENTS.md`
9. Analytics event calls wired up through the UI

## Proposed Launch Plan

```
Phase 1: Fix TypeScript (current branch, ~30-60 min)
  ├── Fix header.test.tsx (add vi import)
  ├── Fix confirmation-modal.test.tsx (add progress to mock)
  ├── Fix repo-table.stories.tsx (remove isLoading prop refs)
  └── Fix use-repo-filters.test.ts (fix key field + Actor type mocks)

Phase 2: Finish & commit in-progress UI work (current branch)
  ├── Verify uncommitted changes look correct in browser
  ├── Commit UI density improvements
  └── Run full test suite

Phase 3: Merge PR → main

Phase 4: Configure production env vars
  ├── Create Sentry project → get DSN
  ├── Create Fathom site → get Site ID
  └── Set in Vercel/production env

Phase 5: Deploy
```
