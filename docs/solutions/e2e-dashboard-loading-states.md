---
title: Dashboard loading states and E2E wait strategies
category: testing
tags: [e2e, playwright, dashboard, loading, skeleton]
created: 2026-03-26
problem: "E2E tests flaked because they interacted with dashboard before data loaded"
solution: "Wait for specific DOM states — skeleton vs table — and set up auth mocks before navigation"
---

## Problem

Dashboard has distinct loading states that E2E tests must account for:

- `repos === null` → shows skeleton loading UI
- `repos === []` → shows empty table
- `repos.length > 0` → shows populated table

`dashboard.goto()` navigates but doesn't wait for data to load. Tests that click table elements immediately after navigation hit skeleton state and fail.

## Solution

1. **Always wait for table rows before interacting:**

```typescript
await page.goto("/dashboard");
await page.locator("table tbody tr").first().waitFor({ state: "visible" });
```

2. **Set up auth mocks BEFORE navigating** (especially for theme tests):

```typescript
await mockLocalStorage(page); // sets secure_pat + secure_login
await mockGitHubApi(page); // intercepts API calls
await page.goto("/dashboard"); // now navigate
```

3. **For select-all verification**, check button enabled state, not checkbox:

```typescript
// HeroUI Table doesn't expose standard aria-selected
const archiveButton = page.getByRole("button", { name: /archive/i });
await expect(archiveButton).toBeEnabled();
```

## How to avoid

When writing E2E tests for data-dependent views, always add explicit waits for the loaded state before interacting. Never assume navigation implies data readiness.
