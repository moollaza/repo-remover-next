---
title: "refactor: Remove @heroui/theme — replace with CSS custom properties"
type: refactor
status: active
date: 2026-03-27
---

# Remove @heroui/theme — Replace with CSS Custom Properties

## Overview

Remove `@heroui/theme` — the last HeroUI dependency — by replacing all 58 HeroUI semantic color classes with CSS custom properties registered via Tailwind CSS 4's `@theme` directive. This approach requires **zero component class name changes** because the same utility names (`bg-content1`, `text-foreground`, `border-divider`, etc.) will be backed by our own CSS variables instead of HeroUI's.

## Problem Statement / Motivation

- `@heroui/theme` is the sole remaining HeroUI dependency (all components already migrated to plain HTML/Tailwind)
- It pulls in 400KB+ of CSS generation code just for color tokens
- It constrains Tailwind CSS 4 migration (uses legacy plugin API)
- Removes a third-party dependency from the critical rendering path

## Proposed Solution

Define semantic color tokens as CSS custom properties in `globals.css` with `:root` (light) and `.dark` (dark) blocks, then register them via Tailwind CSS 4's `@theme` directive with `--color-*` namespace.

### Key Design Decisions

1. **Hex values in `@theme --color-*`** — Tailwind CSS 4 auto-decomposes hex for opacity modifier support (`bg-primary/80`). Simpler than HSL triplets.
2. **Use Tailwind's built-in scales** for numbered shades (`default-*` → zinc, `primary-*` → blue, `success-*` → green, `danger-*` → red/pink, `warning-*` → amber). Only define custom values for tokens HeroUI customizes (`background`, `foreground`, `content1-4`, `divider`).
3. **`@theme --color-*` namespace** prevents CSS variable collision with shadcn tokens (prior incident: bare `--primary` broke the dashboard).
4. **Preserve dark background `#111111`** (current override in `src/hero.ts`).
5. **Include shadcn token definitions** (`bg-muted`, `text-destructive`, `border-border`, etc.) — 16 orphaned classes in `src/components/ui/` that may have been silently resolved by HeroUI or silently broken.

## Technical Approach

### Phase 1: Foundation (globals.css + @theme)

**`src/globals.css`** — Remove HeroUI plugin/source, add CSS custom properties:

```css
/* REMOVE these lines: */
/* @plugin "./hero.ts"; */
/* @source "../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"; */

/* ADD semantic color definitions: */
@theme {
  /* Surface */
  --color-background: #ffffff;
  --color-foreground: #11181c;
  --color-content1: #ffffff;
  --color-content2: #f4f4f5;
  --color-content3: #e4e4e7;
  --color-content4: #d4d4d8;
  --color-divider: rgba(17, 17, 17, 0.15);

  /* Default (zinc scale) */
  --color-default-50: #fafafa;
  --color-default-100: #f4f4f5;
  --color-default-200: #e4e4e7;
  --color-default-300: #d4d4d8;
  --color-default-400: #a1a1aa;
  --color-default-500: #71717a;
  --color-default-600: #52525b;
  --color-default: #d4d4d8;

  /* Primary (blue) */
  --color-primary-50: #eff6ff;
  --color-primary: #006fee;
  --color-primary-foreground: #ffffff;

  /* Success (green) */
  --color-success-50: #f0fdf4;
  --color-success-200: #bbf7d0;
  --color-success-700: #15803d;
  --color-success-900: #14532d;
  --color-success: #17c964;
  --color-success-foreground: #000000;

  /* Warning (amber) */
  --color-warning: #f5a524;
  --color-warning-foreground: #000000;

  /* Danger (red/pink) */
  --color-danger-50: #fef2f2;
  --color-danger-600: #dc2626;
  --color-danger: #f31260;
  --color-danger-foreground: #ffffff;

  /* Secondary */
  --color-secondary: #7828c8;
  --color-secondary-foreground: #ffffff;

  /* Foreground shades */
  --color-foreground-500: #71717a;

  /* Focus/overlay */
  --color-focus: #006fee;

  /* shadcn tokens (src/components/ui/) */
  --color-muted: #f4f4f5;
  --color-muted-foreground: #71717a;
  --color-destructive: #f31260;
  --color-border: #e4e4e7;
  --color-input: #e4e4e7;
  --color-ring: #006fee;
}

.dark {
  --color-background: #111111;
  --color-foreground: #ecedee;
  --color-content1: #18181b;
  --color-content2: #27272a;
  --color-content3: #3f3f46;
  --color-content4: #52525b;
  --color-divider: rgba(255, 255, 255, 0.15);

  --color-default-50: #18181b;
  --color-default-100: #27272a;
  --color-default-200: #3f3f46;
  --color-default-300: #52525b;
  --color-default-400: #71717a;
  --color-default-500: #a1a1aa;
  --color-default-600: #d4d4d8;
  --color-default: #3f3f46;

  --color-muted: #27272a;
  --color-muted-foreground: #a1a1aa;
  --color-border: #3f3f46;
  --color-input: #3f3f46;
}
```

Note: Only shades actually used in the codebase are defined. Primary/success/warning/danger DEFAULT values stay the same in both themes; only the surface/neutral tokens invert.

### Phase 2: Config Cleanup

1. **DELETE** `src/hero.ts`
2. **MODIFY** `vite.config.ts` — remove heroui vendor chunk (lines 30-31)
3. **MODIFY** `package.json` — `bun remove @heroui/theme`
4. **MODIFY** `index.html` — update comment on line 25 ("HeroUI uses class-based dark mode" → "class-based dark mode")

### Phase 3: Fix Dynamic Classes

**`src/components/scroll-button.tsx`** — Rewrite `variantMap` from template literals to static class maps:

```typescript
// BEFORE (broken with static analysis):
`bg-${color}/20 text-${color} hover:bg-${color}/30`;

// AFTER (static, Tailwind-safe):
const colorClasses = {
  primary: {
    bg: "bg-primary/20",
    text: "text-primary",
    hover: "hover:bg-primary/30",
  },
  danger: {
    bg: "bg-danger/20",
    text: "text-danger",
    hover: "hover:bg-danger/30",
  },
  // ... etc
};
```

### Phase 4: Verify & Update Docs

1. Run `bun run dev` — visual check both themes
2. Run `bun run lint && bun run test:unit && bun run build`
3. Run `bun run test:e2e:fast theme-basic.spec.ts` — verify dark mode
4. Update `.claude/rules/components.md` — remove HeroUI theme references
5. Update `.claude/rules/architecture.md` — remove HeroUI references
6. Update `README.md` — remove HeroUI from tech stack

## System-Wide Impact

- **Interaction graph**: CSS custom properties flow: globals.css → Tailwind @theme → utility classes → components. No runtime JS involved.
- **Error propagation**: Silent failures — missing color definitions render as transparent/default, no build errors. Must verify visually.
- **State lifecycle risks**: None — purely static CSS, no state.
- **API surface parity**: All 58 existing class names continue working, no component changes.
- **Integration test scenarios**: E2E theme tests (`theme-basic.spec.ts`) verify light/dark switching. Add computed color assertions if not present.

## Acceptance Criteria

- [ ] `@heroui/theme` removed from `package.json` and `bun.lock`
- [ ] `src/hero.ts` deleted
- [ ] HeroUI `@plugin` and `@source` lines removed from `globals.css`
- [ ] All 58 HeroUI semantic color classes defined via `@theme` in `globals.css`
- [ ] shadcn tokens (`bg-muted`, `text-destructive`, etc.) defined for `src/components/ui/`
- [ ] `scroll-button.tsx` uses static class maps (no template literal class construction)
- [ ] Dark mode renders correctly (background `#111111`, all tokens switch)
- [ ] Light mode renders correctly
- [ ] Opacity modifiers work (`bg-primary/80`, `border-divider/50`, etc.)
- [ ] `bun run lint && bun run test:unit && bun run build` passes
- [ ] `bun run test:e2e:fast theme-basic.spec.ts` passes
- [ ] Documentation updated (components.md, architecture.md, README.md)
- [ ] heroui vendor chunk removed from `vite.config.ts`
- [ ] `index.html` comment updated

## Dependencies & Risks

- **Risk: Silent color failures** — Missing CSS variable definitions produce no build error, just invisible/wrong colors. Mitigate with visual verification in both themes.
- **Risk: shadcn token orphans** — The 16 shadcn classes in `src/components/ui/` may already be broken today. Verify before and after.
- **Risk: Opacity modifier breakage** — 14 classes use alpha modifiers. Tailwind CSS 4 `@theme --color-*` handles this with hex values, but must verify.
- **Dependency: Tailwind CSS 4's `@theme` directive** — well-documented and already used by the project's `@custom-variant`.

## Sources & References

- Tailwind CSS 4 `@theme` docs: https://tailwindcss.com/docs/theme
- HeroUI semantic colors source: `node_modules/@heroui/theme/dist/`
- Prior incident: shadcn CSS variables broke dashboard (see `docs/ai/handoffs/2026-03-15_01-20-12_test-audit-landing-heroui-removal.md`)
- Existing brand tokens pattern: `src/globals.css:19-32`
- Related work queue: `docs/plans/2026-03-27-001-remaining-work-queue-plan.md` (Item 1)
