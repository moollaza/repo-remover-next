# CI Fixes & Cleanup TODO

## CI Failures (PR #53)

### 1. `lint-and-test` — ESLint errors (pre-existing + new)

Two categories:

**a) `perfectionist` plugin import/object ordering** (8+ errors)

- `perfectionist/sort-imports` — wrong import order in `main.tsx`, `scroll-button.tsx`, `github-token-form.tsx`
- `perfectionist/sort-objects` — wrong object key order in `secure-storage.ts`
- **Decision: REMOVE perfectionist entirely** (per user request — it's breaking tests and not helping)

**b) `@typescript-eslint` type-safety errors** (6+ errors, pre-existing)

- `no-unsafe-assignment` in `main.tsx`, `secure-storage.ts`, `providers.tsx`
- `no-unsafe-argument` in `secure-storage.ts`
- `no-floating-promises` in `providers.tsx`
- `parserOptions.project` issue in `hero.ts`
- **Fix**: Either suppress with eslint-disable comments or fix the actual type issues

### 2. `chromatic` — Storybook build fails

```
Error: Cannot find module '@storybook/builder-vite/dist/index.js'
```

- Storybook builder-vite missing from bun-installed deps
- **Decision: REMOVE Chromatic CI job entirely** (per user decision — dropping Storybook/Chromatic in favor of Percy later)

### 3. `e2e-tests` — Status unknown

- Waiting on `lint-and-test` to pass first? Or running independently
- May have its own issues (Playwright config uses `npx vite` now, CI may need adjustment)
- **Verify**: Does CI use the same Node version (22.12+)? Check `.node-version` is respected

### 4. `Workers Builds: repo-remover-next` — PASSES

- Cloudflare deployment works

---

## Cleanup Tasks (user requests)

### 5. Remove Chromatic from CI

- Delete the `chromatic` job from `.github/workflows/ci.yml`
- Remove `chromatic` and `@chromatic-com/storybook` from `package.json` devDeps
- Optionally: remove `.storybook/` directory and all `*.stories.tsx` files (bigger cleanup, separate PR?)

### 6. Remove `perfectionist` ESLint plugin

- Remove `eslint-plugin-perfectionist` from `package.json` devDeps
- Remove `plugin:perfectionist/recommended-alphabetical-legacy` from `.eslintrc.json` extends
- Remove `perfectionist/sort-imports` rule from `.eslintrc.json` rules
- Run `npm run lint:fix` to verify remaining lint errors are manageable

### 7. Fix remaining `@typescript-eslint` errors

- After removing perfectionist, run lint and address remaining type-safety errors
- Likely need `void` operators on some promises, type annotations on some `any` values

### 8. Verify E2E in CI

- Ensure `.node-version` = `22.12.0` is respected by CI runner
- Playwright config uses `npx vite` — verify this works in CI environment
- Check if E2E CI job has `GITHUB_TEST_TOKEN` set (needed for some tests?)

---

## Landing Page Visual QA

### 9. Screenshot Figma Make design and compare to implementation

- Run the Figma Make design locally (it's at `~/Downloads/reporemover - new landing design/`)
- Screenshot each section side-by-side with our implementation
- Document all visual differences

### 10. Fix header/navbar — too short

- Current header looks cramped/short compared to the Figma design
- The Figma design has a taller header with more padding, sticky with backdrop blur
- Check if HeroUI `<Navbar>` is constraining the height vs the Figma design's plain `<header>`

### 11. Fix token form — completely busted

- The PAT input form in the "Get Started" section is broken
- `TokenFormSection` wraps `GitHubTokenForm` which uses HeroUI `<Input>` — may have styling conflicts with the landing page's plain Tailwind approach
- Need to verify: does the form render? Does validation work? Does submit navigate to dashboard?
- May need to restyle the form section to work visually in the landing context

### 12. Fix FAQ section

- Current FAQ uses plain `<details>`/`<summary>` — looks basic compared to Figma design
- Figma uses a proper accordion with smooth animations
- **Decision**: Use shadcn/Radix Accordion component — OK to introduce shadcn for landing page components where needed to match the design closer

### 13. Fix footer

- Current footer doesn't match the Figma design layout
- Figma has a 4-column grid: brand/description (2-col), Product links, Company links
- Current footer is a 3-col with different content structure
- Update to match Figma design more closely

### 14. Replace product showcase mock table with real screenshot

- Current ProductShowcase is a hand-coded HTML/CSS mockup of the table
- Replace with an actual screenshot of the real dashboard table
- Take a Playwright screenshot of the dashboard with mock data loaded
- Use the image in the showcase section (responsive, with the glow effect preserved)

### 15. Fix copy — remove "language" filtering reference

- Landing page copy mentions filtering by "language" (in features section: "Filter by name, description, and programming language")
- The app does NOT currently support language filtering
- Remove/reword the language references to match actual capabilities:
  - Hero search section: "finds repositories by name, description, or language" → "finds repositories by name or description"
  - Features benefit list: "Filter by name, description, and programming language" → "Filter by name and description"

---

## Priority Order

1. Remove perfectionist (unblocks lint)
2. Remove Chromatic CI job (unblocks that check)
3. Fix remaining lint errors (unblocks `lint-and-test`)
4. Verify E2E in CI
5. Regenerate bun.lock after dep removals
6. Screenshot Figma design + compare to implementation
7. Fix header/navbar height
8. Fix token form
9. Fix FAQ (shadcn/Radix Accordion)
10. Fix footer layout
11. Replace mock table with real dashboard screenshot
12. Fix inaccurate copy (language filtering)
13. Final visual QA pass
