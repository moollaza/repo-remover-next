# Phase 3 Implementation - Progressive Loading & UX

**Date:** 2025-10-12
**Status:** 🎯 Ready to Implement

---

## 🎯 Phase 3 Priorities

### **P1: Progressive Repo Loading with Parallel Fetching** ⭐⭐⭐
- **Effort:** 6-8 hours
- **Impact:** MASSIVE - makes app feel 10x faster
- **Approach:** Parallel fetch + incremental rendering + progress indicator

### **P2: Loading Skeletons** ⭐⭐
- **Effort:** 2-3 hours
- **Impact:** Visual polish, no layout shift

### **P3: SWR Cache Optimization** ⭐ (Future)
- **Effort:** TBD
- **Impact:** Faster subsequent loads
- **Status:** Research phase, lower priority

---

## 🔍 Current State Analysis

### What Already Works ✅

1. **Logout** - User dropdown with "Log Out" button, clears secure storage
2. **Token Storage** - Uses encrypted `secureStorage` API
3. **Confirmation Modal** - Shows progress during delete/archive
4. **Parallel Org Fetching** - Already fetches orgs in parallel ([github-api.ts:354-359](../src/utils/github-api.ts#L354-L359))

### Critical Performance Issue ⚠️

**Problem:** User sees NOTHING for 10-30+ seconds while ALL data loads

**Current Flow:**
```typescript
// github-api.ts:197-378
1. Fetch personal repos (2-5s)          ← User sees nothing
2. Fetch all orgs list (1-2s)           ← User sees nothing
3. Fetch all org repos in PARALLEL (5-20s) ← User sees nothing
4. Return everything at once            ← BOOM! 550 repos appear
```

**User Experience:**
- User with 50 personal + 5 orgs (100 repos each) = 550 repos
- Waits 30 seconds staring at generic spinner
- No idea if it's working or broken
- Sudden flash of 550 repos

---

## 🚀 M3.1: Progressive Loading with Parallel Fetching

### Goal

**Render repos incrementally** while fetching in parallel, with visual progress feedback.

### Key Insight: Keep Parallel Fetching!

You're absolutely right - we CAN have parallel fetching AND progressive rendering!

**Strategy:**
1. Fetch orgs in **parallel** (keep current speed)
2. Use **callbacks** to render each org as it completes
3. Show **progress indicator** with org count
4. **Cache** partial results with SWR

**No slowdown** - same total time, but user sees progress!

### UI/UX Design

**Where to Show Progress:**

Based on [Dashboard component](../src/components/dashboard.tsx) structure:

```typescript
<section className="py-16">
  <h1>Select Repos to Modify</h1>

  {/* NEW: Progress indicator here (above table) */}
  {isLoading && <RepoLoadingProgress current={2} total={6} currentOrg="acme-corp" />}

  {/* Alert for permission warnings */}
  {permissionWarning && <Alert>...</Alert>}

  {/* Table renders with partial data */}
  <RepoTable repos={repos} />
</section>
```

**Progress Indicator Options:**

**Option A: Inline Banner (RECOMMENDED)** ✅
```
┌──────────────────────────────────────────────┐
│ ⟳ Loading repositories...  2 of 6 complete  │
│ ▓▓▓▓▓▓▓░░░░░░ 33%                          │
│ Currently loading: acme-corp                 │
└──────────────────────────────────────────────┘
```
- Above table
- Doesn't block interaction
- Clear progress visualization
- Auto-dismisses when complete

**Option B: Toast (Not Recommended)** ❌
- Covers content
- Can be dismissed accidentally
- Harder to keep in sync

**Option C: In Table Header** (Alternative)
```
┌─────────────────────────────────────────┐
│ Select Repos to Modify                  │
│ Loading repositories... 2 of 6 complete │
└─────────────────────────────────────────┘
```
- Compact
- Always visible
- But: clutters header

**Decision: Use Option A (Inline Banner)**

### Implementation Plan

#### Step 1: Modify API to Accept Progress Callback

**File:** `src/utils/github-api.ts`

**Add new function:**

```typescript
export interface LoadingProgress {
  stage: 'personal' | 'orgs' | 'complete';
  repos: Repository[];
  user: User | null;
  orgsLoaded: number;
  orgsTotal: number;
  currentOrg?: string;
}

export async function fetchGitHubDataWithProgress(
  [login, pat]: [string, string],
  onProgress: (progress: LoadingProgress) => void
): Promise<FetchResult> {
  const octokit = createThrottledOctokit(pat);

  // 1. Fetch personal repos FIRST
  const userRepoResult = await fetchUserRepos(userLogin);
  const userData = userRepoResult.userData;
  let allRepos = userRepoResult.repos ?? [];

  // Report personal repos immediately
  onProgress({
    stage: 'personal',
    repos: allRepos,
    user: userData,
    orgsLoaded: 0,
    orgsTotal: 0,
  });

  // 2. Fetch orgs list
  const orgs = await fetchAllOrganizations(userLogin);

  // 3. Fetch org repos in PARALLEL (keep current speed!)
  let completedOrgs = 0;
  const orgReposPromises = orgs.map(async (org) => {
    // Fetch this org's repos
    const orgRepos = await fetchAllOrgRepos(org.login);

    // Update counter
    completedOrgs++;

    // Append to allRepos immediately
    allRepos = allRepos.concat(orgRepos);

    // Report progress
    onProgress({
      stage: 'orgs',
      repos: allRepos, // Include all repos so far
      user: userData,
      orgsLoaded: completedOrgs,
      orgsTotal: orgs.length,
      currentOrg: org.login,
    });

    return orgRepos;
  });

  // Wait for all orgs (but already reported progress)
  await Promise.all(orgReposPromises);

  // Final update
  onProgress({
    stage: 'complete',
    repos: allRepos,
    user: userData,
    orgsLoaded: orgs.length,
    orgsTotal: orgs.length,
  });

  return { repos: allRepos, user: userData, error: null };
}
```

**Key Points:**
- ✅ Keeps parallel fetching (no slowdown!)
- ✅ Callback after personal repos (2-3s)
- ✅ Callback after each org completes (incremental)
- ✅ Always passes latest `allRepos` array
- ✅ Progress tracking with orgsLoaded/orgsTotal

#### Step 2: Update Provider to Use Callback

**File:** `src/providers/github-data-provider.tsx`

**Approach:** Use SWR's `mutate` to update cache incrementally

```typescript
export const GitHubDataProvider: React.FC<GitHubProviderProps> = ({ children }) => {
  const [progress, setProgress] = useState<LoadingProgress | null>(null);

  const { data, error, mutate } = useSWR<GitHubFetcherResult>(
    pat ? [login ?? '', pat] : null,
    async ([login, pat]) => {
      // Use callback version
      return await fetchGitHubDataWithProgress([login, pat], (progressUpdate) => {
        // Update progress state
        setProgress(progressUpdate);

        // Update SWR cache immediately with partial data!
        mutate({
          repos: progressUpdate.repos,
          user: progressUpdate.user,
          error: null,
        }, false); // false = don't revalidate
      });
    }
  );

  // Expose progress in context
  const value: GitHubContextType = {
    ...existing,
    progress,
  };

  return <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>;
};
```

**How This Works:**
1. SWR starts fetching
2. Callback fires with personal repos (2-3s) → `mutate` updates cache → Dashboard rerenders with 50 repos
3. Callback fires when org-1 completes (3s) → `mutate` updates cache → Dashboard rerenders with 150 repos
4. Callback fires when org-2 completes (3s) → `mutate` updates cache → Dashboard rerenders with 250 repos
5. Continue until complete

**Result:** User sees repos appearing in real-time, progress updates, parallel speed maintained!

#### Step 3: Create Progress Component

**New File:** `src/components/repo-loading-progress.tsx`

```typescript
import { Progress } from "@heroui/react";
import { ArrowPathIcon } from "@heroicons/react/16/solid";

interface RepoLoadingProgressProps {
  stage: 'personal' | 'orgs' | 'complete';
  orgsLoaded: number;
  orgsTotal: number;
  currentOrg?: string;
}

export default function RepoLoadingProgress({
  stage,
  orgsLoaded,
  orgsTotal,
  currentOrg,
}: RepoLoadingProgressProps) {
  // Auto-dismiss when complete
  if (stage === 'complete') {
    return null;
  }

  const totalSteps = 1 + orgsTotal; // 1 personal + N orgs
  const currentStep = stage === 'personal' ? 1 : 1 + orgsLoaded;
  const percentage = Math.round((currentStep / totalSteps) * 100);

  const label = stage === 'personal'
    ? 'Loading personal repositories...'
    : `Loading organization repositories (${orgsLoaded}/${orgsTotal})...`;

  const subtitle = currentOrg
    ? `Currently loading: ${currentOrg}`
    : '';

  return (
    <div className="mb-6 p-4 bg-content2 rounded-lg border border-divider">
      <div className="flex items-center gap-3 mb-2">
        <ArrowPathIcon className="h-5 w-5 text-primary animate-spin" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{label}</span>
            <span className="text-default-500">{currentStep} of {totalSteps}</span>
          </div>
          {subtitle && (
            <p className="text-xs text-default-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      <Progress
        aria-label="Loading progress"
        value={percentage}
        color="primary"
        size="sm"
        className="w-full"
      />
    </div>
  );
}
```

#### Step 4: Update Dashboard to Show Progress

**File:** `src/components/dashboard.tsx`

```typescript
import RepoLoadingProgress from "@/components/repo-loading-progress";

export default function Dashboard({
  isError,
  isLoading,
  login,
  onRefresh,
  permissionWarning,
  repos,
  progress, // NEW PROP
}: DashboardProps) {
  return (
    <section className="py-16 flex-grow">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-semibold">
          Select Repos to Modify
        </h1>
        {onRefresh && !isLoading && (
          <button onClick={onRefresh}>Refresh Data</button>
        )}
      </div>

      {/* NEW: Show progress while loading */}
      {isLoading && progress && (
        <RepoLoadingProgress
          stage={progress.stage}
          orgsLoaded={progress.orgsLoaded}
          orgsTotal={progress.orgsTotal}
          currentOrg={progress.currentOrg}
        />
      )}

      {/* Errors and warnings */}
      {isError && <Alert color="danger">Error loading repositories</Alert>}
      {permissionWarning && <Alert color="warning">{permissionWarning}</Alert>}

      {/* Table renders with partial or complete data */}
      {(isLoading || (repos && login !== null)) && (
        <RepoTable isLoading={isLoading} login={login} repos={repos} />
      )}
    </section>
  );
}
```

### Acceptance Criteria

- [ ] Personal repos render within 2-3 seconds
- [ ] Org repos render incrementally as parallel fetches complete
- [ ] Progress banner shows "X of Y" organizations loaded
- [ ] Progress banner shows current org being loaded
- [ ] Progress percentage updates in real-time
- [ ] Progress banner auto-dismisses when complete
- [ ] Total load time same as current (parallel maintained)
- [ ] No duplicate repos in table
- [ ] Table doesn't "jump" as new repos load
- [ ] Error handling works for partial failures

### Performance Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Time to First Repos** | 30s | 2-3s | ⭐⭐⭐⭐⭐ 10x better! |
| **Total Load Time** | 30s | 30s | Same (parallel maintained) |
| **Progress Visibility** | ❌ None | ✅ Real-time | ⭐⭐⭐⭐⭐ |
| **Perceived Speed** | ⭐⭐ Slow | ⭐⭐⭐⭐⭐ Fast | Huge win! |

---

## 🎨 M3.2: Loading Skeletons

**Goal:** Show table structure while first repos load (0-3 seconds)

### Implementation

**New File:** `src/components/repo-table/repo-table-skeleton.tsx`

```typescript
import { Skeleton, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";

interface RepoTableSkeletonProps {
  rows?: number;
}

export default function RepoTableSkeleton({ rows = 10 }: RepoTableSkeletonProps) {
  return (
    <Table aria-label="Loading repositories">
      <TableHeader>
        <TableColumn>NAME</TableColumn>
        <TableColumn>VISIBILITY</TableColumn>
        <TableColumn>UPDATED</TableColumn>
        <TableColumn>LANGUAGE</TableColumn>
        <TableColumn>SIZE</TableColumn>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-48 rounded-lg" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20 rounded-lg" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16 rounded-lg" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Dashboard Integration

```typescript
{/* Show skeleton only before first repos arrive */}
{isLoading && (!repos || repos.length === 0) && (
  <RepoTableSkeleton rows={10} />
)}

{/* Once repos start arriving, show real table */}
{repos && repos.length > 0 && (
  <RepoTable repos={repos} />
)}
```

### User Experience Timeline

```
0s:   Submit token → see skeleton table
2s:   Personal repos load → skeleton replaced with 50 real rows + progress shows "1 of 6"
5s:   Org-1 loads → table grows to 150 rows + progress shows "2 of 6"
8s:   Org-2 loads → table grows to 250 rows + progress shows "3 of 6"
...
30s:  All orgs loaded → progress banner fades out
```

---

## 🔄 M3.3: SWR Cache Optimization (Future)

### Research Questions

1. **Can we cache per-org?**
   - Instead of one big cache key, use separate keys per org
   - `swr: ['repos', 'personal', userId]`
   - `swr: ['repos', 'org', orgId]`
   - Benefit: Only refetch changed orgs

2. **Can we use stale-while-revalidate?**
   - Show cached data immediately
   - Fetch fresh data in background
   - Update when complete
   - Benefit: Instant render on subsequent visits

3. **What about org membership changes?**
   - User joins new org → need to fetch it
   - User leaves org → need to remove from cache
   - How to detect changes?

### SWR Features to Explore

From research, SWR provides:

1. **`populateCache` option** - Merge new data into existing cache
2. **`mutate` with function** - Update specific parts of cache
3. **`revalidateOnFocus: false`** - Don't refetch on tab switch (already set)
4. **`dedupingInterval`** - Prevent duplicate requests (already set to 60s)

### Potential Optimization Strategy

```typescript
// Cache structure
const cacheKeys = {
  personal: (userId) => ['repos', 'personal', userId],
  org: (orgId) => ['repos', 'org', orgId],
  orgList: (userId) => ['orgs', userId],
};

// On initial load
const personal = useSWR(cacheKeys.personal(userId));
const orgList = useSWR(cacheKeys.orgList(userId));
const org1 = useSWR(cacheKeys.org(orgList.data[0]));
const org2 = useSWR(cacheKeys.org(orgList.data[1]));
// ... etc

// On subsequent loads
// - Personal repos: cached ✅
// - Org list: cached ✅
// - Each org: cached individually ✅

// If user joins new org:
// - Personal repos: use cache ✅
// - Org list: refetch → see new org
// - New org only: fetch fresh
// - Existing orgs: use cache ✅
```

**Complexity:** HIGH - needs significant refactoring

**Benefit:** Subsequent loads are instant (cache) + only new orgs fetch

**Recommendation:** Phase 4 or later, lower priority than progressive loading

---

## 📊 Phase 3 Success Metrics

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| **Time to First Repos** | 30s | <5s | Manual test with real account |
| **Progress Visibility** | ❌ | ✅ | Visual inspection |
| **Layout Shift** | ⚠️ | ✅ | Skeleton matches table |
| **User Perception** | "Slow" | "Fast" | User feedback |
| **Total Load Time** | 30s | ≤33s | Network tab (10% tolerance) |

---

## 🧪 Testing Strategy

### Unit Tests

**New Tests:**
1. `repo-loading-progress.test.tsx` - Progress component renders correctly
2. `github-api.test.ts` - Callback fires with correct progress data
3. `repo-table-skeleton.test.tsx` - Skeleton matches table structure

### Integration Tests

**New Tests:**
1. Dashboard with progressive loading - repos appear incrementally
2. Progress updates correctly as orgs load
3. Skeleton → real table transition is smooth

### Manual Testing

**Required:**
1. Test with account having 1 org (fast)
2. Test with account having 5+ orgs (realistic)
3. Test with slow network (throttle to 3G)
4. Verify no duplicate repos
5. Verify progress percentages are accurate

---

## 📝 Implementation Checklist

### M3.1: Progressive Loading (6-8 hours)

**Phase A: API Changes (2-3 hours)**
- [ ] Add `fetchGitHubDataWithProgress` function
- [ ] Add progress callback that fires after personal repos
- [ ] Add progress callback that fires after each org
- [ ] Keep parallel fetching (Promise.all)
- [ ] Test callback receives correct data

**Phase B: Provider Integration (2 hours)**
- [ ] Update `github-data-provider.tsx` to use callback
- [ ] Use `mutate` to update SWR cache incrementally
- [ ] Add progress state to context
- [ ] Verify no race conditions

**Phase C: UI Components (1-2 hours)**
- [ ] Create `repo-loading-progress.tsx` component
- [ ] Add progress banner to Dashboard
- [ ] Style with semantic colors (theme-compatible)
- [ ] Add auto-dismiss when complete

**Phase D: Testing (1 hour)**
- [ ] Unit tests for progress component
- [ ] Integration test for incremental rendering
- [ ] Manual test with real account

### M3.2: Loading Skeletons (2-3 hours)

**Phase A: Component Creation (1 hour)**
- [ ] Create `repo-table-skeleton.tsx`
- [ ] Match table structure exactly
- [ ] Use HeroUI Skeleton component
- [ ] Create Storybook story

**Phase B: Integration (30 mins)**
- [ ] Add skeleton to Dashboard
- [ ] Show skeleton only before first repos
- [ ] Smooth transition to real table

**Phase C: Testing (30-60 mins)**
- [ ] Unit tests
- [ ] Visual regression tests
- [ ] Test in light/dark themes

---

## 🚀 Ready to Start?

**Start with M3.1 Phase A** - Modify the API to accept progress callbacks while keeping parallel fetching.

The key insight: **Parallel fetching + progress callbacks = fast AND visible progress!**

No performance trade-off needed. 🎉
