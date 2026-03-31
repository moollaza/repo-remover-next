---
title: "refactor: shadcn component adoption phases 1-3"
type: refactor
status: active
date: 2026-03-29
---

# refactor: shadcn component adoption phases 1-3

## Overview

Continue the shadcn/base-ui component adoption started in PR #112 (Phase 0). Replace remaining raw HTML patterns with proper shadcn primitives: checkboxes, icons, dropdowns, and the confirmation dialog.

## Problem Statement

After Phase 0, we still have:
- 3 raw `<input type="checkbox">` elements (shadcn Checkbox already exists but unused)
- ~100 LOC of inline SVGs duplicating icons available in lucide-react
- 3 hand-rolled dropdowns in repo-filters.tsx with manual state/click-outside (~140 LOC)
- A custom modal overlay with manual portal/scroll-lock/escape/focus (base-ui Dialog handles all of this)
- Config constant duplication between repo-filters.tsx and repo-config.ts

## Proposed Solution

Three phases, each a separate commit on the existing `moollaza/shadcn-atomic-components` branch:

### Phase 1: Checkboxes + Icons + Config Dedup (Low risk)

**1a. Config dedup** — Delete local `PER_PAGE_OPTIONS`, `REPO_TYPES`, `REPO_ACTIONS` from `repo-filters.tsx`. Import from `@/config/repo-config.ts`. Update `repo-filters.test.tsx` imports.

**1b. Replace 3 raw checkboxes with shadcn Checkbox:**

| Location | File | Current | After |
|----------|------|---------|-------|
| Remember me (dashboard form) | `github-token-form.tsx:314` | `<input type="checkbox">` in `<Label>` | `<Checkbox>` + `<Label>` |
| Remember token (landing form) | `get-started-section.tsx:255` | `<input type="checkbox">` in `<Label>` | `<Checkbox>` + `<Label>` |
| Repo type filters (dropdown) | `repo-filters.tsx:237` | `<input type="checkbox">` in `<li role="option">` | `<Checkbox>` in list item |

**Checkbox DOM change:** `<input type="checkbox">` → `<button role="checkbox">`. The `onChange(e) => e.target.checked` pattern → `onCheckedChange(checked: boolean)`.

**Test selector migrations (CRITICAL):**

| File | Line | Current Selector | New Selector |
|------|------|-----------------|--------------|
| `repo-table.integration.test.tsx` | 87, 119 | `querySelector('input[type="checkbox"]')` | `getByRole('checkbox', { name })` |
| `e2e/pages/dashboard.ts` | 59 | `this.table.locator("tbody tr input[type='checkbox']")` | `this.table.locator('tbody tr').getByRole('checkbox')` |

Selectors using `getByRole("checkbox")` (lines 45, 418 in dashboard.ts) will continue working. Playwright's `toBeChecked()` works with `aria-checked` on buttons.

**1c. Replace inline SVGs with lucide-react:**

| File | SVG | Lucide Icon | LOC Saved |
|------|-----|-------------|-----------|
| `github-token-form.tsx:210-252` | Eye/EyeOff toggle | `Eye`, `EyeOff` | ~40 |
| `github-token-form.tsx:264-276` | X clear button | `X` | ~10 |
| `github-token-form.tsx:342-360` | Spinner | `Loader2` | ~15 |
| `get-started-section.tsx:174-206` | Eye/EyeOff toggle | `Eye`, `EyeOff` | ~30 |
| `dashboard.tsx:119-131` | X dismiss icon | `X` | ~10 |
| `generate-repos-button.tsx:51-65` | Spinner | `Loader2` | ~15 |
| `product-showcase.tsx:167-176` | Checkmark | `Check` | ~7 |

Keep: `footer.tsx` BlueskyIcon (no lucide equivalent).

**Acceptance Criteria:**
- [ ] No `<input type="checkbox">` in src/components/ (except shadcn checkbox.tsx internals)
- [ ] No inline `<svg>` in src/components/ except BlueskyIcon in footer.tsx
- [ ] Config constants imported from single source (`@/config/repo-config.ts`)
- [ ] All 390 unit tests pass (with updated selectors)
- [ ] E2E page object selectors updated
- [ ] `bun run lint && bun run test:unit && bun run build` passes

### Phase 2: Dropdowns → base-ui Select (Medium risk)

Generate shadcn `select` component: `npx shadcn@latest add select`

Replace 3 custom dropdowns in `repo-filters.tsx`:

**2a. Per-page selector** (lines 161-202) → `<Select.Root>` single-select
- Value: current perPage option
- `onValueChange` → calls `onPerPageChange(new Set([value]))`
- Closes on selection (default behavior)

**2b. Repo-type filter** (lines 205-249) → `<Select.Root multiple>` multi-select
- Values: array of active repo type keys
- `onValueChange` → calls `onRepoTypesFilterChange(newSet)`
- Stays open after each selection (multi-select default)
- `Select.ItemIndicator` shows checkmark for selected types

**2c. Action dropdown** (lines 278-329) → `<Select.Root>` single-select
- Value: current action key
- Split button pattern: primary `<Button>` + `<Select.Trigger>` chevron
- `onValueChange` → calls `onRepoActionChange(new Set([key]))`
- Closes on selection

**Delete:**
- 3x `useState` for dropdown open state (lines 63-65)
- 3x `useRef` for click-outside refs (lines 66-68)
- `useEffect` with click-outside listener (lines 86-112)
- Manual `z-50` positioned absolute divs

**Acceptance Criteria:**
- [ ] 0 manual dropdown state management in repo-filters.tsx
- [ ] 0 click-outside useEffect handlers
- [ ] Keyboard navigation works (Arrow keys, Enter, Escape, Home/End)
- [ ] All unit tests pass (update any dropdown-specific selectors)
- [ ] E2E page object's `filterByType()` works with new ARIA roles
- [ ] `bun run lint && bun run test:unit && bun run build` passes

### Phase 3: Confirmation Modal → base-ui Dialog (Higher risk)

Generate shadcn `dialog` component: `npx shadcn@latest add dialog`

Replace `ModalOverlay` in `confirmation-modal.tsx` with base-ui Dialog:

**What Dialog replaces:**
- `createPortal(... , document.body)` → `Dialog.Portal`
- Manual `document.body.style.overflow = "hidden"` → Dialog's built-in scroll lock
- Manual `document.addEventListener("keydown", ...)` → Dialog's Escape handling
- Manual backdrop click detection → Dialog's `onOpenChange` with `reason`
- Manual focus management → Dialog's focus trap

**Dynamic dismissibility (CRITICAL):**
```tsx
<Dialog.Root
  open={isOpen}
  onOpenChange={(open, event) => {
    // Block dismissal during progress mode
    if (!open && state.mode === "progress") return;
    if (!open) onClose();
  }}
>
```

**What stays unchanged:**
- `useConfirmationModal` hook and reducer (no changes)
- All `data-testid` attributes
- Three internal views: `ConfirmationView`, `ProgressView`, `ResultView`
- All business logic and API calls

**Acceptance Criteria:**
- [ ] Modal cannot be dismissed during progress mode (Escape, backdrop click both blocked)
- [ ] Modal can be dismissed during confirmation and result modes
- [ ] Focus trapped inside modal when open
- [ ] Body scroll locked when modal open
- [ ] All `data-testid` values preserved
- [ ] All 390 unit tests pass
- [ ] confirmation-modal.test.tsx and confirmation-modal.integration.test.tsx pass
- [ ] `bun run lint && bun run test:unit && bun run build` passes

## Technical Considerations

- **Bundle size**: Phase 2 adds no new dependencies (Select uses same @base-ui/react + @floating-ui already in bundle from Popover). Phase 3 adds Dialog from @base-ui/react (lightweight, no Floating UI needed).
- **base-ui uses `render` prop, NOT `asChild`**: Important for composition. E.g., `<Select.Trigger render={<Button variant="outline" />}>`.
- **Tailwind data attribute variants**: Use `data-highlighted:bg-accent`, `data-selected:font-medium` for base-ui state styling.
- **Test after each phase**: Run full suite after each commit, not just at the end.

## Dependencies & Risks

- **Phase 1**: Low risk. Checkbox is a 1:1 replacement. Icon swap is visual-only. Config dedup is straightforward. Main risk: forgetting a test selector.
- **Phase 2**: Medium risk. Dropdown behavior changes (keyboard nav added, ARIA roles change). E2E locators may need updates. `Select` with `multiple` is less common — verify it works.
- **Phase 3**: Higher risk. Dialog manages focus/scroll/escape differently than the custom implementation. The dynamic dismissibility toggle is the hardest constraint. Test thoroughly.

## Sources & References

- Existing Phase 0 PR: #112
- Previous plan: `docs/plans/2026-03-28-004-refactor-audit-shadcn-baseui-component-usage-plan.md`
- Base UI Select docs: https://base-ui.com/react/components/select
- Base UI Dialog docs: https://base-ui.com/react/components/dialog
- shadcn base-nova config: `components.json`
- Existing patterns: `src/components/ui/popover.tsx`, `src/components/ui/checkbox.tsx`
