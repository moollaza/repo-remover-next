# Dashboard Polish TODO

## UI Issues (from screenshots)

### 1. Checkboxes look unstyled

- Plain browser checkboxes need custom styling
- Install shadcn Checkbox component, or style with Tailwind (accent-color, custom appearance)

### 2. Archive/Delete button group height mismatch

- The "Archive Selected Repos" button is taller than the dropdown chevron button
- Both should be the same height — likely need `h-10` or similar on both

### 3. Repo type filter — "None" type needed

- Current behavior: selecting "Organization" shows org repos PLUS default (non-typed) repos
- Need a "Default" or "None" option that represents repos with no special type flags
- Consider "All" / "None" quick-toggle buttons at the top of the dropdown
- The filter logic in `use-repo-filters.ts` needs updating — currently it filters OUT repos that match unselected types, but doesn't filter FOR repos that match selected types exclusively

### 4. Mobile responsiveness issues

- Filter grid (`grid-cols-12`) doesn't collapse well on mobile
- Action button text wraps awkwardly on small screens
- Table needs horizontal scroll or card layout on mobile
- Header user dropdown needs mobile treatment
- Search input Cmd+K badge takes up space on mobile

## shadcn Components to Consider

### Install shadcn Checkbox

```bash
npx shadcn@latest add checkbox
```

Use for table row selection and select-all — proper styled checkboxes with check mark animation.

### Install shadcn Select

```bash
npx shadcn@latest add select
```

Could replace the custom dropdown for per-page and repo-type selects.

### Install shadcn DropdownMenu

```bash
npx shadcn@latest add dropdown-menu
```

For the action selector and user dropdown — better keyboard navigation and accessibility.

## Mobile Layout Strategy

### Filters

- Stack vertically on mobile (`grid-cols-1` below `md:`)
- Search takes full width
- Per-page and type filter side by side
- Action button full width below filters

### Table

- Consider card layout on mobile (each repo as a card instead of table row)
- Or horizontal scroll with sticky first column (checkbox + name)

### Header

- Hide user name on mobile (show avatar only)
- Hamburger menu for nav links
- Hide "Generate Random Repos" button on mobile (dev only anyway)
