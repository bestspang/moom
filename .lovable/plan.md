

# Further UI Density Reduction

## What Changed Before
Base font 14px, header h-14, cards p-4, table px-3 py-2, sidebar 200px. Still too large for a data-dense admin tool.

## Further Reductions

| Element | Current | New |
|---------|---------|-----|
| Body base font | `text-[14px]` | `text-[13px]` |
| Button default | `h-10 px-4 py-2` | `h-9 px-3 py-1.5` |
| Button sm | `h-9 px-3` | `h-8 px-2.5` |
| Button icon | `h-10 w-10` | `h-8 w-8` |
| Badge padding | `px-2.5 py-0.5` | `px-2 py-px` |
| Card header | `p-4` | `p-3` |
| Card content | `p-4 pt-0` | `p-3 pt-0` |
| Card footer | `p-4 pt-0` | `p-3 pt-0` |
| CardTitle | `text-lg` | `text-base` |
| Dialog content | `p-6 gap-4` | `p-5 gap-3` |
| DialogTitle | `text-lg` | `text-base` |
| PageHeader title | `text-xl` | `text-lg` |
| StatCard value | `text-xl` | `text-lg` |
| Table cell | `py-2` | `py-1.5` |
| StatusTabs | `text-sm` | `text-xs` |
| StatusTabs pill | `px-3 py-1.5` | `px-2.5 py-1` |

## Files to Edit (8 files, CSS-only)

1. **`src/index.css`** — `text-[14px]` → `text-[13px]`
2. **`src/components/ui/button.tsx`** — Reduce all size variants
3. **`src/components/ui/badge.tsx`** — Tighter padding
4. **`src/components/ui/card.tsx`** — p-4 → p-3, text-lg → text-base
5. **`src/components/ui/dialog.tsx`** — p-6 → p-5, gap-4 → gap-3, title text-base
6. **`src/components/ui/table.tsx`** — py-2 → py-1.5
7. **`src/components/common/PageHeader.tsx`** — text-xl → text-lg
8. **`src/components/common/StatCard.tsx`** — text-xl → text-lg
9. **`src/components/common/StatusTabs.tsx`** — text-xs, smaller pills

**Risk:** Zero. Pure CSS changes, no logic/data changes. All component APIs preserved.

**Result:** Another ~10% density gain. Tables show 3-4 more rows. Cards and dialogs feel tighter. The whole app feels like a professional SaaS admin panel.

