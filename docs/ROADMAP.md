# Roadmap

Ordered list of upcoming PRs after `dashboard-improvements` merges.

## PR Queue

### 1. Merge `dashboard-improvements` (PR #28)

- All CI checks passing
- Ready to merge

### 2. Dependency Updates

- 38 vulnerabilities on `main` (4 critical, 11 high, 14 moderate, 9 low)
- Fix HeroUI table header border-radius: rounded corners showing white in bottom-left corner where grey header meets table border
- Separate branch/PR

### 3. Landing Page Redesign

- User has Figma design — will provide React code to implement
- Separate branch/PR

### 4. SEO + Copy Optimization

- Improve page titles, meta descriptions, and marketing copy
- Separate branch/PR

### 5. Activate Sentry + Fathom Analytics

- Infrastructure already coded, just needs env vars set in Cloudflare Workers:
  - `VITE_SENTRY_DSN` — error tracking
  - `VITE_FATHOM_SITE_ID` — privacy-first analytics
- No code changes needed
