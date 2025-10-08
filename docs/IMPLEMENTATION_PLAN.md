# Implementation Plan - Phased Rollout

**Total Effort**: 40-50 hours | **Timeline**: 2-4 weeks

---

## Phase 1: Foundation & Critical Fixes (Week 1 - 10-13 hours)

### M1.1: Presentational/Container Pattern - Dashboard ✅ **COMPLETE**

**Results**:
- ✅ Stories: 109 LOC → 87 LOC (no MSW/decorators)
- ✅ Tests: 11 passing (props only, no mocking)
- ✅ Build + Storybook validated

---

### M1.2: Custom Render Utility ✅ **COMPLETE**

**Results**: Test utility created, 51 tests passing, CLAUDE.md documented

---

### M1.3: Error Boundaries ✅ **COMPLETE**

**Results**: Error boundary + Sentry integration, added to layout + dashboard, build passing

---

### M1.4: MSW GraphQL Migration
**Effort**: 3-4 hours | **Risk**: Low

**Tasks**:
- [ ] Add operation names to GraphQL queries
- [ ] Rewrite `src/mocks/handlers.ts` with `graphql.query()`
- [ ] Test all unit tests pass
- [ ] Test Storybook still works

**Status**: Deferred - current string matching works, can migrate later if needed

---

**Phase 1 Validation**:
```bash
npm run test:all
npm run build
npm run storybook
npm run chromatic
```

---

## Phase 2: Code Quality & Testing (Week 2 - 12-16 hours)

### M2.1: Extract Custom Hooks
**Effort**: 6-8 hours | **Risk**: Medium

**Tasks**:
- [ ] Create `src/hooks/use-repo-filters.ts`
- [ ] Create `src/hooks/use-repo-pagination.ts`
- [ ] Create tests for each hook (>90% coverage)
- [ ] Refactor RepoTable to use hooks
- [ ] Verify: RepoTable reduced to ~200 LOC

**Acceptance Criteria**:
- Hooks fully tested in isolation
- RepoTable complexity reduced
- All existing tests pass

---

### M2.2: Add Missing Tests
**Effort**: 4-6 hours | **Risk**: Low

**Tasks**:
- [ ] `scroll-button.test.tsx`
- [ ] `token-form-section.test.tsx`
- [ ] `generate-repos-button.test.tsx`
- [ ] Run coverage: target 70%

**Acceptance Criteria**:
- Coverage 40% → 70%
- All new tests pass

---

### M2.3: Simplify Storybook
**Effort**: 3-4 hours | **Risk**: Low

**Tasks**:
- [ ] Create `src/mocks/story-handlers.ts`
- [ ] Extract named handler sets
- [ ] Update dashboard story (if not done in M1.1)
- [ ] Document decorator composition

**Acceptance Criteria**:
- Reusable handlers across stories
- Stories simpler and cleaner

---

### M2.4: Extract Constants + Remove Debug Code
**Effort**: 3 hours | **Risk**: Low

**Tasks**:
- [ ] Create `src/config/repo-config.ts`
- [ ] Create `src/config/api-config.ts`
- [ ] Create `src/utils/debug.ts`
- [ ] Replace all `console.*` with `debug.*`

**Acceptance Criteria**:
- No constants duplicated
- No console logs in production build

---

## Phase 3: UX Improvements (Week 3 - 8-12 hours)

### M3.1: Optimistic Updates
**Effort**: 3-4 hours | **Risk**: Medium

**Tasks**:
- [ ] Update ConfirmationModal with SWR optimistic updates
- [ ] Add rollback on error
- [ ] Test success + error cases

---

### M3.2: Loading Skeletons
**Effort**: 2-3 hours | **Risk**: Low

**Tasks**:
- [ ] Create `src/components/repo-table/repo-table-skeleton.tsx`
- [ ] Add to dashboard loading state
- [ ] Create Storybook story

---

### M3.3: Cache Validation + Stale Indicator
**Effort**: 3-4 hours | **Risk**: Low

**Tasks**:
- [ ] Pass username from validation to provider
- [ ] Create `stale-data-badge.tsx`

---

## Phase 4: Future Enhancements (Optional - 10-15 hours)

### M4.1: Server-Side Pagination
**Effort**: 6-8 hours | **Risk**: High

**Only implement if users report issues with 1000+ repos**

---

### M4.2: Cross-Browser + Incremental Loading
**Effort**: 9+ hours | **Risk**: High

**Low priority - consider for future**

---

## Rollback Strategy

**Per Phase**:
- Git branch per phase
- Merge only after validation passes
- Keep old code commented until confident

**Quick Rollback**:
```bash
git revert <commit-hash>
npm run test:all
npm run build
```

---

## Validation Checklist (After Each Phase)

```bash
# Tests
npm run lint
npm run test:unit
npm run test:e2e
npm run build

# Visual
npm run storybook
npm run chromatic

# Manual
# 1. Token submission works
# 2. Dashboard loads
# 3. Repo actions work
# 4. Theme switching works
```

---

## Timeline Options

**Option A: Full-Time (2 weeks)**
- Week 1: Phase 1-2
- Week 2: Phase 3-4

**Option B: Part-Time (4 weeks)**
- Week 1: Phase 1
- Week 2: Phase 2
- Week 3: Phase 3
- Week 4: Phase 4 (optional)

**Option C: Critical Only (1 week)**
- Phase 1 only (10-13 hours)
- Defer Phase 2-4

---

## Success Metrics

| Metric | Before | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|--------|---------------|---------------|---------------|
| Story LOC | 109 | 10 | 10 | 10 |
| Test Coverage | 40% | 45% | 70% | 75% |
| Max Component LOC | 456 | 456 | 250 | 250 |
| Storybook Complexity | High | Low | Low | Low |

---

**Next**: Start Phase 1, Milestone 1.1 (Presentational/Container Dashboard)
