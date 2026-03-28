---
title: "feat: Argos CI visual regression testing"
type: feat
status: active
date: 2026-03-28
---

# Argos CI Visual Regression Testing

## Overview

Add visual regression testing with Argos CI to catch unintended UI changes in PRs.

## Implementation

### 1. Install dependency

```bash
bun add --dev @argos-ci/playwright
```

### 2. Update playwright.config.ts

- Add Argos reporter (uploads only in CI)
- Add `bypassCSP: true` (Argos injects a stabilization script)

### 3. Create VRT spec file: `e2e/visual-regression.spec.ts`

Screenshots to capture (light + dark):

- Landing page (full page)
- Dashboard with mocked data
- Get Started section (token form)

Use existing E2E mock patterns. Toggle dark mode via class strategy.

### 4. Update CI workflow

Add `ARGOS_TOKEN: ${{ secrets.ARGOS_TOKEN }}` to e2e-tests job env.

### 5. Disable animations for VRT

Use `argosCSS` to disable framer-motion animations during screenshots.

## Acceptance Criteria

- [ ] `@argos-ci/playwright` installed
- [ ] Argos reporter configured in playwright.config.ts
- [ ] VRT spec captures landing (light/dark), dashboard (mocked), token form
- [ ] CI workflow passes ARGOS_TOKEN
- [ ] Animations disabled in screenshots
- [ ] All existing tests still pass
