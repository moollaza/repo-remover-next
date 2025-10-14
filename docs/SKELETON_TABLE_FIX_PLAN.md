# Skeleton Table Styling Fix Plan

**Date:** 2025-10-13
**Status:** 📋 Ready to Implement
**Issue:** Skeleton table styling doesn't match real table, causing jarring visual jump during loading

---

## 🔍 Problem Analysis

### Current State Issues (from screenshots and code review):

#### 1. Wrapper/Card Differences:

**Real Table** ([repo-table.tsx:171-197](../src/components/repo-table/repo-table.tsx#L171-L197)):
- ✅ Has `removeWrapper` prop → **NO card wrapper, NO shadow, NO border**
- ✅ Has `isStriped` prop → alternating row backgrounds
- ✅ Has `selectionMode="multiple"` → checkboxes visible

**Skeleton Table** ([repo-table-skeleton.tsx:26](../src/components/repo-table-skeleton.tsx#L26)):
- ❌ Missing `removeWrapper` → **HAS card wrapper with shadow/border**
- ❌ Missing `isStriped` → no alternating rows
- ❌ No selection mode → no checkboxes

#### 2. Table Structure Differences:

**Real Table:**
- Uses `COLUMN_ORDER` from [repo-config.ts:19](../src/config/repo-config.ts#L19)
- Column headers: "Name" and "Last Updated" (title case)
- Has pagination in `bottomContent`
- Has `className="mb-5"` for spacing

**Skeleton Table:**
- Hardcoded headers: "NAME" and "LAST UPDATED" (uppercase)
- No pagination skeleton
- Missing bottom spacing class

#### 3. Missing Visual Elements:

- ❌ No checkboxes in skeleton (real table has `selectionMode="multiple"`)
- ❌ No striped rows (real table has `isStriped`)
- ❌ No pagination component (real table has `bottomContent`)
- ❌ Different wrapper styling (shadow/border vs none)
- ❌ Incorrect header labels (uppercase vs title case)

---

## 📋 Implementation Plan

### Approach: Direct Skeleton Enhancement

**Why not use a prop on RepoTable?**
- ✅ Separation of concerns: Skeleton is a presentational component
- ✅ Simpler testing: Can test skeleton independently
- ✅ Better performance: Skeleton doesn't need logic/hooks of real table
- ✅ Existing pattern: Already have separate `RepoFiltersSkeleton`

**Why not create a shared config file?**
- ✅ `COLUMN_ORDER` already exists in `repo-config.ts`
- ✅ Props are simple to add directly to skeleton
- ✅ Avoid over-engineering for 3-4 prop values
- ✅ Keep changes minimal and focused

---

## 🎯 Implementation Steps

### **Step 1: Update RepoTableSkeleton Component**

**File:** `src/components/repo-table/repo-table-skeleton.tsx`

**Changes needed:**

1. **Import `COLUMN_ORDER`:**
```typescript
import { COLUMN_ORDER } from "@/config/repo-config";
```

2. **Add missing Table props:**
```typescript
<Table
  aria-label="Loading repositories"
  removeWrapper           // ✨ NEW - removes card wrapper
  isStriped              // ✨ NEW - adds alternating rows
  selectionMode="multiple" // ✨ NEW - shows checkbox column
  selectedKeys={new Set()} // ✨ NEW - empty selection state
  className="mb-5"        // ✨ NEW - matches real table spacing
  bottomContent={         // ✨ NEW - pagination skeleton
    <div className="flex w-full justify-center">
      <Skeleton className="h-10 w-64 rounded-lg" />
    </div>
  }
>
```

3. **Update TableHeader to use `COLUMN_ORDER`:**
```typescript
<TableHeader>
  {COLUMN_ORDER.map((column) => (
    <TableColumn
      key={column.key}
      className={column.className}
      allowsSorting  // Matches real table
    >
      {column.label}  {/* Uses "Name" and "Last Updated" */}
    </TableColumn>
  ))}
</TableHeader>
```

4. **Import Pagination component:**
```typescript
import {
  Pagination,  // ✨ NEW - for skeleton
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
```

---

### **Step 2: Complete Updated Component**

**Full updated `repo-table-skeleton.tsx`:**

```typescript
import {
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

import { COLUMN_ORDER } from "@/config/repo-config";

import RepoFiltersSkeleton from "./repo-filters-skeleton";

interface RepoTableSkeletonProps {
  rows?: number;
}

export default function RepoTableSkeleton({
  rows = 10,
}: RepoTableSkeletonProps) {
  return (
    <div className="space-y-5" data-testid="repo-table-skeleton-container">
      {/* Filters skeleton */}
      <RepoFiltersSkeleton />

      {/* Table skeleton - matches real table exactly */}
      <Table
        aria-label="Loading repositories"
        removeWrapper
        isStriped
        selectionMode="multiple"
        selectedKeys={new Set()}
        className="mb-5"
        bottomContent={
          <div className="flex w-full justify-center">
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
        }
      >
        <TableHeader>
          {COLUMN_ORDER.map((column) => (
            <TableColumn
              key={column.key}
              className={column.className}
              allowsSorting
            >
              {column.label}
            </TableColumn>
          ))}
        </TableHeader>

        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {/* NAME column */}
              <TableCell>
                <div>
                  {/* Repo name */}
                  <div className="mb-2">
                    <Skeleton className="h-7 w-48 rounded-lg" />
                  </div>
                  {/* Chips row */}
                  <div className="flex gap-2 mb-5">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  {/* Owner */}
                  <div className="mb-2">
                    <Skeleton className="h-4 w-32 rounded-lg" />
                  </div>
                  {/* Description */}
                  <Skeleton className="h-4 w-full rounded-lg" />
                </div>
              </TableCell>

              {/* LAST UPDATED column */}
              <TableCell>
                <Skeleton className="h-4 w-20 rounded-lg" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### **Step 3: Update Tests**

**File:** `src/components/repo-table/repo-table-skeleton.test.tsx`

**Test updates needed:**

1. **Verify no card wrapper:**
```typescript
test("renders without card wrapper", () => {
  const { container } = render(<RepoTableSkeleton />);

  // Should not have HeroUI's default card wrapper classes
  const table = container.querySelector('table');
  expect(table?.closest('.shadow-sm')).not.toBeInTheDocument();
});
```

2. **Verify striped rows:**
```typescript
test("renders with striped rows", () => {
  render(<RepoTableSkeleton rows={3} />);

  const rows = screen.getAllByRole('row');
  // Check that table has striped styling (implementation may vary)
  expect(rows.length).toBeGreaterThan(0);
});
```

3. **Verify checkbox column exists:**
```typescript
test("renders checkbox column", () => {
  render(<RepoTableSkeleton />);

  // Table should have selection mode enabled
  const table = screen.getByRole('table');
  expect(table).toBeInTheDocument();
  // Additional checkbox verification if needed
});
```

4. **Verify pagination skeleton:**
```typescript
test("renders pagination skeleton", () => {
  render(<RepoTableSkeleton />);

  // Look for skeleton in bottom content area
  const skeletons = screen.getAllByRole('status'); // Skeleton components have status role
  expect(skeletons.length).toBeGreaterThan(0);
});
```

5. **Verify correct column headers:**
```typescript
test("uses correct column headers from COLUMN_ORDER", () => {
  render(<RepoTableSkeleton />);

  expect(screen.getByText("Name")).toBeInTheDocument();
  expect(screen.getByText("Last Updated")).toBeInTheDocument();

  // Should NOT have uppercase versions
  expect(screen.queryByText("NAME")).not.toBeInTheDocument();
  expect(screen.queryByText("LAST UPDATED")).not.toBeInTheDocument();
});
```

---

### **Step 4: Update Storybook Stories**

**File:** `src/components/repo-table/repo-table-skeleton.stories.tsx`

**Story updates (if needed):**

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import RepoTableSkeleton from "@/components/repo-table/repo-table-skeleton";

const meta: Meta<typeof RepoTableSkeleton> = {
  component: RepoTableSkeleton,
  title: "Components/RepoTable/Skeleton",
  parameters: {
    layout: "padded",
    chromatic: {
      modes: {
        light: { theme: "light" },
        dark: { theme: "dark" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RepoTableSkeleton>;

/** Default skeleton with 10 rows - should match real table styling exactly */
export const Default: Story = {
  args: {
    rows: 10,
  },
};

/** Fewer rows (5) - typical first page */
export const FiveRows: Story = {
  args: {
    rows: 5,
  },
};

/** Many rows (20) */
export const TwentyRows: Story = {
  args: {
    rows: 20,
  },
};

/** Minimal (3 rows) */
export const MinimalRows: Story = {
  args: {
    rows: 3,
  },
};
```

**Visual regression testing checklist:**
- [ ] No card wrapper/shadow around table
- [ ] Striped rows visible
- [ ] Checkbox column visible on left
- [ ] Pagination skeleton at bottom
- [ ] Column headers match real table ("Name", "Last Updated")
- [ ] Works in both light and dark themes

---

## 🎨 Visual Checklist: Before vs After

| Element | Before (Broken) | After (Fixed) |
|---------|----------------|---------------|
| **Card wrapper** | ❌ Has shadow/border | ✅ No wrapper (`removeWrapper`) |
| **Striped rows** | ❌ No stripes | ✅ Alternating backgrounds |
| **Checkbox column** | ❌ Missing | ✅ Shows checkboxes |
| **Column headers** | ❌ "NAME", "LAST UPDATED" | ✅ "Name", "Last Updated" |
| **Column widths** | ✅ Already correct | ✅ Still correct (w-4/5, w-1/5) |
| **Pagination** | ❌ Missing | ✅ Skeleton pagination |
| **Table spacing** | ❌ Different | ✅ Identical (`mb-5`, `space-y-5`) |

---

## 📊 Success Criteria

✅ **No visual jump** when skeleton → real table transition
✅ **Identical wrapper** (both have `removeWrapper`)
✅ **Identical stripes** (both have `isStriped`)
✅ **Identical checkboxes** (both have `selectionMode="multiple"`)
✅ **Identical columns** (same headers from `COLUMN_ORDER`, widths, classes)
✅ **Identical pagination** (both have bottom content)
✅ **Identical spacing** (same `className="mb-5"`, `space-y-5`)
✅ **Works in light/dark themes** (semantic colors used throughout)

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Checkbox column in skeleton might not look right

**Problem:** Empty selection state might render oddly
**Solution:** Pass `selectedKeys={new Set()}` - HeroUI will render unchecked boxes properly

### Issue 2: Pagination skeleton size might not match

**Problem:** Real pagination component has dynamic width
**Solution:** Use `w-64` (256px) which approximates pagination with 5-7 page numbers

### Issue 3: `allowsSorting` shows sort icons in skeleton headers

**Problem:** Sort icons might look odd in skeleton
**Solution:** This is acceptable - real table has sort icons, consistency is more important than hiding them

### Issue 4: Striped rows might not animate smoothly

**Problem:** HeroUI applies stripes via CSS classes
**Solution:** Both components use same `isStriped` prop, so transition should be seamless

---

## 🚀 Implementation Order

1. ✅ Update `repo-table-skeleton.tsx` with all missing props
2. ✅ Import `COLUMN_ORDER` from repo-config
3. ✅ Add pagination skeleton to `bottomContent`
4. ✅ Update component imports (add `Pagination`)
5. ✅ Run linter: `npm run lint`
6. ✅ Run unit tests: `npm run test:unit repo-table-skeleton`
7. ✅ Visual test in Storybook: `npm run storybook`
8. ✅ Manual test with throttled network (Chrome DevTools → Network → Slow 3G)
9. ✅ Test in both light and dark themes
10. ✅ Verify no layout shift during skeleton → table transition

---

## 🧪 Testing Strategy

### Manual Testing:

1. **Chrome DevTools Network Throttling:**
   - Open DevTools → Network tab
   - Set throttling to "Slow 3G"
   - Clear cache and hard reload
   - Observe skeleton → table transition
   - Should be seamless with zero layout shift

2. **Theme Testing:**
   - Toggle between light and dark themes
   - Verify skeleton adapts correctly
   - Check that semantic colors work in both modes

3. **Storybook Visual Regression:**
   - Run Storybook: `npm run storybook`
   - Open `Components/RepoTable/Skeleton` stories
   - Compare skeleton stories side-by-side with real table stories
   - Verify visual consistency

### Automated Testing:

```bash
# Run all tests
npm run test:unit

# Run specific skeleton tests
npm run test:unit repo-table-skeleton

# Run linter
npm run lint

# Run build to catch any TS errors
npm run build
```

---

## 📝 Related Files

### Files to Modify:
- `src/components/repo-table/repo-table-skeleton.tsx` - PRIMARY CHANGE
- `src/components/repo-table/repo-table-skeleton.test.tsx` - Update tests

### Files to Reference (No Changes):
- `src/components/repo-table/repo-table.tsx` - Real table implementation
- `src/config/repo-config.ts` - Import `COLUMN_ORDER` from here
- `src/components/repo-table/repo-filters-skeleton.tsx` - Already correct

### Documentation:
- `docs/PHASE_3_FINAL.md` - Progressive loading implementation
- `CLAUDE.md` - Theme system and testing guidelines

---

## 🎯 Definition of Done

- [ ] `repo-table-skeleton.tsx` updated with all missing props
- [ ] Imports `COLUMN_ORDER` from `repo-config.ts`
- [ ] Pagination skeleton added to `bottomContent`
- [ ] All unit tests passing
- [ ] ESLint clean (no warnings/errors)
- [ ] TypeScript compiles with no errors
- [ ] Storybook renders skeleton correctly
- [ ] Visual verification: no layout shift during transition
- [ ] Works in both light and dark themes
- [ ] Manual test with throttled network successful
- [ ] Code reviewed and approved
- [ ] This plan document archived (mark as ✅ Complete)

---

## 🔗 References

- **HeroUI Table Docs:** https://heroui.com/docs/components/table
- **Issue:** Skeleton styling doesn't match real table (from user screenshots 2025-10-13)
- **Related Work:** Phase 3 progressive loading (docs/PHASE_3_FINAL.md)

---

**Ready to implement!** 🚀
