# Architecture Recommendations

**Total**: 16 recommendations | **Effort**: 40-50 hours

---

## P0 - Critical (Do First - 10-13 hours)

### 1. Presentational/Container Pattern - Dashboard ✅ **COMPLETE**

**Results**: Stories: 109 → 87 LOC, 11 tests passing, no mocking needed

---

### 2. Custom Render Utility

**Problem**: Every test manually wraps providers (30% boilerplate)

**Solution**: Create `src/utils/test-utils/render.tsx`

```typescript
export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: GitHubDataProvider });
}
export * from '@testing-library/react';
export { renderWithProviders as render };
```

**Usage**: `import { render } from '@/utils/test-utils'`

**Effort**: 1-2 hours

---

### 3. Error Boundaries

**Problem**: Uncaught errors crash entire app (blank screen)

**Solution**: Create `src/components/error-boundary.tsx`, wrap providers

```typescript
<ErrorBoundary>
  <Providers>{children}</Providers>
</ErrorBoundary>
```

**Effort**: 2-3 hours

---

### 4. MSW GraphQL Migration

**Problem**: String matching is brittle: `if (body.query.includes("getRepositories"))`

**Solution**: Use operation-based handlers

```typescript
graphql.query('GetRepositories', () => {
  return HttpResponse.json({ data: { ... } });
})
```

**Effort**: 3-4 hours

---

## P1 - High Priority (Do Next - 12-16 hours)

### 5. Extract Custom Hooks from Large Components

**Target**: RepoTable (373 LOC) → ~200 LOC

**Create**:
- `useRepoFilters` - filtering logic
- `useRepoPagination` - pagination logic

**Effort**: 6-8 hours

---

### 6. Add Missing Tests

**Target**: 40% → 70% coverage

**Create**:
- `scroll-button.test.tsx`
- `token-form-section.test.tsx`
- `generate-repos-button.test.tsx`

**Effort**: 4-6 hours

---

### 7. Simplify Storybook with Named Handlers

**Problem**: Dashboard story has 100+ lines of inline MSW

**Solution**: Extract to `src/mocks/story-handlers.ts`

```typescript
export const authenticatedHandlers = [
  graphql.query('GetRepositories', () => ...),
  // ...
];

// In story:
parameters: { msw: { handlers: authenticatedHandlers } }
```

**Effort**: 3-4 hours

---

### 8. Extract Shared Constants

**Create**: `src/config/repo-config.ts`, `src/config/api-config.ts`

**Move**: REPO_TYPES, REPO_ACTIONS, PER_PAGE_OPTIONS, TABLE_COLUMNS

**Effort**: 2 hours

---

### 9. Remove Debug Code

**Create**: `src/utils/debug.ts` with production guards

**Replace**: All `console.*` calls with `debug.*`

**Effort**: 1 hour

---

## P2 - Medium Priority (Nice to Have - 8-12 hours)

### 10. Optimistic Updates

**Add**: Instant UI feedback for archive/delete actions

**Pattern**: SWR optimistic updates, only refetch on error

**Effort**: 3-4 hours

---

### 11. Loading Skeletons

**Create**: `repo-table-skeleton.tsx`

**Impact**: No blank screens while loading

**Effort**: 2-3 hours

---

### 12. Cache Token Validation

**Problem**: Duplicate API calls (format check + API validation + getCurrentUser)

**Solution**: Pass username from validation, skip getCurrentUser

**Effort**: 1-2 hours

---

### 13. Stale Data Indicator

**Create**: `stale-data-badge.tsx` - shows after 5 minutes

**Effort**: 1-2 hours

---

## P3 - Low Priority (Future - 10-15 hours)

### 14. Server-Side Pagination

**Problem**: Fetches all repos upfront (slow for 1000+ repos)

**Solution**: Paginated GraphQL queries

**Effort**: 6-8 hours | **Risk**: High

---

### 15. Cross-Browser E2E Testing

**Add**: Firefox and WebKit to Playwright config

**Effort**: 1 hour

---

### 16. Incremental Loading with Suspense

**Pattern**: Show user repos first, org repos when ready

**Effort**: 8+ hours | **Risk**: Very High

---

## Quick Wins (High Impact, Low Effort)

1. **Presentational/Container Refactor** (P0 #1) - 5-7 hours ⭐
2. Custom Render Utility (P0 #2) - 1-2 hours
3. Extract Constants (P1 #8) - 2 hours
4. Remove Debug Code (P1 #9) - 1 hour

**Total Quick Wins**: 9-12 hours, massive impact

---

## Validation Checklist

After each recommendation:

```bash
npm run test:unit    # Must pass
npm run test:e2e     # Must pass
npm run build        # Must succeed
npm run storybook    # Verify stories work
```

---

## Implementation Order

**Week 1**: P0 #1-4 (Foundation + Critical Fixes)
**Week 2**: P1 #5-7 (Quality + Testing)
**Week 3**: P1 #8-9 + P2 #10-11 (Polish + UX)
**Week 4+**: P2 #12-13, P3 as needed

---

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed rollout strategy.
