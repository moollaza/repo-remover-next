# Repo Remover

GitHub repository management tool — bulk view and delete repos. Zero-knowledge, client-side only.

## Stack

Next.js 14 (App Router), React 18, TypeScript, HeroUI + Tailwind CSS, Vitest + RTL + Playwright, MSW, Octokit (GraphQL), SWR, Sentry + Fathom, npm

## Constraints

- Zero-knowledge architecture: all GitHub API calls client-side only, no backend
- PAT-based auth (only viable client-side GitHub auth option)
- No user data, tokens, or PII sent to any server
- Use HeroUI semantic colors (not hardcoded Tailwind colors) for theme support

## Commands

```bash
npm run dev              # dev server (localhost:3000)
npm run build            # production build
npm run lint             # eslint
npm run lint:fix         # eslint with auto-fix
npm run test:unit        # unit tests (vitest)
npm run test:e2e         # playwright E2E tests
npm run test:e2e:fast    # E2E with fast-fail
npm run test:all         # unit + E2E
npm run storybook        # storybook (port 6006)
```

Run `npm run lint && npm run test:unit && npm run build` before every commit.

## Workflow

Uses superpowers workflow. For cross-project standards, see ~/projects/project-hub/standards/.

## Details

- `.claude/rules/security.md` — zero-knowledge architecture, token handling, CSP (always loaded)
- `.claude/rules/testing.md` — MSW patterns, E2E with real GitHub API, type-only imports
- `.claude/rules/components.md` — HeroUI theme system, React patterns, component complexity
- `.claude/rules/architecture.md` — architecture review findings, priority recommendations, API patterns
- Architecture docs in `docs/` (ARCHITECTURE_REVIEW, RECOMMENDATIONS, IMPLEMENTATION_PLAN, TESTING_STRATEGY)
- `AGENTS.md` is a symlink to this file
