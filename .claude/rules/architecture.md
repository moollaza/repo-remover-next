---
globs: ["src/**"]
description: Architecture review findings, priority recommendations, GitHub API patterns
---

# Architecture & API Patterns

## Core Data Flow

- **GitHub API Integration**: Uses Octokit with GraphQL to fetch user and organization repositories
- **State Management**: React Context (`GitHubContext`) provides authentication state and repository data across components
- **Data Fetching**: SWR for caching and revalidation of GitHub API calls
- **Authentication**: GitHub Personal Access Token (PAT) based authentication

## Key Components Structure

- **Data Provider Layer**: `GitHubDataProvider` wraps the app and manages API calls and state
- **Context Layer**: `GitHubContext` provides typed access to user data, repositories, and authentication state
- **Component Layer**: Reusable UI components built with HeroUI and Tailwind CSS
- **Testing Layer**: MSW for unit tests, real API calls for E2E tests

## GitHub API Best Practices

### GraphQL Optimization

- Only request fields you need
- Use pagination (`first`, `after`) for large datasets
- Batch organization repo fetches in parallel

### Rate Limiting

- All requests must be authenticated (higher limits)
- Wait 1 second between mutative operations
- Respect `X-RateLimit-Remaining` and `retry-after` headers
- Use conditional requests (etag, if-modified-since) when possible

### Error Handling

- Support partial data loading (SSO-protected orgs may fail)
- Never ignore repeated 4xx/5xx errors
- Validate input to prevent validation errors

## Architecture Grades & Targets (2025-10-07 Review)

| Aspect                   | Current               | Target                         |
| ------------------------ | --------------------- | ------------------------------ |
| **Overall Architecture** | A- (90/100)           | A+ (95+)                       |
| **Test Coverage**        | ~40%                  | ~70%                           |
| **Component Complexity** | High (456 LOC max)    | Medium (200 LOC max)           |
| **Type Safety**          | Excellent (Strict TS) | Maintain                       |
| **Performance**          | Good (Memoization)    | Excellent (Optimistic updates) |
| **DX**                   | Good                  | Excellent (Custom test utils)  |

## Priority Recommendations (If Asked to Improve)

### P0 — Critical (Do First)

1. **Presentational/Container Refactor** — fixes broken Storybook setup (see `docs/PRESENTATIONAL_CONTAINER_REFACTOR.md`)
2. Create `src/utils/test-utils/render.tsx` (custom render utility)
3. Add error boundaries (`src/components/error-boundary.tsx`)
4. Migrate MSW to operation-based GraphQL handlers

### P1 — High (Do Next)

5. Extract hooks from `RepoTable` and `ConfirmationModal`
6. Add missing tests (scroll-button, token-form-section, generate-repos-button)
7. Simplify Storybook with named handler sets
8. Extract shared constants to `src/config/`

See `docs/RECOMMENDATIONS.md` for full list and implementation details.

## Storybook Pain Point (CRITICAL TO FIX)

**Current Problem**: Dashboard story requires localStorage + MSW + decorators and still doesn't work.

**Root Cause**: `DashboardPage` is a container component (uses hooks, context, effects) but is being storied directly.

**Solution**: Apply Presentational/Container pattern:

- Extract presentational `Dashboard` component (takes props, zero hooks)
- Keep container logic in `page.tsx` (hooks, effects, routing)
- Stories become trivial: just pass props!

**Impact**:

- Stories: 100+ LOC to 10 LOC (90% reduction)
- No MSW needed, no decorators needed
- All states easily testable

See `docs/PRESENTATIONAL_CONTAINER_REFACTOR.md` for detailed guide.

## Architecture Docs

Detailed architecture docs live in the `docs/` directory:

- `docs/ARCHITECTURE_REVIEW.md` — complete architecture analysis
- `docs/RECOMMENDATIONS.md` — 15 prioritized improvements with code examples
- `docs/IMPLEMENTATION_PLAN.md` — phased rollout strategy
- `docs/TESTING_STRATEGY.md` — testing requirements and best practices

## Environment Setup

### Development Environment

No environment variables required. The app uses:

- MSW for API mocking
- Mock authentication data
- Local-only analytics (console logs instead of tracking)

### Production Environment

Configure optional monitoring services:

1. **Sentry.io** — add `NEXT_PUBLIC_SENTRY_DSN` to `.env.local`
2. **Fathom Analytics** — add `NEXT_PUBLIC_FATHOM_SITE_ID` to `.env.local`

## Documentation Links

### Core Framework & Libraries

- Next.js: https://nextjs.org/docs
- React: https://react.dev/reference/react
- TypeScript: https://www.typescriptlang.org/docs/

### UI & Styling

- HeroUI: https://heroui.com/docs/guide/introduction
- Tailwind CSS: https://tailwindcss.com/docs
- Framer Motion: https://www.framer.com/motion/

### GitHub API & Data Fetching

- Octokit: https://github.com/octokit/octokit.js
- GitHub GraphQL API: https://docs.github.com/en/graphql
- SWR: https://swr.vercel.app/docs/getting-started

### Testing

- Vitest: https://vitest.dev/guide/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Playwright: https://playwright.dev/docs/intro
- MSW: https://mswjs.io/docs/
- Storybook: https://storybook.js.org/docs

### Development Tools

- ESLint: https://eslint.org/docs/latest/
- Prettier: https://prettier.io/docs/en/
- Vite: https://vitejs.dev/guide/

### Production Monitoring

- Sentry.io: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Fathom Analytics: https://usefathom.com/docs
