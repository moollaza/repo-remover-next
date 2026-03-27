# Next Session Prompt

Copy everything below the line and paste into a fresh Claude Code session.

---

Read `docs/plans/2026-03-27-004-production-readiness-work-queue-plan.md` — this is your work queue.

## Context

8 PRs were merged today. Main is green (340+ unit tests, 44 E2E tests, lint clean, build passes). The app is functionally complete and deployed on Cloudflare Workers. Now we need to make it production-ready as an open-source project.

## Execution Plan

Execute these 7 items. Use CE workflows (`/lfg` or `/slfg`) for each. Create separate PRs for each item. Run `bun run lint && bun run test:unit && bun run build` before every commit.

### Batch 1 — Do first (sequential, touches many files):

1. **Code cleanup & documentation** (`/lfg`) — Remove dead files, add JSDoc comments, update README, clean up docs/. This is the most important item — the repo is going open-source and code quality must be impeccable. Branch: `chore/production-cleanup`

### Batch 2 — Parallel after cleanup merges:

2. **Delight UI** (`/lfg`) — motion.dev animations for landing page. MUST respect `prefers-reduced-motion` and disable for Argos VRT. Branch: `feat/delight-animations`
3. **SEO + copy** (`/lfg`) — Meta tags, OG, structured data, copy polish. Branch: `feat/seo-optimization`
4. **Hook extractions** (`/lfg`) — useRepoSelection + useConfirmationModal from large components. Branch: `refactor/extract-hooks`

### Batch 3 — After batch 2:

5. **Dashboard SWR cache** (`/lfg`) — Show cached data on return instead of skeleton. Branch: `feat/dashboard-swr-cache`
6. **SAML error banner** (`/lfg`) — Surface org SAML errors to users. Branch: `feat/saml-error-banner`
7. **Optimistic updates** (`/lfg`) — Remove rows immediately on delete/archive. Branch: `feat/optimistic-updates`

## Rules

- Package manager: `bun` (NOT npm)
- Always create feature branches from main, never push to main directly
- Run full verification before commits: `bun run lint && bun run test:unit && bun run build`
- Push branches and create PRs with `gh pr create`
- Merge PRs when CI is green: `gh pr merge <number> --squash`
- Pull main between batches: `git checkout main && git pull origin main`
- Use `/cleanup` after each item before committing

## Quality Standards (CRITICAL for Item 1)

This is an open-source repo. People will judge the code. AI-assisted commits are visible in git history. The code must:

- Be well-organized with clear file/folder structure
- Have meaningful JSDoc comments on public APIs (hooks, utilities, contexts)
- Have no dead code, stale references, or embarrassing artifacts
- Have a professional README with accurate setup instructions
- Have clean git history with descriptive commit messages
- Pass the "senior engineer opens repo" test — they should think "this is well-maintained"
