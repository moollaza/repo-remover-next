---
title: secureStorage uses secure_ prefix for localStorage keys
category: auth
tags: [localStorage, encryption, token-storage, e2e-testing]
created: 2026-03-26
problem: "E2E tests failed because mock localStorage used wrong key names for PAT and login"
solution: "secureStorage prefixes all keys with `secure_` — use `secure_pat` and `secure_login`"
---

## Problem

E2E tests that mock localStorage to simulate authenticated state were using `pat` and `login` as keys, but the app's `secureStorage` module prefixes all keys with `secure_`.

## Solution

Always use `secure_pat` and `secure_login` when mocking localStorage for authenticated state in E2E tests.

```typescript
// e2e/utils/github-api-mocks.ts
export function mockLocalStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem("secure_pat", "ghp_test_token");
    localStorage.setItem("secure_login", "testuser");
  });
}
```

## How to avoid

When writing E2E tests that need auth state, always check `src/utils/secure-storage.ts` for the actual key prefix rather than guessing.
