# Presentational/Container Component Refactor - Dashboard

**Problem**: Dashboard story is complex and broken due to tight coupling with context, hooks, and side effects.

**Solution**: Apply the Presentational/Container Component pattern to separate UI from business logic.

---

## Current Architecture (Broken)

```
DashboardPage (page.tsx)
  ├─ useGitHubData() hook ❌
  ├─ useRouter() hook ❌
  ├─ useEffect (side effects) ❌
  └─ JSX rendering ✅

Storybook Story (dashboard.stories.tsx)
  ├─ AuthenticatedUserDecorator (sets localStorage) 😫
  ├─ PageDecorator (providers + layout) 😫
  ├─ MSW handlers (100+ lines) 😫
  └─ Still doesn't work reliably 💥
```

**Why it's broken**:
1. Can't render without `useGitHubData()` context
2. Can't render without `useRouter()` navigation context
3. Requires localStorage to be set up correctly
4. Requires MSW to mock all GitHub API calls
5. Timing issues: localStorage → Provider reads → SWR fetches → MSW responds

---

## Target Architecture (Simple)

```
Dashboard (presentational component)
  ├─ Props: { repos, login, isLoading, isError, ... } ✅
  ├─ No hooks (except UI hooks like useState for local UI state) ✅
  ├─ No context ✅
  ├─ Pure rendering logic ✅
  └─ Easy to test and story ✅

DashboardContainer (page.tsx - container component)
  ├─ useGitHubData() hook ✅
  ├─ useRouter() hook ✅
  ├─ useEffect (side effects) ✅
  └─ <Dashboard {...props} /> ✅

Storybook Story (dashboard.stories.tsx)
  ├─ No decorators needed! 🎉
  ├─ No MSW needed! 🎉
  ├─ Just props! 🎉
  └─ Works perfectly! ✅
```

---

## Implementation Steps

### Step 1: Create Presentational Dashboard Component

**File**: `src/components/dashboard.tsx` (NEW)

```typescript
"use client";

import { Alert } from "@heroui/react";
import { type Repository, type User } from "@octokit/graphql-schema";

import RepoTable from "@/components/repo-table/repo-table";

export interface DashboardProps {
  /** Current user's repositories */
  repos: Repository[] | null;

  /** Current user's login */
  login: string | null;

  /** Whether data is currently loading */
  isLoading: boolean;

  /** Whether an error occurred */
  isError: boolean;

  /** Optional permission warning message */
  permissionWarning?: string;

  /** Optional callback for refresh action */
  onRefresh?: () => void;
}

/**
 * Dashboard - Presentational Component
 *
 * Displays repository management interface with filtering, selection, and bulk actions.
 * This is a pure presentational component that receives all data via props.
 *
 * For the container (data-fetching) version, see DashboardPage in src/app/dashboard/page.tsx
 *
 * @example
 * <Dashboard
 *   repos={myRepos}
 *   login="username"
 *   isLoading={false}
 *   isError={false}
 * />
 */
export default function Dashboard({
  repos,
  login,
  isLoading,
  isError,
  permissionWarning,
  onRefresh,
}: DashboardProps) {
  return (
    <section className="py-16 flex-grow">
      <div className="flex items-center justify-between mb-10">
        <h1
          className="text-3xl font-semibold"
          data-testid="repo-table-header"
        >
          Select Repos to Modify
        </h1>

        {onRefresh && !isLoading && (
          <button
            onClick={onRefresh}
            className="text-sm text-primary hover:underline"
            type="button"
          >
            Refresh Data
          </button>
        )}
      </div>

      {isError && (
        <Alert className="mb-4" color="danger">
          Error loading repositories. Please check your token and try again.
        </Alert>
      )}

      {permissionWarning && (
        <Alert className="mb-4" color="warning">
          <div>
            <strong>Limited Access:</strong> {permissionWarning}
          </div>
          <div className="mt-2 text-sm">
            Some organization repositories may not be visible due to insufficient
            token permissions.
          </div>
        </Alert>
      )}

      {(isLoading || (repos && login !== null)) && (
        <RepoTable isLoading={isLoading} login={login} repos={repos} />
      )}
    </section>
  );
}
```

**Key Points**:
- ✅ **Zero hooks** (except maybe useState for local UI state if needed)
- ✅ **Zero context** consumption
- ✅ **Zero side effects** (no useEffect)
- ✅ **All data via props**
- ✅ **Fully documented** with TypeScript and JSDoc
- ✅ **Export props interface** for reuse in tests/stories

---

### Step 2: Refactor Container (DashboardPage)

**File**: `src/app/dashboard/page.tsx` (MODIFIED)

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Dashboard from "@/components/dashboard";
import { useGitHubData } from "@/hooks/use-github-data";

/**
 * DashboardPage - Container Component
 *
 * Handles data fetching, authentication, and side effects for the dashboard.
 * Delegates rendering to the presentational Dashboard component.
 *
 * Responsibilities:
 * - Fetch repository data via useGitHubData
 * - Handle authentication redirects
 * - Trigger data refresh on mount
 * - Pass data down to presentational component
 */
export default function DashboardPage() {
  const {
    isError,
    isInitialized,
    isLoading,
    login,
    pat,
    permissionWarning,
    refetchData,
    repos,
  } = useGitHubData();

  const router = useRouter();

  // Side effect: Redirect to home if not authenticated
  useEffect(() => {
    if (!isInitialized) return;

    if (!pat) {
      router.push("/");
    } else {
      refetchData();
    }
  }, [pat, router, refetchData, isInitialized]);

  // Render presentational component with all data
  return (
    <Dashboard
      repos={repos}
      login={login}
      isLoading={isLoading}
      isError={isError}
      permissionWarning={permissionWarning}
      onRefresh={refetchData}
    />
  );
}
```

**Key Points**:
- ✅ **All business logic stays here** (hooks, effects, routing)
- ✅ **Delegates rendering** to presentational component
- ✅ **Clean separation** of concerns
- ✅ **Easy to test container logic** separately if needed

---

### Step 3: Simplify Storybook Story

**File**: `src/app/dashboard/dashboard.stories.tsx` (MODIFIED)

```typescript
import type { Meta, StoryObj } from "@storybook/react";

import Dashboard, { type DashboardProps } from "@/components/dashboard";
import { MOCK_REPOS, MOCK_USER } from "@/mocks/static-fixtures";

const meta: Meta<typeof Dashboard> = {
  component: Dashboard,
  title: "Pages/Dashboard",
  parameters: {
    layout: "fullscreen",
    chromatic: {
      modes: {
        light: { theme: "light" },
        dark: { theme: "dark" },
      },
    },
  },
  // No decorators needed! 🎉
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

/**
 * Default dashboard state with repos loaded
 */
export const Default: Story = {
  args: {
    repos: MOCK_REPOS,
    login: MOCK_USER.login,
    isLoading: false,
    isError: false,
  },
};

/**
 * Loading state while fetching repositories
 */
export const Loading: Story = {
  args: {
    repos: null,
    login: MOCK_USER.login,
    isLoading: true,
    isError: false,
  },
};

/**
 * Error state when API call fails
 */
export const Error: Story = {
  args: {
    repos: null,
    login: MOCK_USER.login,
    isLoading: false,
    isError: true,
  },
};

/**
 * Empty state with no repositories
 */
export const Empty: Story = {
  args: {
    repos: [],
    login: MOCK_USER.login,
    isLoading: false,
    isError: false,
  },
};

/**
 * Partial data with permission warning
 */
export const PartialData: Story = {
  args: {
    repos: MOCK_REPOS.slice(0, 5), // Only some repos loaded
    login: MOCK_USER.login,
    isLoading: false,
    isError: false,
    permissionWarning:
      "Unable to access repositories from organization 'enterprise-corp' due to SAML SSO requirements.",
  },
};

/**
 * Large dataset (100+ repos)
 */
export const LargeDataset: Story = {
  args: {
    repos: Array.from({ length: 150 }, (_, i) => ({
      ...MOCK_REPOS[0],
      id: `repo-${i}`,
      name: `repository-${i}`,
    })),
    login: MOCK_USER.login,
    isLoading: false,
    isError: false,
  },
};
```

**Comparison**:

| Before | After |
|--------|-------|
| 109 lines | 85 lines |
| 100+ lines of MSW handlers | **0 lines of MSW** 🎉 |
| 2 decorators required | **0 decorators** 🎉 |
| localStorage setup required | **No localStorage** 🎉 |
| 1 story (barely works) | **6 stories (all states)** 🎉 |
| Hard to maintain | **Trivial to maintain** ✅ |

---

### Step 4: Create Tests for Presentational Component

**File**: `src/components/dashboard.test.tsx` (NEW)

```typescript
import { render, screen } from '@/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import Dashboard, { type DashboardProps } from './dashboard';
import { MOCK_REPOS, MOCK_USER } from '@/mocks/static-fixtures';

const defaultProps: DashboardProps = {
  repos: MOCK_REPOS,
  login: MOCK_USER.login,
  isLoading: false,
  isError: false,
};

describe('Dashboard', () => {
  it('renders heading', () => {
    render(<Dashboard {...defaultProps} />);

    expect(screen.getByText(/select repos to modify/i)).toBeInTheDocument();
  });

  it('shows error alert when isError is true', () => {
    render(<Dashboard {...defaultProps} isError={true} />);

    expect(screen.getByText(/error loading repositories/i)).toBeInTheDocument();
  });

  it('shows permission warning when provided', () => {
    const warning = 'Some organizations are not accessible';
    render(<Dashboard {...defaultProps} permissionWarning={warning} />);

    expect(screen.getByText(/limited access/i)).toBeInTheDocument();
    expect(screen.getByText(warning)).toBeInTheDocument();
  });

  it('renders repo table with correct props', () => {
    render(<Dashboard {...defaultProps} />);

    // RepoTable should be rendered
    // (Assuming RepoTable has a testable element)
    expect(screen.getByTestId('repo-table-header')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    render(<Dashboard {...defaultProps} onRefresh={onRefresh} />);

    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    await user.click(refreshButton);

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('hides refresh button when loading', () => {
    render(<Dashboard {...defaultProps} isLoading={true} onRefresh={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /refresh data/i })).not.toBeInTheDocument();
  });

  it('does not render refresh button when onRefresh not provided', () => {
    render(<Dashboard {...defaultProps} />);

    expect(screen.queryByRole('button', { name: /refresh data/i })).not.toBeInTheDocument();
  });
});
```

**Key Points**:
- ✅ **No context mocking needed**
- ✅ **No MSW setup needed**
- ✅ **Fast, focused unit tests**
- ✅ **Test behavior, not implementation**

---

## Benefits of This Refactor

### 1. Storybook Simplicity

**Before**:
```typescript
// Requires:
decorators: [AuthenticatedUserDecorator, PageDecorator],
parameters: {
  msw: {
    handlers: [
      http.post(...) // 100+ lines
    ]
  }
}
```

**After**:
```typescript
// Just props!
args: {
  repos: MOCK_REPOS,
  login: "testuser",
  isLoading: false
}
```

---

### 2. Testing Simplicity

**Before**:
```typescript
// Can't test page.tsx without full context
renderHook(() => useGitHubData(), {
  wrapper: GitHubDataProvider
});
// Mock localStorage
// Mock router
// Mock SWR
// Mock API
```

**After**:
```typescript
// Just render with props!
render(<Dashboard repos={MOCK_REPOS} login="user" />);
```

---

### 3. Maintainability

| Aspect | Before | After |
|--------|--------|-------|
| Change repo structure | Update MSW, decorators, fixtures | Update `MOCK_REPOS` |
| Add new state | Update MSW, decorators, timing | Add new story with props |
| Test edge case | Fight with context/mocking | Add args to story |
| Debug story | Check localStorage → Provider → SWR → MSW | Check props |

---

### 4. Reusability

The presentational `Dashboard` component can now be:
- ✅ Used in different apps
- ✅ Used with different data sources
- ✅ Tested in isolation
- ✅ Documented in Storybook without coupling

---

### 5. Performance

**Before**:
- Storybook rerenders when localStorage changes
- SWR cache invalidations
- MSW request interception overhead

**After**:
- Pure component, only rerenders when props change
- No network calls
- Instant Storybook loading

---

## Migration Checklist

### Phase 1: Create Presentational Component (2-3 hours)

- [ ] Create `src/components/dashboard.tsx`
- [ ] Define `DashboardProps` interface
- [ ] Extract JSX from `page.tsx` to `Dashboard`
- [ ] Ensure zero hooks/context in `Dashboard`
- [ ] Add TypeScript/JSDoc documentation

### Phase 2: Refactor Container (1 hour)

- [ ] Update `src/app/dashboard/page.tsx`
- [ ] Keep all hooks and effects
- [ ] Render `<Dashboard {...props} />`
- [ ] Test that dashboard still works in browser

### Phase 3: Simplify Storybook (1-2 hours)

- [ ] Update `dashboard.stories.tsx` to import `Dashboard` (not page)
- [ ] Remove decorators
- [ ] Remove MSW handlers
- [ ] Create stories for all states (default, loading, error, empty, partial)
- [ ] Test stories in Storybook
- [ ] Run Chromatic visual regression

### Phase 4: Add Tests (1 hour)

- [ ] Create `src/components/dashboard.test.tsx`
- [ ] Test rendering with different props
- [ ] Test error states
- [ ] Test user interactions (refresh button)
- [ ] Achieve >90% coverage on presentational component

### Phase 5: Validation (30 min)

- [ ] Run `npm run test:unit` - all tests pass
- [ ] Run `npm run storybook` - all stories work
- [ ] Run `npm run build` - production build succeeds
- [ ] Run `npm run chromatic` - visual regression passes
- [ ] Manual test: Dashboard works in browser

**Total Effort**: 5-7 hours
**Risk**: Low (incremental, well-tested)

---

## Rollback Strategy

If issues arise:

1. **Keep both versions temporarily**:
   ```
   src/components/dashboard.tsx (new presentational)
   src/app/dashboard/page.tsx (keep using useGitHubData directly)
   ```

2. **Feature flag**:
   ```typescript
   const USE_PRESENTATIONAL = process.env.NEXT_PUBLIC_USE_PRESENTATIONAL === 'true';

   if (USE_PRESENTATIONAL) {
     return <Dashboard {...props} />;
   } else {
     return <OldDashboardJSX />;
   }
   ```

3. **Git revert**: Entire refactor is in one PR, easy to revert

---

## Apply This Pattern to Other Components

This pattern should be applied to:

### High Priority
1. ✅ **Dashboard** (covered in this doc)
2. **Header** (`src/components/header.tsx`)
   - Extract presentational `Header` with props: `{ user, login, onLogout, showDevTools }`
   - Keep container logic in current file
3. **TokenFormSection** (`src/components/token-form-section.tsx`)
   - Extract presentational `TokenForm`
   - Container handles `setPat()` and navigation

### Medium Priority
4. **RepoTable** (`src/components/repo-table/repo-table.tsx`)
   - Already mostly presentational but could be cleaner
   - Extract hooks to `useRepoFilters`, `useRepoPagination`

### Low Priority (Already Good)
- ✅ `Footer` - Already presentational
- ✅ `ThemeSwitcher` - Only uses UI hook (acceptable)
- ✅ `ScrollingQuotes` - Only uses local state (acceptable)

---

## Expected Outcomes

After completing this refactor:

✅ **Storybook Stories**:
- Reduced from ~100 LOC to ~10 LOC each
- No decorators needed
- No MSW needed
- All states easily testable

✅ **Testing**:
- Presentational component tests are fast and simple
- Container component tests focus on business logic
- Better test coverage with less effort

✅ **Maintainability**:
- Clear separation of concerns
- Easy to understand which component does what
- Refactoring is safer (presentational components are pure)

✅ **Performance**:
- Faster Storybook loading
- Fewer rerenders
- Better memoization opportunities

✅ **Developer Experience**:
- New developers can understand components faster
- Stories serve as living documentation
- Testing is straightforward

---

## Related Patterns

This refactor enables other patterns:

1. **Compound Components**: RepoTable could expose sub-components
2. **Custom Hooks**: Extract `useRepoFilters`, `useRepoPagination`
3. **Render Props**: If you need to share UI logic across components
4. **Error Boundaries**: Easier to add when components are presentational

---

## Further Reading

- [React Docs: Thinking in React](https://react.dev/learn/thinking-in-react)
- [React Docs: Extracting State Logic](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [Storybook: Component Story Format](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Presentational and Container Components (Dan Abramov)](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)

---

## Summary

**The Problem**: Dashboard page is tightly coupled to context, making Storybook complex and tests difficult.

**The Solution**: Split into Presentational (UI) and Container (logic) components.

**The Result**:
- Storybook stories: 100+ LOC → 10 LOC (90% reduction) 🎉
- No MSW mocking needed for stories 🎉
- No localStorage setup needed 🎉
- All dashboard states easily testable 🎉
- Faster development and better maintainability ✅

**Next Step**: Start with Phase 1 - create the presentational component!
