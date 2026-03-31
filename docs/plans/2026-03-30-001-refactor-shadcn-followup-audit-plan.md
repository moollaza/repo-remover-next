---
title: "refactor: shadcn follow-up audit and adoption"
type: refactor
status: active
date: 2026-03-30
---

# refactor: shadcn follow-up audit and adoption

## Overview

Follow-up work identified during the shadcn component adoption (PR #112). These items are lower priority and can be done as separate PRs against main after #112 merges.

## Follow-up Items

### 1. Skeleton component adoption
- **What**: Replace hand-rolled loading skeletons in `repo-table-skeleton.tsx` with shadcn `Skeleton` component
- **Why**: Consistent animation + reduced custom CSS. shadcn Skeleton uses `animate-pulse` with proper colors
- **Effort**: Small (1 file)
- **Command**: `bunx shadcn@latest add skeleton`

### 2. Progress component adoption
- **What**: Replace custom progress bar in `confirmation-modal.tsx` with shadcn `Progress`
- **Why**: Accessible progress bar with proper aria attributes, animated fill
- **Effort**: Small (1 file)
- **Command**: `bunx shadcn@latest add progress`

### 3. Spinner/loading component
- **What**: Replace inline `<Loader2 className="animate-spin">` patterns with a consistent loading component
- **Why**: 5+ places use the same Loader2+animate-spin pattern — extract to shared component
- **Effort**: Small (new component + 5 replacements)

### 4. shadcn theming integration
- **What**: Audit CSS custom properties in `globals.css` against shadcn's theme system
- **Why**: Some colors use `bg-content1`/`text-default` (old HeroUI names) while shadcn uses `bg-card`/`text-foreground`. Align naming for consistency
- **Effort**: Medium (CSS + all files using old names)

### 5. Mobile VRT screenshots
- **What**: Add iPhone 14 (390x844) viewport VRT screenshots for landing + dashboard
- **Why**: Currently only desktop VRT; mobile layout regressions go undetected
- **Effort**: Small (add 4-5 screenshots to visual-regression.spec.ts)

### 6. Unused shadcn sub-component exports cleanup
- **What**: Remove ~130 LOC of unused exports: `AvatarBadge`, `AvatarGroup`, `CardHeader`, `CardFooter`, `PopoverHeader`, etc.
- **Why**: Dead code from generator; not used anywhere
- **Effort**: Small (trim 6 files)

### 7. Replace remaining raw checkboxes with Checkbox
- **What**: The "select all" and individual row checkboxes in repo-table still use the old Checkbox.Root from @base-ui/react directly. Wrap with consistent shadcn Checkbox
- **Why**: Consistency with the rest of the component system
- **Effort**: Small (repo-table.tsx)

### 8. Storybook consideration (DEFERRED)
- **What**: Consider adding Storybook for component documentation
- **Why**: Not needed now — components are app-specific, not a shared library. Revisit if component count exceeds 20+ or team grows
- **Decision**: SKIP — use Argos + Playwright for VRT instead

## Priority Order

1. Mobile VRT screenshots (#5) — prevents future mobile regressions
2. Skeleton + Progress (#1, #2) — quick wins, 2 more shadcn components
3. Theme naming alignment (#4) — removes old HeroUI naming
4. Unused exports cleanup (#6) — dead code removal
5. Spinner extraction (#3) — nice-to-have DRY improvement
6. Row checkboxes (#7) — low impact, works fine as-is

## Sources

- PR #112: https://github.com/moollaza/repo-remover-next/pull/112
- shadcn docs: https://ui.shadcn.com/docs/components
- Base UI docs: https://base-ui.com/react/components
