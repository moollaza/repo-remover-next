---
date: 2026-03-30
topic: shadcn-followups
---

# shadcn Component Adoption — Follow-up Work

## Problem Frame

PR #112 adopted 14 shadcn/base-ui components to replace raw HTML patterns. Several additional adoption opportunities were identified during the audit but deferred to keep the PR focused. These are cosmetic improvements to existing working code — no user-facing bugs.

## Requirements

- R1. **Skeleton primitive** — Replace custom `animate-pulse` div patterns in `repo-table-skeleton.tsx` and `repo-filters-skeleton.tsx` with shadcn `<Skeleton>` component. Generate via `bunx shadcn@latest add skeleton`.
- R2. **Progress primitive** — Replace custom progress bar in `repo-loading-progress.tsx` with shadcn `<Progress>` component. Generate via `bunx shadcn@latest add progress`. Preserve `role="progressbar"` and aria attributes.
- R3. **Theme token cleanup** — Audit `globals.css` for remnant HeroUI tokens (`--color-default-*`, `--color-danger`, `--color-success`, `--color-warning`) and migrate to shadcn semantic tokens (`--color-destructive`, `--color-muted`, etc.). Remove unused custom properties.
- R4. **Dead code removal** — Delete `scroll-button.tsx` + test (zero consumers). Remove unused Badge `info` variant and Button `link` variant, or find uses for them.
- R5. **Unused ui/ export cleanup** — Remove ~21 unused sub-component exports (CardHeader, CardFooter, AvatarGroup, AvatarBadge, PopoverHeader, PopoverTitle, etc.) to reduce dead code. ~130 LOC.

## Success Criteria

- Zero raw `animate-pulse` div patterns outside ui/ components
- Zero raw progress bar implementations outside ui/ components
- Zero HeroUI-era CSS custom properties in globals.css
- Zero dead component files (no consumers)
- All ui/ exports used somewhere or removed

## Scope Boundaries

- NOT changing component behavior or layout — purely swapping implementations
- NOT adding new shadcn components beyond Skeleton and Progress
- NOT changing the theme's visual appearance — only cleaning up token naming
- ButtonGroup+DropdownMenu is handled in PR #112, not here

## Key Decisions

- **Skeleton/Progress are separate PRs from theme cleanup**: Skeleton+Progress are mechanical swaps. Theme cleanup requires visual testing across every page.
- **Dead code removal is low-risk**: ScrollButton has zero imports. Unused exports are never referenced.

## Next Steps

Split into 2-3 small PRs:
1. PR: Skeleton + Progress primitives (R1, R2)
2. PR: Theme token cleanup (R3)
3. PR: Dead code + unused exports (R4, R5)
