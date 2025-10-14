# UI Density & Visual Improvements Implementation Plan

## Overview

This document outlines the design changes needed to improve information density, compactness, and visual polish based on the Figma reference design while working within HeroUI constraints.

## Design Comparison

### Current Issues
1. **Excessive whitespace** - Too much vertical/horizontal spacing between elements
2. **Large component sizes** - Using default/large sizes instead of compact variants
3. **Poor archived repo styling** - Entire row faded with opacity-50, hard to read
4. **Missing table borders** - Table looks disconnected, lacks visual structure
5. **Large text** - Font sizes are too large (text-xl for repo names)
6. **Excessive chip spacing** - 5px bottom margin on chips creates unnecessary height

### Figma Reference Strengths
1. **Compact layout** - Dense information presentation
2. **Clear visual hierarchy** - Proper use of borders and dividers
3. **Archived badge styling** - Orange badge with normal text contrast
4. **Subtle row striping** - Clear row separation
5. **Proper whitespace** - Tight but readable spacing

## Implementation Plan

### Phase 1: Component Size Reduction

#### 1.1 Input Components (RepoFilters)
**File**: `src/components/repo-table/repo-filters.tsx`

**Changes**:
- [ ] Change all `Select` components to use `size="sm"`
- [ ] Change `Input` search to use `size="sm"`
- [ ] Change `Button` and `ButtonGroup` to use `size="md"` (currently `lg`)
- [ ] Reduce grid gap from `gap-4` (1rem) to `gap-3` (0.75rem)
- [ ] Update label text size if needed for visual balance

**Before**:
```typescript
<Select
  label="Repos per page"
  // ... other props
>
```

**After**:
```typescript
<Select
  size="sm"
  label="Repos per page"
  // ... other props
>
```

#### 1.2 Skeleton Components
**File**: `src/components/repo-table/repo-filters-skeleton.tsx`

**Changes**:
- [ ] Reduce skeleton height from `h-14` to `h-10` (matches sm inputs)
- [ ] Update grid gap to match filters: `gap-3`

### Phase 2: Table Density Improvements

#### 2.1 Table Component
**File**: `src/components/repo-table/repo-table.tsx`

**Changes**:
- [ ] Add borders to table using HeroUI table props or custom classes
- [ ] Reduce vertical spacing in repo details section
- [ ] Adjust cell padding for tighter layout
- [ ] Update pagination size if needed

**Table wrapper changes**:
```typescript
<Table
  aria-label="GitHub repositories table"
  // Add border styling
  classNames={{
    wrapper: "border border-divider rounded-lg",
    th: "border-b border-divider",
    td: "py-3", // Reduce from default padding
  }}
  // ... rest of props
>
```

#### 2.2 Repository Row Content
**File**: `src/components/repo-table/repo-table.tsx` (lines 225-268)

**Changes**:
- [ ] Reduce repo name font size from `text-xl` to `text-base` or `text-lg`
- [ ] Remove font-semibold from repo name, use font-medium
- [ ] Reduce margin-bottom on name from `mb-2` to `mb-1.5`
- [ ] Reduce chips margin-bottom from `mb-5` to `mb-2`
- [ ] Use smaller chip variant if available or adjust padding
- [ ] Reduce description text size to `text-sm`
- [ ] Reduce owner info margin to `mb-1`

**Before**:
```typescript
<div className="mb-2" data-testid="repo-name">
  <Link
    className="font-semibold text-xl"
    href={repo.url as string}
    isExternal
  >
    {repo.name}
  </Link>
</div>
<div className="flex gap-2 mb-5" data-testid="repo-tags">
```

**After**:
```typescript
<div className="mb-1.5" data-testid="repo-name">
  <Link
    className="font-medium text-base"
    href={repo.url as string}
    isExternal
  >
    {repo.name}
  </Link>
</div>
<div className="flex gap-2 mb-2" data-testid="repo-tags">
```

#### 2.3 Chip Styling
**Current chips**: `<Chip size="sm">` already using small size

**Changes**:
- [ ] Verify chips are using smallest HeroUI size
- [ ] Consider custom chip styling if HeroUI sm is still too large
- [ ] Ensure proper visual weight for archived badge (warning color)

### Phase 3: Archived Repository Styling (CRITICAL)

**File**: `src/components/repo-table/repo-table.tsx` (lines 217-224)

**Current Problem**:
```typescript
<TableRow
  className={
    isRepoDisabled(repo) ? "opacity-50 pointer-events-none" : ""
  }
  // ...
>
```

This applies `opacity-50` to the **entire row**, making text hard to read and looking unprofessional.

**Solution**: Remove row-level opacity, rely on disabled state and visual indicators

**Changes**:
- [ ] Remove `opacity-50` from disabled rows entirely
- [ ] Keep `pointer-events-none` for interaction blocking
- [ ] Add subtle visual indicator instead (border-left or background tint)
- [ ] Rely on "Archived" chip badge for primary visual indication

**After**:
```typescript
<TableRow
  className={
    isRepoDisabled(repo)
      ? "pointer-events-none border-l-4 border-warning/30"
      : ""
  }
  data-testid="repo-row"
  key={repo.id}
>
```

**Alternative approach** (more subtle):
```typescript
<TableRow
  className={
    isRepoDisabled(repo)
      ? "pointer-events-none bg-default-50/50"
      : ""
  }
  data-testid="repo-row"
  key={repo.id}
>
```

**Chip remains prominent**:
```typescript
{repo.isArchived && (
  <Chip color="warning" size="sm">
    Archived
  </Chip>
)}
```

### Phase 4: Table Border & Structure

**File**: `src/components/repo-table/repo-table.tsx`

**Changes**:
- [ ] Add table wrapper border
- [ ] Add header border-bottom
- [ ] Ensure proper use of `border-divider` for theme support
- [ ] Verify striped rows have good contrast

**Implementation**:
```typescript
<Table
  aria-label="GitHub repositories table"
  classNames={{
    wrapper: "border border-divider rounded-lg shadow-sm",
    th: "border-b-2 border-divider bg-default-100",
    td: "py-3",
  }}
  isStriped
  // ... rest
>
```

### Phase 5: Skeleton Updates

#### 5.1 RepoTableSkeleton
**File**: `src/components/repo-table/repo-table-skeleton.tsx`

**Changes**:
- [ ] Match new table border styling
- [ ] Update skeleton heights to match new compact sizing
- [ ] Reduce spacing to match real table

**Updates**:
```typescript
// Line 60: Repo name skeleton
<Skeleton className="h-6 w-48 rounded-lg" /> // was h-7

// Line 63: Chips
<div className="flex gap-2 mb-2"> // was mb-5

// Add table border
<Table
  className="mb-5 border border-divider rounded-lg"
  // ...
>
```

### Phase 6: Dashboard Header & Spacing

**File**: `src/components/dashboard.tsx`

**Changes**:
- [ ] Reduce page title size from `text-3xl` to `text-2xl`
- [ ] Reduce bottom margin on header from `mb-10` to `mb-6` or `mb-8`
- [ ] Reduce section padding from `py-16` to `py-8` or `py-10`

**Before**:
```typescript
<section className="py-16 flex-grow">
  <div className="flex items-center justify-between mb-10">
    <h1 className="text-3xl font-semibold" data-testid="repo-table-header">
```

**After**:
```typescript
<section className="py-10 flex-grow">
  <div className="flex items-center justify-between mb-6">
    <h1 className="text-2xl font-semibold" data-testid="repo-table-header">
```

### Phase 7: Global Spacing Adjustments

**File**: `src/components/repo-table/repo-table.tsx`

**Changes**:
- [ ] Reduce space-y on main container from `space-y-5` to `space-y-4`
- [ ] Review table bottom margin (`mb-5` → `mb-4`)

## Testing Strategy

### Visual Regression Testing
- [ ] Test in Storybook for both light and dark themes
- [ ] Compare before/after screenshots
- [ ] Verify archived repo visibility in both themes

### Component Testing
- [ ] Run unit tests: `npm run test:unit`
- [ ] Verify all existing tests pass
- [ ] Update snapshot tests if needed

### E2E Testing
- [ ] Run E2E tests: `npm run test:e2e:fast`
- [ ] Test archived repo interaction (should be disabled but visible)
- [ ] Test theme switching with new styles

### Manual Testing Checklist
- [ ] Light theme: all text readable
- [ ] Dark theme: all text readable
- [ ] Archived repos: clearly indicated but not faded
- [ ] Table borders visible in both themes
- [ ] Hover states work correctly
- [ ] Selection checkbox alignment correct
- [ ] Mobile responsive (if applicable)

## Priority & Risk Assessment

### High Priority (P0)
1. **Archived repo styling fix** - Current implementation is poor UX
2. **Component size reduction** - Quick wins for density
3. **Table borders** - Improves visual structure

### Medium Priority (P1)
4. **Text size adjustments** - Balance readability with density
5. **Spacing reduction** - Incremental improvements
6. **Skeleton updates** - Maintain consistency

### Low Priority (P2)
7. **Dashboard header adjustments** - Nice-to-have polish

### Risks
- **Text legibility**: Monitor small text sizes in dark mode
- **Touch targets**: Ensure buttons remain accessible (min 44px)
- **Breaking changes**: Some spacing changes may affect tests
- **Theme compatibility**: Verify border colors work in both themes

## Implementation Order

### Recommended Sequence
1. Start with **archived repo styling** (highest impact)
2. Add **table borders** (structural improvement)
3. Update **component sizes** (filters, buttons)
4. Adjust **text sizes and spacing** (incremental)
5. Update **skeleton components** (consistency)
6. Final polish: **dashboard header**

### Commit Strategy
- Each phase should be a separate commit
- Run tests after each phase
- Take screenshots for documentation

## Design Tokens Reference

### Current Sizes
- Input default: `h-14` (~56px)
- Input small: `h-10` (~40px)
- Button lg: `h-12` (~48px)
- Button md: `h-10` (~40px)
- Text xl: `1.25rem` (20px)
- Text base: `1rem` (16px)

### Spacing Scale
- gap-4: `1rem` (16px)
- gap-3: `0.75rem` (12px)
- mb-5: `1.25rem` (20px)
- mb-2: `0.5rem` (8px)

### Target Spacing (After)
- Primary gaps: `gap-3` (12px)
- Section spacing: `space-y-4` (16px)
- Content margins: `mb-2` (8px)

## HeroUI Semantic Colors Used

Ensure all changes use semantic colors:
- `border-divider` - Border colors
- `bg-default-100` - Subtle backgrounds
- `bg-content1` - Content backgrounds
- `text-foreground` - Primary text
- `text-default-500` - Secondary text
- `border-warning/30` - Archived indicator (optional)
- `bg-default-50/50` - Archived background (optional)

## Success Metrics

After implementation:
- [ ] 20-30% more content visible without scrolling
- [ ] Archived repos clearly visible and differentiated
- [ ] All tests pass
- [ ] No accessibility regressions
- [ ] Positive visual comparison to Figma reference

## Notes

- Work within HeroUI's design system - don't fight the framework
- Use semantic colors exclusively for theme compatibility
- Test both light and dark mode after each change
- Consider mobile viewport impacts
- Document any deviations from plan with reasoning
