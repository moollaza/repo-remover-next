---
title: "feat: Dashboard loading UX — inline progress, SWR cache, preconnect"
type: feat
status: active
date: 2026-03-28
---

# Dashboard Loading UX Improvements

## Overview

Fix layout shift from the loading progress card, improve perceived performance with SWR caching on return visits, and add preconnect hints for GitHub API.

## Problems

1. **Layout shift**: `RepoLoadingProgress` renders as a full-width card between the title and table (`dashboard.tsx:81-88`), pushing content down. When it disappears, content jumps up.
2. **Sluggish transitions**: Skeleton → progress card → table creates 3 visible state changes. Feels slow even when data arrives quickly.
3. **No preconnect**: `index.html` has no `<link rel="preconnect">` for `api.github.com`. Browser must do DNS + TLS handshake before first API call.
4. **Full skeleton on return**: SWR has `revalidateOnFocus: false` and `revalidateOnReconnect: false` but `dedupingInterval: 60000` means cached data is served for 1 minute. After that, full skeleton again.

## Proposed Solution

### Phase 1: Inline progress indicator (fix layout shift)

**File: `src/components/dashboard.tsx`**

Move the progress indicator inline with the title instead of a separate block. Show it as a subtle status line beside "Repository Management":

```
Repository Management                        [Refresh]
Select repositories to archive or delete
Loading personal repos... ━━━━━━━━░░ 1 of 3
```

When loading is done or no progress, that line simply doesn't render — no layout shift because the title area already has fixed height.

**Changes:**

- Remove the `{isLoading && progress && <RepoLoadingProgress .../>}` block from between title and table
- Add inline progress below the subtitle, using the same vertical space as the subtitle (replace it during loading)
- Keep `RepoLoadingProgress` component but restyle it as a compact inline element (no card, no padding, no border)

**File: `src/components/repo-loading-progress.tsx`**

Restyle from card to inline:

- Remove `mb-6 p-4 bg-content1 rounded-xl border border-divider shadow-sm` wrapper
- Use a simple flex row: spinner + label + progress bar, all on one line
- Much smaller: text-sm, h-1 progress bar, no subtitle (org name)

### Phase 2: Preconnect hints

**File: `index.html`**

Add before the theme script:

```html
<link rel="preconnect" href="https://api.github.com" crossorigin />
<link rel="dns-prefetch" href="https://api.github.com" />
```

This saves ~100-200ms on first API call by starting DNS + TLS handshake early.

### Phase 3: SWR stale-while-revalidate

**File: `src/providers/github-data-provider.tsx`**

The SWR config at line 120-146 needs tuning:

- Keep `dedupingInterval: 60000` (prevents duplicate fetches within 1 min)
- Show cached data immediately on return (SWR does this by default with its in-memory cache)
- The real issue: `isLoading` stays true while `progress !== null` (line 151). When SWR serves cached data, progress is null, so `isLoading` is false — cached data shows instantly already!

The actual problem is the provider's `isLoading` logic. Currently:

```ts
const isLoading = isAuthenticated && (!data || progress !== null) && !error;
```

On first visit: `data` is null → `isLoading` is true → skeleton shows. Good.
On return visit: `data` is in SWR cache → `isLoading` is false → table shows instantly. This already works!

But during a **revalidation** (background refresh), `progress` gets set which makes `isLoading` true again, showing the skeleton. Fix:

```ts
// Show loading only on initial load (no cached data), not during revalidation
const isLoading = isAuthenticated && !data && !error;
const isRefreshing = isAuthenticated && data && progress !== null;
```

Then in dashboard.tsx, show the inline progress for both `isLoading` and `isRefreshing` but only show skeleton for `isLoading`.

### Phase 4: Show table with cached data during refresh

**File: `src/components/dashboard.tsx`**

Currently: `repos === null ? <Skeleton /> : <RepoTable />`

With the new `isRefreshing` state, the table stays visible during background refresh. The inline progress indicator shows "Refreshing..." while SWR revalidates.

## What We're NOT Doing

- Persisting SWR cache to localStorage (in-memory cache is sufficient)
- Changing the fetcher logic or API calls
- Optimistic updates (separate PR)

## Acceptance Criteria

- [ ] No layout shift when loading progress appears/disappears
- [ ] Preconnect hints in index.html for api.github.com
- [ ] Returning to dashboard with cached data shows table immediately (no skeleton)
- [ ] Background refresh shows inline "Refreshing..." indicator, not skeleton
- [ ] All existing tests pass
- [ ] Build passes

## Files to Change

1. `index.html` — add preconnect
2. `src/components/repo-loading-progress.tsx` — restyle inline
3. `src/components/dashboard.tsx` — move progress inline with title
4. `src/providers/github-data-provider.tsx` — split isLoading/isRefreshing
5. `src/contexts/github-context.tsx` — add isRefreshing to context type
6. `src/routes/dashboard.tsx` — pass isRefreshing
