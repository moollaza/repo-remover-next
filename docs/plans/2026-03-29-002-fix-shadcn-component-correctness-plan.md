---
title: "Fix shadcn/Base UI component correctness issues"
type: fix
status: active
date: 2026-03-29
---

# Fix shadcn/Base UI Component Correctness Issues

## Overview

Post-adoption audit of 14 shadcn components revealed several correctness issues: the Popover `render` prop double-click bug, className overrides fighting component base styles, raw HTML elements that should use components, and visual regressions from missing/incorrect classes. This plan addresses all findings from a doc-driven audit against the official Base UI and shadcn v4 documentation.

## Problem Statement

After adopting shadcn components in PR #112, several issues emerged:
1. **Popover double-click** — `PopoverTrigger render={<Button>}` requires 2 clicks to open
2. **Action dropdown sizing** — Split-button chevron trigger renders too large
3. **Select overrides fighting base styles** — SelectTrigger has grid layout + cursor-default but we override with flex + custom cursor
4. **5 raw `<button>` elements remain** — product-showcase, scroll-button, repo-filters dropdown items
5. **Unused variants/exports** — Badge `info`, Button `link`, 30+ unused component sub-exports

## Root Cause Analysis (from Base UI docs)

### Popover render prop

Per Base UI docs, `render` prop works when the custom component **forwards ref and spreads all received props**. Our `Button` wraps `@base-ui/react/button` which renders its own `<button>` — so composing `PopoverTrigger render={<Button>}` creates a nested button situation. The fix is either:
- Use `PopoverTrigger` directly with className (current fix — simpler, correct)
- Use `render` with a raw `<button>` that forwards ref (works per docs)

### Select trigger

Base UI's `Select.Trigger` uses a grid layout with 2 columns (text + icon). Our `SelectTrigger` correctly uses `flex` with `justify-between` and appends the `SelectPrimitive.Icon` as a child. The className overrides in repo-filters add `bg-content1 text-foreground hover:bg-content2` — these are semantic tokens and correct. The issue is `border-divider` overriding `border-input` (the base).

## Acceptance Criteria

### Phase A: Fix Popover & Dropdown Issues (HIGH)

- [x] ~~PopoverTrigger uses native element, not render prop with Button~~ (done in 0847310)
- [x] ~~Action dropdown opens on first click~~ (done in 0847310)
- [x] ~~Action dropdown opens even when no repos selected~~ (done in 0847310)
- [ ] Action dropdown chevron trigger matches action button height exactly (40px)
- [ ] Popover dropdown items use `Button variant="ghost"` instead of raw `<button>`
- [ ] Info tooltip in get-started-section opens on first click (verify)

### Phase B: Fix Visual Regressions (HIGH)

- [x] ~~Pagination prev/next are square (size=icon)~~ (done in 0847310)
- [ ] Pagination numbers + chevrons centered with equal padding
- [ ] Testimonial card padding matches pre-PR baseline (p-6 inner content)
- [ ] Table description text wraps (no whitespace-nowrap on TableCell) — verify fix
- [ ] Select dropdown items have proper padding (match shadcn reference: `py-1.5 pr-8 pl-2`)
- [ ] Select per-page dropdown positioning correct (not overlapping trigger)

### Phase C: Replace Remaining Raw HTML (MEDIUM)

- [ ] product-showcase.tsx "Try It Now" raw `<button>` → `Button`
- [ ] scroll-button.tsx raw `<button>` → `Button` with custom variant or className
- [ ] repo-filters.tsx Popover dropdown `<button>` items → `Button variant="ghost"`
- [ ] header.tsx "Go to Dashboard" `<a>` → `Button variant="default" render={<a>}`

### Phase D: Cleanup Dead Code (LOW)

- [ ] Remove unused Badge `info` variant (or add a use for it)
- [ ] Remove unused Button `link` variant (or add a use for it)
- [ ] Remove unused Card sub-exports: CardHeader, CardFooter, CardTitle, CardAction, CardDescription
- [ ] Remove unused Avatar sub-exports: AvatarGroup, AvatarGroupCount, AvatarBadge
- [ ] Remove unused Popover sub-exports: PopoverHeader, PopoverTitle, PopoverDescription
- [ ] Remove unused Dialog sub-exports: DialogOverlay, DialogPortal
- [ ] Total: ~130 LOC of dead exports to remove

### Phase E: Add Mobile VRT Screenshots (MEDIUM)

- [x] ~~iPhone 14 (390x844) viewport screenshots added~~ (already in spec)
- [ ] Verify mobile screenshots capture action dropdown, filters, pagination
- [ ] Add tablet breakpoint (768px) if meaningful UI changes exist

## Technical Details

### Files to Modify

**Phase A:**
- `src/components/repo-table/repo-filters.tsx` — dropdown items, trigger sizing
- `src/components/landing/get-started-section.tsx` — verify info tooltip

**Phase B:**
- `src/components/ui/pagination.tsx` — padding/centering
- `src/components/landing/testimonials-section.tsx` — card padding
- `src/components/ui/table.tsx` — verify no whitespace-nowrap
- `src/components/ui/select.tsx` — item padding, positioning

**Phase C:**
- `src/components/landing/product-showcase.tsx` — raw button
- `src/components/landing/scroll-button.tsx` — raw button
- `src/components/repo-table/repo-filters.tsx` — dropdown items
- `src/components/header.tsx` — dashboard link

**Phase D:**
- All ui/ component files — remove dead exports

### Key Docs References

- Base UI Composition: https://base-ui.com/react/handbook/composition
- Base UI Popover: https://base-ui.com/react/components/popover
- Base UI Select: https://base-ui.com/react/components/select
- shadcn Button: https://ui.shadcn.com/docs/components/button
- shadcn Pagination: https://ui.shadcn.com/docs/components/pagination

## Success Metrics

- Zero visual regressions in Argos VRT (desktop + mobile)
- All interactive elements (popovers, selects, dialogs) work on first click
- Zero raw `<button>` or `<input>` elements outside ui/ components
- All ui/ exports are used somewhere, or removed
