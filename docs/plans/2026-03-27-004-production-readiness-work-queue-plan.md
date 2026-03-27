---
title: "Production readiness work queue"
type: refactor
status: active
date: 2026-03-27
---

# Production Readiness Work Queue

## Context

Repo Remover is preparing for production launch as an open-source project. The codebase needs to be clean, well-documented, and trust-inspiring. Users will see AI-assisted commits — the code quality must speak for itself.

8 PRs were merged in the previous session (deps update, heroui removal, E2E mocking, visual polish, source filter fix, sentry scrub, remember me, token password). Main is green.

## Work Items (execute in order)

### 1. Code Cleanup & Documentation Pass (HIGH PRIORITY)

**Goal:** Make the codebase open-source ready — clean, well-organized, well-documented.

This is the most important item. The repo will be public and people will judge the code quality.

**Tasks:**

- Remove dead/unused files: old plan docs in `docs/` that are no longer relevant (ARCHITECTURE_REVIEW, RECOMMENDATIONS, IMPLEMENTATION_PLAN, TESTING_STRATEGY — check if still accurate or stale)
- Remove stale handoff docs in `docs/ai/handoffs/` — these are internal AI session artifacts, not user-facing
- Clean up `docs/plans/` — completed plans can stay but mark status as `completed`
- Remove any leftover debug code, TODO comments that won't be addressed, commented-out code
- Add/improve JSDoc comments on all public exports: hooks, utilities, contexts, providers
- Add file-level doc comments explaining purpose of non-obvious files
- Ensure consistent code formatting (run `bun run lint:fix && bun run format`)
- Review and clean up `package.json` scripts — remove any unused scripts
- Clean up `.gitignore` — ensure it's comprehensive
- Update `README.md` — should reflect current stack (Vite, bun, Tailwind, Cloudflare Workers), accurate setup instructions, proper badges
- Verify all internal links in docs point to files that exist

**Quality bar:** A senior engineer opening this repo should think "this is well-maintained" within 30 seconds. No embarrassing artifacts, no AI slop, no stale references.

**Use:** `/lfg` — this is a single focused pass

**Branch:** `chore/production-cleanup`

### 2. Delight UI Pass — motion.dev Animations

**Goal:** Add tasteful motion.dev (Framer Motion) animations to the landing page.

**Constraints (CRITICAL):**

- MUST respect `prefers-reduced-motion: reduce` — disable/reduce all animations
- MUST disable animations for Argos VRT screenshots — check for `window.__ARGOS_VRT__` or similar flag
- Create a `useReducedMotion()` hook that checks both `prefers-reduced-motion` AND VRT mode

**Suggested animations (2-3 intentional motions, not gratuitous):**

- Hero section: staggered fade-in on load (headline, subtext, CTA appear sequentially)
- Feature sections: fade-in-up on scroll into viewport (intersection observer)
- Testimonial cards: subtle scale-up on hover
- FAQ cards: smooth expand/collapse (may already have this from accordion)

**Use:** `/lfg` with the `compound-engineering:frontend-design` skill for design guidance

**Branch:** `feat/delight-animations`

### 3. SEO + Copy Optimization

**Goal:** Meta tags, Open Graph, structured data, performance optimizations.

**Tasks:**

- Add comprehensive `<meta>` tags (description, keywords, author)
- Add Open Graph tags (og:title, og:description, og:image, og:url)
- Add Twitter Card meta tags
- Add JSON-LD structured data (WebApplication schema)
- Review and polish landing page copy
- Lazy load below-fold sections (dynamic imports)
- Add canonical URL
- Verify all pages have proper `<title>` tags

**Use:** `/lfg`

**Branch:** `feat/seo-optimization`

### 4. Dashboard Resync UX — SWR Stale-While-Revalidate

**Goal:** When returning to dashboard with a stored PAT, show cached data immediately instead of 3s skeleton.

**Approach:**

- SWR already supports `staleWhileRevalidate` — configure it to serve cached data while refreshing in background
- Show a subtle "Refreshing..." indicator instead of full skeleton when stale data exists
- Only show skeleton on first load (no cached data)

**Use:** `/lfg`

**Branch:** `feat/dashboard-swr-cache`

### 5. SAML Org Error Surfacing

**Goal:** Show user-friendly message when org repos fail due to SAML enforcement.

**Current:** Console shows "Resource protected by organization SAML enforcement" but user sees nothing — repos silently missing.

**Approach:**

- Detect SAML error in GraphQL response
- Show a dismissible banner: "Some organization repos couldn't be loaded. [Org Name] requires SAML authentication — authorize your token in your org's SSO settings."
- Link to GitHub's SSO authorization page
- Don't block other repos from loading (partial data is already supported)

**Use:** `/lfg`

**Branch:** `feat/saml-error-banner`

### 6. Post-Deletion Optimistic Updates

**Goal:** Remove rows from table immediately on delete/archive, don't wait for resync.

**Approach:**

- On successful API response, optimistically remove the repo from local state
- Use SWR's `mutate` to update the cache without refetching
- Show success toast/notification
- If the API call fails, revert the optimistic update and show error

**Use:** `/lfg`

**Branch:** `feat/optimistic-updates`

### 7. Hook Extractions (Architecture)

**Goal:** Extract `useRepoSelection` and `useConfirmationModal` hooks from large components.

**Context:** PR #71 attempted this but was closed as stale. Redo fresh against current main.

- `useRepoSelection` from RepoTable — selection state, disabled repo logic, action management
- `useConfirmationModal` from ConfirmationModal — reducer + async batch logic

**Use:** `/lfg`

**Branch:** `refactor/extract-hooks`

## Execution Strategy

### Recommended parallel batches:

**Batch 1 (do first, sequentially):**

- Item 1: Code cleanup — must be done first, touches many files

**Batch 2 (parallel after cleanup):**

- Item 2: Delight UI (landing page only)
- Item 3: SEO (meta tags, mostly `index.html` + `app.tsx`)
- Item 7: Hook extractions (dashboard components only)

**Batch 3 (parallel, after batch 2):**

- Item 4: Dashboard SWR cache
- Item 5: SAML error banner
- Item 6: Optimistic updates

### For each item:

1. Create a feature branch from main
2. Run `/lfg` or `/slfg` with the description above
3. Run `bun run lint && bun run test:unit && bun run build` before committing
4. Push and create PR
5. Verify CI is green

### Important notes:

- Package manager is `bun` (NOT npm)
- E2E tests are fully mocked — no GITHUB_TEST_TOKEN needed
- Theme uses CSS custom properties in `globals.css` via `@theme` directive
- All 44 E2E tests + 340+ unit tests should pass
- Pre-commit hook runs husky + lint-staged (eslint --fix + prettier --write)
- `.claude/worktrees/` is gitignored — don't commit worktree artifacts
