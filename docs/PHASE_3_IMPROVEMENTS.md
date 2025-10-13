# Phase 3 Improvements - Loading UX Enhancement Plan

**Date:** 2025-10-12
**Status:** 🎯 Ready to Implement
**Context:** Phase 3 progressive loading has been partially implemented but has critical UX issues

---

## 🔍 Issues Identified

### Critical Issues ⚠️

1. **Skeleton doesn't match real table structure**
   - ❌ Skeleton shows only 2 columns (NAME, LAST UPDATED)
   - ✅ Real table shows complex first column with repo details + chips + description
   - ❌ Missing filters section entirely → causes major layout shift
   - **Impact:** Jarring visual jump when repos load, poor perceived performance

2. **No progress indicator shown**
   - ❌ RepoLoadingProgress component exists but shows NOTHING during load
   - ❌ No stories exist for RepoLoadingProgress
   - ❌ Progress prop is passed but never visible to user
   - **Impact:** User has no feedback during 2-30 second load time

3. **Header PAT detection broken on homepage**
   - ❌ Header doesn't detect PAT in localStorage on homepage
   - ❌ "Go to Dashboard" button doesn't appear even when authenticated
   - ❌ No stories for authenticated header state on homepage
   - **Impact:** Users forced to re-enter credentials even though they're logged in

4. **Avatar dropdown UX unclear**
   - ❌ No visual indication that avatar is clickable/dropdown
   - ❌ Users don't know they can log out
   - **Impact:** Poor discoverability, users can't find logout

### Missing Components

- ❌ No `repo-loading-progress.stories.tsx`
- ❌ No `repo-loading-progress.test.tsx`
- ❌ No `repo-table-skeleton.stories.tsx`
- ❌ No `repo-table-skeleton.test.tsx`
- ❌ No header authentication state tests
- ❌ Dashboard "Loading" story doesn't show progress indicator

---

## 📊 Current Implementation Analysis

### What Works ✅

1. **Progressive fetching implemented** ([github-data-provider.tsx:92-106](../src/providers/github-data-provider.tsx#L92-L106))
   - `fetchGitHubDataWithProgress` exists and fires callbacks
   - SWR cache updates incrementally with `mutate`
   - Progress state tracked in provider

2. **RepoLoadingProgress component exists** ([repo-loading-progress.tsx](../src/components/repo-loading-progress.tsx))
   - Shows org count (X of Y)
   - Shows current org being loaded
   - Progress bar with percentage
   - Auto-dismisses when complete

3. **RepoTableSkeleton component exists** ([repo-table-skeleton.tsx](../src/components/repo-table-skeleton.tsx))
   - Uses HeroUI Skeleton components
   - Renders table structure

### What's Broken ❌

1. **Progress never visible** ([dashboard.tsx:63-70](../src/components/dashboard.tsx#L63-L70))
   ```typescript
   {isLoading && progress && (
     <RepoLoadingProgress ... />
   )}
   ```
   **Problem:** `progress` prop is always null or doesn't reach component
   **Root cause:** Need to investigate provider → page → dashboard prop flow

2. **Skeleton structure wrong** ([repo-table-skeleton.tsx:20-22](../src/components/repo-table-skeleton.tsx#L20-L22))
   ```typescript
   <TableColumn className="w-4/5">NAME</TableColumn>
   <TableColumn className="w-1/5">LAST UPDATED</TableColumn>
   ```
   **Problem:** Real table has rich first column, skeleton is oversimplified

3. **Filters missing from skeleton view** ([dashboard.tsx:90-93](../src/components/dashboard.tsx#L90-L93))
   ```typescript
   {isLoading && (!repos || repos.length === 0) && (
     <RepoTableSkeleton rows={10} />
   )}
   ```
   **Problem:** RepoTable includes RepoFilters, but skeleton doesn't → layout shift

4. **Header PAT detection** ([header.tsx:30](../src/components/header.tsx#L30))
   ```typescript
   const { login, pat, user } = useGitHubData();
   ```
   **Problem:** Context hook returns correct values but button logic on line 124-129 requires BOTH `pat` AND `login`
   **Root cause:** Login is optional initially, PAT alone should be enough to show button

---

## 🎯 Implementation Plan

### P0: Fix Critical UX Issues (6-8 hours)

#### M3-I1: Fix Skeleton Table Structure (2 hours)

**Goal:** Make skeleton match real table exactly to prevent layout shift

**Changes needed:**

1. **Add filters skeleton** to match [repo-filters.tsx:88-197](../src/components/repo-table/repo-filters.tsx#L88-L197)

```typescript
// New component: src/components/repo-table/repo-filters-skeleton.tsx
export default function RepoFiltersSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Per page selector skeleton */}
      <div className="col-span-2">
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>

      {/* Repo type selector skeleton */}
      <div className="col-span-6">
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>

      {/* Search input skeleton */}
      <div className="col-span-4">
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>

      {/* Action buttons skeleton */}
      <div className="col-span-3">
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  );
}
```

2. **Update RepoTableSkeleton** to match real table structure from [repo-table.tsx:227-270](../src/components/repo-table/repo-table.tsx#L227-L270)

```typescript
// src/components/repo-table/repo-table-skeleton.tsx
export default function RepoTableSkeleton({ rows = 10 }: RepoTableSkeletonProps) {
  return (
    <div className="space-y-5" data-testid="repo-table-skeleton-container">
      {/* Add filters skeleton */}
      <RepoFiltersSkeleton />

      {/* Table skeleton */}
      <Table aria-label="Loading repositories">
        <TableHeader>
          <TableColumn className="w-4/5">NAME</TableColumn>
          <TableColumn className="w-1/5">LAST UPDATED</TableColumn>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                {/* Match real structure: name + chips + owner + description */}
                <div>
                  {/* Repo name */}
                  <div className="mb-2">
                    <Skeleton className="h-7 w-48 rounded-lg" />
                  </div>
                  {/* Chips row */}
                  <div className="flex gap-2 mb-5">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  {/* Owner */}
                  <div className="mb-2">
                    <Skeleton className="h-4 w-32 rounded-lg" />
                  </div>
                  {/* Description */}
                  <Skeleton className="h-4 w-full rounded-lg" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20 rounded-lg" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

3. **Add pagination skeleton** (optional but recommended)
   - Bottom pagination from [repo-table.tsx:175-187](../src/components/repo-table/repo-table.tsx#L175-L187)
   - Just center skeleton element

**Acceptance Criteria:**
- [ ] Skeleton shows filters section
- [ ] Skeleton table structure matches real table (chips, owner, description)
- [ ] No layout shift when repos load
- [ ] Smooth visual transition

---

#### M3-I2: Debug and Fix Progress Indicator (2-3 hours)

**Goal:** Make progress indicator actually visible during loading

**Investigation needed:**

1. **Check progress flow:**
   - [github-data-provider.tsx:93-106](../src/providers/github-data-provider.tsx#L93-L106) - Does callback fire?
   - [github-data-provider.tsx:237](../src/providers/github-data-provider.tsx#L237) - Is progress in context?
   - [app/dashboard/page.tsx] - Does page pass progress to Dashboard?

2. **Add debugging:**
```typescript
// In github-data-provider.tsx callback
console.log('Progress update:', progressUpdate);

// In Dashboard component
console.log('Dashboard progress prop:', progress);
```

3. **Likely fix needed in page.tsx:**

Check [src/app/dashboard/page.tsx] to ensure progress is passed:

```typescript
export default function DashboardPage() {
  const { repos, user, isLoading, isError, permissionWarning, progress } = useGitHubData();

  return (
    <Dashboard
      repos={repos}
      user={user}
      isLoading={isLoading}
      isError={isError}
      permissionWarning={permissionWarning}
      progress={progress}  // ← Make sure this is passed!
    />
  );
}
```

**Alternate approach if progress callback doesn't fire:**

The issue might be that progress updates happen during initial fetch, but component mounts after fetch completes. Need to ensure:

1. Progress persists in provider state
2. Component receives initial progress value
3. Dashboard shows progress even if stage is 'personal' or 'orgs'

**Acceptance Criteria:**
- [ ] Progress indicator appears within 2-3 seconds of load
- [ ] Shows "Loading personal repositories..." initially
- [ ] Updates to "Loading organization repositories (X/Y)..."
- [ ] Shows current org name
- [ ] Progress bar animates
- [ ] Auto-dismisses when complete

---

#### M3-I3: Fix Header PAT Detection (1 hour)

**Goal:** Show "Go to Dashboard" button when PAT exists in storage

**Root cause analysis** ([header.tsx:124-129](../src/components/header.tsx#L124-L129)):

```typescript
pat && login && (
  <Button as={Link} color="primary" href="/dashboard" variant="flat">
    Go to Dashboard
  </Button>
)
```

**Problem:** Requires both `pat` AND `login`, but login may not be set initially

**Fix option 1: Only check PAT**
```typescript
{!isDashboard && pat && (
  <Button as={Link} color="primary" href="/dashboard" variant="flat">
    Go to Dashboard
  </Button>
)}
```

**Fix option 2: Check isAuthenticated**
```typescript
const { isAuthenticated, user } = useGitHubData();

{!isDashboard && isAuthenticated && (
  <Button as={Link} color="primary" href="/dashboard" variant="flat">
    Go to Dashboard
  </Button>
)}
```

**Recommendation:** Use option 2 (isAuthenticated) as it's the proper derived state

**Test scenarios:**
- [ ] User submits PAT → goes to dashboard → returns home → button shows
- [ ] User refreshes homepage → button shows if authenticated
- [ ] User logs out → button disappears
- [ ] User never authenticated → button doesn't show

---

#### M3-I4: Improve Avatar Dropdown UX (1 hour)

**Goal:** Make it obvious the avatar is interactive

**Current state** ([header.tsx:89-121](../src/components/header.tsx#L89-L121)):
- User component in dropdown trigger
- No hover state
- No cursor indication
- No tooltip

**Option 1: Add hover effect + cursor (Recommended)**

```typescript
<DropdownTrigger>
  <div className="cursor-pointer transition-opacity hover:opacity-80">
    <User
      avatarProps={{
        showFallback: true,
        src: user?.avatarUrl as string,
      }}
      description={
        <Link href={user?.url as string ?? "https://github.com"} isExternal size="sm">
          {user?.login}
        </Link>
      }
      name={user?.name}
    />
  </div>
</DropdownTrigger>
```

**Option 2: Add chevron icon**

```typescript
<DropdownTrigger>
  <div className="flex items-center gap-2 cursor-pointer">
    <User ... />
    <ChevronDownIcon className="h-4 w-4 text-default-400" />
  </div>
</DropdownTrigger>
```

**Option 3: Use Button wrapper**

```typescript
<DropdownTrigger>
  <Button
    variant="light"
    className="h-auto p-2"
    startContent={
      <User
        avatarProps={{
          showFallback: true,
          src: user?.avatarUrl as string,
          size: "sm",
        }}
      />
    }
    endContent={<ChevronDownIcon className="h-4 w-4" />}
  >
    {user?.name ?? user?.login}
  </Button>
</DropdownTrigger>
```

**Recommendation:** Start with Option 1 (simplest), test, then try Option 2 if needed

**Acceptance Criteria:**
- [ ] Cursor changes to pointer on hover
- [ ] Visual feedback on hover (opacity/color change)
- [ ] Clear that element is interactive
- [ ] Dropdown still works correctly

---

### P1: Add Missing Tests & Stories (4-6 hours)

#### M3-I5: Create RepoLoadingProgress Stories (1 hour)

**New file:** `src/components/repo-loading-progress.stories.tsx`

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import RepoLoadingProgress from "@/components/repo-loading-progress";

const meta: Meta<typeof RepoLoadingProgress> = {
  component: RepoLoadingProgress,
  title: "Components/RepoLoadingProgress",
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof RepoLoadingProgress>;

/** Loading personal repositories (stage 1) */
export const PersonalRepos: Story = {
  args: {
    stage: "personal",
    orgsLoaded: 0,
    orgsTotal: 5,
  },
};

/** Loading org repositories - first org */
export const FirstOrg: Story = {
  args: {
    stage: "orgs",
    orgsLoaded: 1,
    orgsTotal: 5,
    currentOrg: "acme-corp",
  },
};

/** Loading org repositories - mid progress */
export const MidProgress: Story = {
  args: {
    stage: "orgs",
    orgsLoaded: 3,
    orgsTotal: 5,
    currentOrg: "big-tech-company",
  },
};

/** Loading org repositories - almost done */
export const AlmostComplete: Story = {
  args: {
    stage: "orgs",
    orgsLoaded: 4,
    orgsTotal: 5,
    currentOrg: "open-source-foundation",
  },
};

/** Complete stage (should auto-dismiss - renders nothing) */
export const Complete: Story = {
  args: {
    stage: "complete",
    orgsLoaded: 5,
    orgsTotal: 5,
  },
};

/** Single org user */
export const SingleOrg: Story = {
  args: {
    stage: "orgs",
    orgsLoaded: 0,
    orgsTotal: 1,
    currentOrg: "startup-inc",
  },
};

/** Many orgs user */
export const ManyOrgs: Story = {
  args: {
    stage: "orgs",
    orgsLoaded: 8,
    orgsTotal: 15,
    currentOrg: "enterprise-division-7",
  },
};
```

---

#### M3-I6: Create RepoTableSkeleton Stories (1 hour)

**New file:** `src/components/repo-table/repo-table-skeleton.stories.tsx`

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import RepoTableSkeleton from "@/components/repo-table/repo-table-skeleton";

const meta: Meta<typeof RepoTableSkeleton> = {
  component: RepoTableSkeleton,
  title: "Components/RepoTable/Skeleton",
  parameters: {
    layout: "fullscreen",
    chromatic: {
      modes: {
        light: { theme: "light" },
        dark: { theme: "dark" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RepoTableSkeleton>;

/** Default skeleton with 10 rows */
export const Default: Story = {
  args: {
    rows: 10,
  },
};

/** Fewer rows (first page of 5) */
export const FiveRows: Story = {
  args: {
    rows: 5,
  },
};

/** Many rows (first page of 20) */
export const TwentyRows: Story = {
  args: {
    rows: 20,
  },
};

/** Minimal skeleton (3 rows) */
export const MinimalRows: Story = {
  args: {
    rows: 3,
  },
};
```

---

#### M3-I7: Add Unit Tests (2 hours)

**New file:** `src/components/repo-loading-progress.test.tsx`

```typescript
import { render, screen } from "@/utils/test-utils";
import RepoLoadingProgress from "@/components/repo-loading-progress";

describe("RepoLoadingProgress", () => {
  it("renders personal repos stage", () => {
    render(
      <RepoLoadingProgress
        stage="personal"
        orgsLoaded={0}
        orgsTotal={5}
      />
    );

    expect(screen.getByText(/Loading personal repositories/i)).toBeInTheDocument();
    expect(screen.getByText(/1 of 6/)).toBeInTheDocument(); // 1 personal + 5 orgs
  });

  it("renders org repos stage with current org", () => {
    render(
      <RepoLoadingProgress
        stage="orgs"
        orgsLoaded={2}
        orgsTotal={5}
        currentOrg="acme-corp"
      />
    );

    expect(screen.getByText(/Loading organization repositories/i)).toBeInTheDocument();
    expect(screen.getByText(/2\/5/)).toBeInTheDocument();
    expect(screen.getByText(/Currently loading: acme-corp/i)).toBeInTheDocument();
  });

  it("calculates progress percentage correctly", () => {
    render(
      <RepoLoadingProgress
        stage="orgs"
        orgsLoaded={3}
        orgsTotal={5}
      />
    );

    // 1 personal + 3 orgs complete out of 1 + 5 = 4/6 = 67%
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "67");
  });

  it("auto-dismisses when complete", () => {
    const { container } = render(
      <RepoLoadingProgress
        stage="complete"
        orgsLoaded={5}
        orgsTotal={5}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows spinning icon", () => {
    render(
      <RepoLoadingProgress
        stage="personal"
        orgsLoaded={0}
        orgsTotal={5}
      />
    );

    const icon = screen.getByRole("img", { hidden: true });
    expect(icon).toHaveClass("animate-spin");
  });
});
```

**New file:** `src/components/repo-table/repo-table-skeleton.test.tsx`

```typescript
import { render, screen } from "@/utils/test-utils";
import RepoTableSkeleton from "@/components/repo-table/repo-table-skeleton";

describe("RepoTableSkeleton", () => {
  it("renders with default 10 rows", () => {
    render(<RepoTableSkeleton />);

    const rows = screen.getAllByRole("row");
    // 1 header + 10 body rows
    expect(rows).toHaveLength(11);
  });

  it("renders custom number of rows", () => {
    render(<RepoTableSkeleton rows={5} />);

    const rows = screen.getAllByRole("row");
    // 1 header + 5 body rows
    expect(rows).toHaveLength(6);
  });

  it("renders filter skeletons", () => {
    const { container } = render(<RepoTableSkeleton />);

    // Should have filters container
    expect(container.querySelector(".grid.grid-cols-12")).toBeInTheDocument();
  });

  it("has accessible table label", () => {
    render(<RepoTableSkeleton />);

    expect(screen.getByLabelText("Loading repositories")).toBeInTheDocument();
  });

  it("renders NAME and LAST UPDATED columns", () => {
    render(<RepoTableSkeleton />);

    expect(screen.getByText("NAME")).toBeInTheDocument();
    expect(screen.getByText("LAST UPDATED")).toBeInTheDocument();
  });
});
```

---

#### M3-I8: Add Header Authentication Tests (1 hour)

**Update:** `src/components/header.test.tsx` (or create if doesn't exist)

```typescript
import { render, screen } from "@/utils/test-utils";
import Header from "@/components/header";

describe("Header", () => {
  describe("Authentication states", () => {
    it("shows logo on all pages", () => {
      render(<Header />);
      expect(screen.getByText("Repo Remover")).toBeInTheDocument();
    });

    it("shows Go to Dashboard button when authenticated on homepage", () => {
      // Mock authenticated state
      const { rerender } = render(<Header />, {
        providerProps: {
          initialAuth: {
            pat: "ghp_test123",
            login: "testuser",
          },
        },
      });

      // Simulate homepage
      expect(screen.getByRole("button", { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it("hides Go to Dashboard button on dashboard page", () => {
      render(<Header />, {
        providerProps: {
          initialAuth: {
            pat: "ghp_test123",
            login: "testuser",
          },
        },
        routerProps: {
          pathname: "/dashboard",
        },
      });

      expect(screen.queryByRole("button", { name: /go to dashboard/i })).not.toBeInTheDocument();
    });

    it("shows user dropdown on dashboard when authenticated", () => {
      render(<Header />, {
        providerProps: {
          initialAuth: {
            pat: "ghp_test123",
            login: "testuser",
          },
        },
        routerProps: {
          pathname: "/dashboard",
        },
      });

      expect(screen.getByText("testuser")).toBeInTheDocument();
    });

    it("shows logout option in dropdown", async () => {
      const { user } = render(<Header />, {
        providerProps: {
          initialAuth: {
            pat: "ghp_test123",
            login: "testuser",
          },
        },
        routerProps: {
          pathname: "/dashboard",
        },
      });

      // Click dropdown trigger
      const avatar = screen.getByRole("button");
      await user.click(avatar);

      expect(screen.getByText("Log Out")).toBeInTheDocument();
    });
  });
});
```

---

#### M3-I9: Update Dashboard Stories (30 mins)

**Update:** `src/stories/pages/dashboard.stories.tsx`

Add progressive loading stories:

```typescript
/** Loading with progress - personal repos stage */
export const LoadingPersonal: Story = {
  args: {
    isError: false,
    isLoading: true,
    login: MOCK_USER.login,
    repos: null,
    progress: {
      stage: "personal",
      repos: [],
      user: null,
      orgsLoaded: 0,
      orgsTotal: 5,
    },
  },
};

/** Loading with progress - orgs stage */
export const LoadingOrgs: Story = {
  args: {
    isError: false,
    isLoading: true,
    login: MOCK_USER.login,
    repos: MOCK_REPOS.slice(0, 50), // Some personal repos already loaded
    progress: {
      stage: "orgs",
      repos: MOCK_REPOS.slice(0, 50),
      user: MOCK_USER,
      orgsLoaded: 2,
      orgsTotal: 5,
      currentOrg: "acme-corp",
    },
  },
};

/** Progressive loading simulation - shows repos appearing */
export const ProgressiveLoading: Story = {
  args: {
    isError: false,
    isLoading: true,
    login: MOCK_USER.login,
    repos: MOCK_REPOS.slice(0, 20), // Partial data
    progress: {
      stage: "orgs",
      repos: MOCK_REPOS.slice(0, 20),
      user: MOCK_USER,
      orgsLoaded: 1,
      orgsTotal: 3,
      currentOrg: "tech-startup",
    },
  },
};
```

---

### P2: Documentation & Polish (1 hour)

#### M3-I10: Update PHASE_3_FINAL.md

Add section documenting:
- Issues found during implementation
- Solutions applied
- New stories/tests added
- Screenshots of before/after

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Skeleton Loading:**
- [ ] Open dashboard while logged out → enter PAT → see skeleton
- [ ] Skeleton shows filters section
- [ ] Skeleton table structure matches real table
- [ ] No layout shift when repos appear
- [ ] Test in both light and dark themes

**Progress Indicator:**
- [ ] Submit PAT with account having 5+ orgs
- [ ] Progress banner appears within 2-3 seconds
- [ ] Shows "Loading personal repositories..." first
- [ ] Updates to show org progress (X of Y)
- [ ] Shows current org name
- [ ] Progress bar animates smoothly
- [ ] Banner auto-dismisses when complete

**Header Authentication:**
- [ ] Fresh browser → no PAT → no "Go to Dashboard" button
- [ ] Submit PAT → go to dashboard → return home → button appears
- [ ] Refresh homepage → button still there
- [ ] Log out → button disappears
- [ ] Click "Go to Dashboard" → navigates correctly

**Avatar Dropdown:**
- [ ] Hover over avatar → cursor changes to pointer
- [ ] Hover → visual feedback (opacity/color change)
- [ ] Click avatar → dropdown opens
- [ ] Dropdown shows user info
- [ ] "Log Out" option visible and works

### Automated Testing

```bash
# Run all tests
npm run test:unit

# Run specific component tests
npm run test:unit repo-loading-progress
npm run test:unit repo-table-skeleton
npm run test:unit header

# Visual regression tests
npm run build-storybook
```

### Storybook Visual Testing

```bash
npm run storybook
```

**Stories to review:**
- Components/RepoLoadingProgress (all variants)
- Components/RepoTable/Skeleton (all row counts)
- Pages/Dashboard/LoadingPersonal
- Pages/Dashboard/LoadingOrgs
- Pages/Dashboard/ProgressiveLoading
- Components/Header/LoggedIn
- Components/Header/Dashboard

---

## 📊 Success Metrics

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| **Layout Shift** | High (no filters) | Zero | Visual inspection |
| **Progress Visibility** | ❌ None | ✅ Always shown | Manual test |
| **Time to Visual Feedback** | 30s | <3s | Stopwatch |
| **Header PAT Detection** | ❌ Broken | ✅ Works | Refresh homepage test |
| **Dropdown Discoverability** | Low | High | User testing |
| **Test Coverage** | ~40% | ~50% | npm run test:unit -- --coverage |
| **Story Coverage** | Missing 4 components | Complete | Storybook check |

---

## 🚀 Implementation Order

### Day 1 (4-5 hours)
1. ✅ M3-I1: Fix skeleton structure (2h)
2. ✅ M3-I2: Debug progress indicator (2-3h)

### Day 2 (3-4 hours)
3. ✅ M3-I3: Fix header PAT detection (1h)
4. ✅ M3-I4: Improve avatar UX (1h)
5. ✅ M3-I5: Create progress stories (1h)
6. ✅ M3-I6: Create skeleton stories (1h)

### Day 3 (2-3 hours)
7. ✅ M3-I7: Add unit tests (2h)
8. ✅ M3-I8: Add header tests (1h)

### Final (1 hour)
9. ✅ M3-I9: Update dashboard stories (30m)
10. ✅ M3-I10: Update documentation (30m)

**Total Effort:** 10-13 hours

---

## 🔍 Debugging Guide

### Progress Indicator Not Showing

**Check 1: Is progress callback firing?**

```typescript
// Add to github-data-provider.tsx:93-106
console.log('[Provider] Progress callback fired:', progressUpdate);
```

**Check 2: Is progress in context?**

```typescript
// Add to github-data-provider.tsx:224-243
console.log('[Provider] Context value:', { progress, isLoading, repos: repos?.length });
```

**Check 3: Is progress reaching Dashboard?**

```typescript
// Add to dashboard.tsx:43
console.log('[Dashboard] Props:', { isLoading, progress });
```

**Check 4: Is conditional rendering correct?**

```typescript
// dashboard.tsx:63
{isLoading && progress && ( // ← Both must be true
  <RepoLoadingProgress ... />
)}
```

**Common issues:**
- Progress state not persisted between renders
- Dashboard mounts after fetch completes (progress already null)
- SWR `mutate` clearing progress too early

**Solution:** Ensure progress persists until explicitly cleared

---

### Skeleton Layout Shift

**Check 1: Compare rendered HTML**

Open DevTools → Elements tab:
1. Inspect skeleton table
2. Let repos load
3. Inspect real table
4. Compare structure/classes

**Check 2: Measure layout shift**

Use Chrome DevTools Performance tab:
1. Record while loading
2. Look for CLS (Cumulative Layout Shift) warnings
3. Identify which elements shifted

**Common issues:**
- Missing filters section (biggest cause)
- Different padding/margins
- Skeleton too simple (doesn't match chips/description)

---

### Header Button Not Showing

**Check 1: Is PAT in storage?**

```typescript
// Console in browser
await window.localStorage.getItem('pat')
```

**Check 2: Is hook returning PAT?**

```typescript
// Add to header.tsx:30
console.log('[Header] Auth state:', { pat, login, isAuthenticated });
```

**Check 3: Is conditional logic correct?**

```typescript
// header.tsx:124
pat && login && ( // ← Issue: login may be null initially
```

**Solution:** Use `isAuthenticated` instead

---

## 📝 Notes

### Architecture Decisions

1. **Why not show progress during skeleton?**
   - Skeleton appears instantly (0-2s before first callback)
   - Progress indicator appears when first data arrives
   - Clean separation: skeleton = "preparing", progress = "fetching"

2. **Why include filters in skeleton?**
   - Prevents major layout shift (most significant improvement)
   - User sees final UI structure immediately
   - Matches Phase 3 goal: "No layout shift"

3. **Why fix header PAT detection separately?**
   - Independent of loading UX
   - Critical for user experience (avoid re-auth)
   - Simple fix with high impact

### HeroUI Best Practices

- Always use semantic colors (`bg-content2`, `text-foreground`)
- Skeleton components auto-adapt to theme
- Progress component has built-in animations
- User component in dropdown is standard pattern

### Testing Best Practices

- Use `render` from test-utils (auto-wraps providers)
- Test visual states in Storybook
- Test behavior in unit tests
- Test integration in E2E tests

---

## 🎯 Ready to Start?

**Recommended starting point: M3-I1 (Fix Skeleton Structure)**

This has the highest visual impact and is independent of other fixes.

```bash
# Create branch
git checkout -b fix/phase-3-loading-ux

# Create new component
touch src/components/repo-table/repo-filters-skeleton.tsx

# Start Storybook to see changes
npm run storybook
```

Let's build this! 🚀
