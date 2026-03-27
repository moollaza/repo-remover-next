---
title: "fix: E2E mocking for CI + deferred test rewrites"
type: fix
status: active
date: 2026-03-27
---

# E2E Mocking for CI + Deferred Test Rewrites

## Overview

E2E tests fail in CI because `GITHUB_TEST_TOKEN` is empty — tests that need authenticated state must use Playwright `page.route()` mocks instead. Mock infrastructure already exists in `e2e/utils/github-api-mocks.ts` but not all specs use it. Additionally, some test assertions may reference HeroUI-specific patterns that need updating for plain Tailwind/HTML.

## Two-Part Approach

### Part A: Make all E2E tests work without real GitHub token

**Problem:** CI sets `GITHUB_TEST_TOKEN: ""` → tests that depend on real API calls fail.

**Solution:** Ensure every E2E spec uses `page.route()` mocks from `e2e/utils/github-api-mocks.ts`. The mock infrastructure is already comprehensive (GraphQL queries, REST endpoints, localStorage auth, empty repos, invalid tokens, rate limits).

**Specs to audit and fix:**

| Spec File                   | Current State                                   | Needs Mocks?                                                          |
| --------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `e2e/auth-redirect.spec.ts` | Uses real token for authenticated test          | Yes — add `mockLocalStorage` + `mockOctokitInit` + `mockGraphQLRepos` |
| `e2e/dashboard.spec.ts`     | Already uses mocks via `dashboard.setupMocks()` | Verify — may work already                                             |
| `e2e/home.spec.ts`          | Uses real token for validation test             | Yes — add mock for successful validation                              |
| `e2e/layout.spec.ts`        | Tests that need auth use real token             | Yes — add mocks for logged-in tests                                   |
| `e2e/rate-limit.spec.ts`    | Already tests error scenarios                   | Verify — likely works                                                 |
| `e2e/theme-basic.spec.ts`   | Home page only, no auth needed                  | No changes                                                            |
| `e2e/theme.spec.ts`         | Dashboard theme needs auth                      | Yes — add mocks                                                       |

**Auth mock setup order** (from docs/solutions/):

```typescript
await mockLocalStorage(page); // sets secure_pat + secure_login
await mockOctokitInit(page); // GET /user returns MOCK_USER
await mockGraphQLRepos(page); // GraphQL returns mock repos
await page.goto("/dashboard"); // NOW navigate
```

### Part B: Update deferred unit + E2E test assertions

**Unit tests to audit** (check for HeroUI-specific assertions):

| Test File                                               | Likely Changes                                   |
| ------------------------------------------------------- | ------------------------------------------------ |
| `src/components/header.test.tsx`                        | Verify renders correctly with current markup     |
| `src/components/dashboard.test.tsx`                     | Verify prop-based assertions still match         |
| `src/components/repo-loading-progress.test.tsx`         | Check `.text-primary` class assertion            |
| `src/components/scroll-button.test.tsx`                 | Update for static variantMap (no more functions) |
| `src/components/repo-table/confirmation-modal.test.tsx` | Verify modal markup                              |
| `src/components/repo-table/repo-table.test.tsx`         | Check `pointer-events-none`, `opacity-50`        |
| `src/components/repo-table/repo-filters.test.tsx`       | Check `color="danger"` attribute assertions      |

**E2E page objects to audit:**

| File                         | Known HeroUI Workarounds                                                |
| ---------------------------- | ----------------------------------------------------------------------- |
| `e2e/pages/dashboard.ts:101` | Modal buttons: `.evaluate(el => el.click())` — check if still needed    |
| `e2e/pages/dashboard.ts:350` | Select-all: `.dispatchEvent("click")` — check if native input works now |
| `e2e/pages/dashboard.ts:392` | Row checkboxes: same `.dispatchEvent()` pattern                         |

**Strategy:** Run each test file, fix failures, repeat. Don't change tests that already pass.

## Acceptance Criteria

- [ ] All E2E tests pass locally without `GITHUB_TEST_TOKEN` set
- [ ] All unit tests continue passing (325+)
- [ ] CI E2E jobs go green
- [ ] No real GitHub API calls in CI (all mocked via `page.route()`)
- [ ] HeroUI-specific comments/workarounds updated or removed where no longer needed
- [ ] `bun run lint && bun run test:unit && bun run build` passes

## Context

- Mock infrastructure: `e2e/utils/github-api-mocks.ts` (232 lines, already comprehensive)
- Auth keys: `secure_pat` / `secure_login` (see `docs/solutions/secure-storage-key-prefix.md`)
- Dashboard states: skeleton → empty table → populated table (see `docs/solutions/e2e-dashboard-loading-states.md`)
- Known gap: `ConfirmationModal` uses `createPortal` — E2E bypasses may hide real CSS issues

## Sources

- Related work queue: `docs/plans/2026-03-27-001-remaining-work-queue-plan.md` (Items 4+5)
- Auth mock pattern: `docs/solutions/secure-storage-key-prefix.md`
- Loading states: `docs/solutions/e2e-dashboard-loading-states.md`
- CI workflow: `.github/workflows/ci.yml`
