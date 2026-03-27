---
title: Sentry token sanitization and PII scrubbing
category: security
tags: [sentry, token, pii, sanitization, zero-knowledge]
created: 2026-03-26
problem: "GitHub PATs could leak into Sentry error reports via stack traces or breadcrumbs"
solution: "beforeSend hook scrubs tokens from all string fields using regex pattern matching"
---

## Problem

In a zero-knowledge app handling GitHub PATs, error monitoring (Sentry) must never capture tokens. Tokens can appear in:

- Error messages and stack traces
- Breadcrumb data
- Request URLs and headers
- Event tags, extra data, and contexts

## Solution

`src/utils/sentry-before-send.ts` implements a `beforeSend` hook that:

1. Regex-matches GitHub PAT patterns (`ghp_`, `github_pat_`, `gho_`, `ghu_`, `ghs_`, `ghr_`)
2. Scrubs matching strings from `event.message`, `event.exception`, `event.breadcrumbs`
3. Also needs scrubbing for `event.tags`, `event.extra`, `event.contexts` (Item 8 in queue)

```typescript
const TOKEN_PATTERNS = [
  /ghp_[A-Za-z0-9_]{36,255}/g,
  /github_pat_[A-Za-z0-9_]{22,255}/g,
  // ... other prefixes
];
```

## How to avoid

When adding new Sentry integrations or custom data, always verify tokens can't leak through new fields. Run the sanitization unit tests after changes.
