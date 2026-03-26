# Cherry-Pick Plan: Audit → Main

> Selective cherry-pick of valuable audit work from `audit-hardening` onto `audit-cherry-pick` (fresh from main).
> Main removed HeroUI, removed Storybook, rewrote landing page since audit branch forked.
> Read files from audit branch with: `git show audit-hardening:path/to/file`
> Read files from current main with: `cat path/to/file` (we're on audit-cherry-pick which started from main)

## Summary

| Category                      | Count | Strategy                                               |
| ----------------------------- | ----- | ------------------------------------------------------ |
| Clean copy (audit-only files) | ~20   | Copy from audit branch, adjust imports if needed       |
| Adapt (both modified)         | ~18   | Read audit diff, apply logic changes to main's version |
| Skip (obsolete)               | ~17   | Storybook, HeroUI-specific, internal docs              |

## Key Constraints

- Preserve `setPat(pat, remember?)` — "Remember my token" checkbox stays
- Preserve `useLayoutEffect` for storage load (not `useEffect`)
- Preserve SWR key as `["repos", pat]` (not `[login, pat]`)
- Do NOT import from `@heroui/react` or `@heroicons/react`
- Do NOT create `.stories.tsx` files
- Fix fingerprint: use `language + hardwareConcurrency + platform + timezone` (no userAgent, no screen dims)

---

## Phase 1: Config & Infrastructure

- [x] **CP-001** `.eslintrc.json` — ADAPT: Remove perfectionist plugin + config, add config files to ignorePatterns (`vite.config.ts`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `public/`), fix `no-misused-promises` and `no-floating-promises` errors
- [x] **CP-002** `tsconfig.test.json` — COPY from audit branch (new file)
- [x] **CP-003** `vitest.setup.ts` — No meaningful changes (quote style only). Skipped
- [x] **CP-004** `.github/workflows/ci.yml` — ADAPT: added timeout-minutes, typecheck step, GITHUB_TEST_TOKEN secret. Skipped Chromatic job (Storybook removed) and master branch (only main used)

---

## Phase 2: Utility Files (dependency chain — order matters)

### 2a. Token sanitization (foundation for debug.ts)

- [x] **CP-005** `src/utils/sanitize-tokens.ts` — ADAPT: unified SENSITIVE_PATTERNS export, loop-based sanitization
- [x] **CP-006** `src/utils/sanitize-tokens.test.ts` — Replaced with audit's comprehensive version

### 2b. Debug utility (depends on sanitize-tokens)

- [x] **CP-007** `src/utils/debug.ts` — COPY from audit branch
- [x] **CP-008** `src/utils/debug.test.ts` — COPY from audit branch

### 2c. Analytics (depends on debug)

- [x] **CP-009** `src/utils/analytics.ts` — COPY from audit branch
- [x] **CP-010** `src/utils/analytics.test.ts` — COPY from audit branch

### 2d. Sentry (depends on sanitize-tokens)

- [x] **CP-011** `src/utils/sentry-before-send.ts` — COPY from audit branch
- [x] **CP-012** `src/sentry-before-send.test.ts` — COPY from audit branch

### 2e. Secure storage (fingerprint fix)

- [x] **CP-013** `src/utils/secure-storage.ts` — ADAPT: removed userAgent + screen dims from fingerprint, use language/hardwareConcurrency/platform/timezone. Made getBrowserFingerprint private. Fixed getItem to clear corrupted storage instead of returning ciphertext. Removed setItem plaintext fallback
- [x] **CP-014** `src/utils/secure-storage.test.ts` — ADAPT: copied audit tests, replaced screen dimension test with hardwareConcurrency test

### 2f. Other utilities

- [x] **CP-015** `src/utils/create-throttled-octokit.test.ts` — COPY from audit branch
- [x] **CP-016** `src/mocks/static-fixtures.ts` — COPY from audit branch
- [x] **CP-017** `src/mocks/static-fixtures.test.ts` — COPY from audit branch
- [x] **CP-018** `src/mocks/error-handlers.test.ts` — COPY from audit branch. Depends on error handler exports from handlers.ts (CP-028). Tests will fail until then

---

## Phase 3: Context, Hooks & Provider

### 3a. Context (adopt undefined default)

- [x] **CP-019** `src/contexts/github-context.tsx` — ADAPT: context defaults to undefined, preserved remember param
- [x] **CP-020** `src/hooks/use-github-data.ts` — COPY from audit (throwing hook)
- [x] **CP-021** `src/hooks/use-github-data.test.tsx` — COPY from audit
- [x] **CP-022** `src/providers/github-data-provider.tsx` — ADAPT: console→debug, tokenValidatedRef for analytics, preserved useLayoutEffect/SWR key/remember
- [x] **CP-023** `src/providers/github-data-provider.test.tsx` — COPY + ADAPT: added remember=false test, updated persist test for remember param

---

## Phase 4: GitHub API & Mock Infrastructure

- [x] **CP-024** `src/utils/github-api.ts` — COPY from audit (deleted dead fetchGitHubData, console→debug, permissionWarning)
- [x] **CP-025** `src/utils/github-api.test.ts` — COPY from audit
- [x] **CP-026** `src/utils/github-utils.ts` — COPY from audit (dead guard removal, type safety)
- [x] **CP-027** `src/utils/github-utils.test.ts` — COPY from audit
- [x] **CP-028** `src/mocks/handlers.ts` — COPY from audit (operation-based GraphQL, error handlers)
- [x] **CP-029** `src/mocks/server.ts` — COPY from audit

---

## Phase 5: Remaining Hooks

- [x] **CP-030** `src/hooks/use-repo-filters.ts` — COPY from audit
- [x] **CP-031** `src/hooks/use-repo-filters.test.ts` — COPY from audit
- [x] **CP-032** `src/hooks/use-repo-pagination.ts` — COPY from audit
- [x] **CP-033** `src/hooks/use-repo-pagination.test.ts` — COPY from audit

---

## Phase 6: Components (logic adaptation, NOT markup)

For each component: read the audit diff to identify LOGIC changes (bug fixes, error handling, state management). Apply those logic changes to main's Tailwind-based version. Do NOT copy HeroUI markup.

- [x] **CP-034** `src/components/error-boundary.tsx` — ADAPT: added debug import, role="alert", console→debug
- [x] **CP-035** `src/components/error-boundary.test.tsx` — COPY from audit
- [x] **CP-036** `src/components/token-form-section.tsx` — Skipped (no meaningful logic changes)
- [x] **CP-037** `src/components/token-form-section.test.tsx` — COPY from audit
- [x] **CP-038** `src/components/header.tsx` — ADAPT: use context logout() instead of manual secureStorage calls
- [!] **CP-039** `src/components/header.test.tsx` — SKIP: main's header is completely different (plain Tailwind vs HeroUI Navbar). Pre-existing 6 test failures on main. Audit tests not portable
- [x] **CP-040** `src/components/github-token-form.tsx` — ADAPT: error differentiation (401 vs 500 vs network), clear validation on empty input
- [!] **CP-041** `src/components/github-token-form.test.tsx` — DEFER: test was written for HeroUI Input component, main uses plain Tailwind input. Needs rewrite for new component structure
- [!] **CP-042** `src/components/dashboard.test.tsx` — DEFER: main's dashboard was rewritten with different component structure
- [x] **CP-043** `src/components/theme-switcher.test.tsx` — Rewritten for main's Tailwind/Lucide ThemeSwitcher (6 tests)
- [!] **CP-044** `src/components/scroll-button.test.tsx` — DEFER: existing tests already failing on main (pre-existing)
- [!] **CP-045** `src/components/repo-loading-progress.test.tsx` — DEFER: existing tests already failing on main (pre-existing, component structure changed)

---

## Phase 7: Repo Table Components (most complex adaptation)

- [x] **CP-046** `src/components/repo-table/confirmation-modal.tsx` — ADAPT: memoized Octokit (BUG-011), only mutate on close after processing (BUG-013), processedCount in result (BUG-030), `<ul>` not `<ol>` (BUG-027)
- [!] **CP-047** `src/components/repo-table/confirmation-modal.test.tsx` — DEFER: main's modal uses useReducer + plain Tailwind vs audit's HeroUI Modal. Tests need rewrite
- [!] **CP-048** `src/components/repo-table/repo-table.tsx` — DEFER: 699-line diff, completely different component structure (5-column table vs HeroUI Table). Logic fixes need targeted extraction in a dedicated session
- [!] **CP-049** `src/components/repo-table/repo-table.test.tsx` — DEFER: depends on CP-048 component changes
- [!] **CP-050** `src/components/repo-table/repo-filters.tsx` — DEFER: 416-line diff, completely different component structure (plain selects vs HeroUI dropdowns)
- [!] **CP-051** `src/components/repo-table/repo-filters.test.tsx` — DEFER: depends on CP-050 component changes

---

## Phase 8: Routes & App

- [x] **CP-052** `src/routes/dashboard.tsx` — Skipped (main intentionally removed refetchData on mount; void already applied)
- [x] **CP-053** `src/routes/dashboard.test.tsx` — COPY from audit
- [x] **CP-054** `src/main.tsx` — Skipped (no meaningful changes)
- [x] **CP-055** `src/providers/providers.tsx` — Skipped (audit added HeroUIProvider back; main already correct)

---

## Phase 9: E2E Tests

- [x] **CP-056** `e2e/auth-redirect.spec.ts` — COPY from audit
- [x] **CP-057** `e2e/rate-limit.spec.ts` — COPY from audit
- [x] **CP-058** `e2e/theme-basic.spec.ts` — COPY from audit
- [x] **CP-059** `e2e/theme.spec.ts` — COPY from audit
- [!] **CP-060** `e2e/utils/github-api-mocks.ts` — DEFER: 257-line diff, selectors changed between HeroUI and Tailwind
- [!] **CP-061** `e2e/pages/dashboard.ts` — DEFER: 183-line diff, page selectors completely different
- [!] **CP-062** `e2e/pages/home.ts` — DEFER: main rewrote for new landing page
- [!] **CP-063** `e2e/dashboard.spec.ts` — DEFER: depends on CP-060/061 page object changes
- [!] **CP-064** `e2e/home.spec.ts` — DEFER: depends on CP-062 home page object

---

## Phase 10: Misc

- [x] **CP-065** `.env.example` — COPY from audit
- [x] **CP-066** `src/components/fathom-analytics.tsx` — ADAPT: console.warn→debug.warn, initializedRef to prevent tracking before init

---

## SKIP (do not cherry-pick)

These are obsolete — Storybook removed, HeroUI removed, or internal audit tracking:

- `.storybook/decorators.tsx`, `.storybook/main.ts`, `.storybook/preview.tsx`
- `src/components/footer.stories.tsx`
- `src/components/github-token-form.stories.tsx`
- `src/components/header.stories.tsx`
- `src/components/repo-loading-progress.stories.tsx`
- `src/components/repo-table/confirmation-modal.stories.tsx`
- `src/components/repo-table/repo-filters.stories.tsx`
- `src/components/repo-table/repo-table-skeleton.stories.tsx`
- `src/components/repo-table/repo-table.stories.tsx`
- `src/components/scroll-button.stories.tsx`
- `src/components/scrolling-quotes.stories.tsx`
- `src/components/theme-switcher.stories.tsx`
- `src/stories/pages/dashboard.stories.tsx`
- `src/stories/pages/home.stories.tsx`
- `src/mocks/story-handlers.ts`
- `ralph/AUDIT_PLAN.md`, `ralph/AUDIT_PLAN_FULL.md`
- `docs/ROADMAP.md` (main has its own version)
- `README.md` (main has its own version)
