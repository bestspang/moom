

# UI Density & Font Size Reduction Plan

## Problem
The current UI is too spacious for a desktop admin tool. Large fonts, generous padding, and oversized components waste screen real estate, forcing users to scroll more and see less data at a glance. An admin dashboard should prioritize **information density** while maintaining readability.

## Current Issues (from screenshots + code)

| Element | Current | Target |
|---------|---------|--------|
| Page title `h1` | `text-2xl font-bold` (24px) | `text-xl` (20px) |
| Page header margin | `mb-6` | `mb-4` |
| Main content padding | `p-4 md:p-6` | `p-3 md:p-5` |
| Card header padding | `p-6` (24px) | `p-4` (16px) |
| Card content padding | `p-6 pt-0` | `p-4 pt-0` |
| Card title font | `text-2xl` | `text-lg` |
| Table header height | `h-12` | `h-9` |
| Table header padding | `px-4` | `px-3` |
| Table cell padding | `p-4` | `px-3 py-2.5` |
| StatCard value | `text-2xl font-bold` | `text-xl font-bold` |
| StatCard padding | `p-4` | `p-3` |
| StatusTabs button | `px-4 py-2` | `px-3 py-1.5` |
| SearchBar input height | `h-10` | `h-9` |
| Sidebar nav items | `gap-3 px-3 py-2` | `gap-2.5 px-3 py-1.5 text-[13px]` |
| Sidebar width | `220px` | `200px` (+ update MainLayout `lg:pl-`) |
| Header height | `h-16` (64px) | `h-14` (56px) + update `top-16` → `top-14` |
| EmptyState icon | `h-16 w-16` | `h-12 w-12` |
| EmptyState padding | `py-12` | `py-8` |
| Body base font | browser default 16px | `text-[14px]` on body |

## Implementation (7 files)

### 1. `src/index.css` — Global base font
Add `font-size: 14px` to `body` rule to reduce overall text size across the app.

### 2. `src/components/ui/card.tsx` — Tighter card spacing
- `CardHeader`: `p-6` → `p-4`
- `CardTitle`: `text-2xl` → `text-lg`
- `CardContent`: `p-6 pt-0` → `p-4 pt-0`
- `CardFooter`: `p-6 pt-0` → `p-4 pt-0`

### 3. `src/components/ui/table.tsx` — Denser table rows
- `TableHead`: `h-12 px-4` → `h-9 px-3 text-xs`
- `TableCell`: `p-4` → `px-3 py-2`

### 4. `src/components/common/PageHeader.tsx` — Smaller title
- `mb-6` → `mb-4`
- `text-2xl font-bold` → `text-xl font-bold`

### 5. `src/components/common/StatCard.tsx` — Compact stat cards
- `CardContent p-4` → `p-3`
- Value: `text-2xl` → `text-xl`

### 6. `src/components/common/StatusTabs.tsx` — Smaller filter pills
- `px-4 py-2` → `px-3 py-1.5`

### 7. `src/components/common/EmptyState.tsx` — Less vertical space
- Icons: `h-16 w-16` → `h-12 w-12`
- Container: `py-12` → `py-8`
- Message: `text-lg` → `text-base`

### 8. `src/components/layout/Header.tsx` — Shorter header
- `h-16` → `h-14`

### 9. `src/components/layout/MainLayout.tsx` — Match header offset
- `pt-16` → `pt-14`

### 10. `src/components/layout/Sidebar.tsx` — Narrower + compact items
- Width: `w-[220px]` → `w-[200px]`
- `top-16` → `top-14`
- Nav items: `gap-3 px-3 py-2` → `gap-2.5 px-3 py-1.5`
- Icon: `h-5 w-5` → `h-4 w-4`
- Group icon already `h-4 w-4` (keep)

### 11. `src/components/layout/MainLayout.tsx` — Match sidebar width
- `lg:pl-[220px]` → `lg:pl-[200px]`

### 12. `src/components/ui/input.tsx` — Smaller inputs
- `h-10` → `h-9`

**Risk:** Low. All changes are CSS-only — no logic, no data flow, no DB changes. Purely visual density improvements. Every component retains its existing structure and API.

**Result:** ~15-20% more visible data on screen. Tables show 2-3 more rows per page. Dashboard fits more content above the fold. The app feels like a professional admin tool rather than a consumer app.

