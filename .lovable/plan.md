

# Fix: Import Error Visibility

## Problem
The preview table (Step 3) and done screen (Step 5) don't clearly show which rows have errors:

1. **Preview**: Only shows the first error per row as a tiny badge — if there are multiple errors, the rest are hidden. No summary of total errors vs valid rows.
2. **Done screen**: Shows failed count but the error list is only available via CSV download — user can't see inline which rows failed or why.

## Plan

### File: `src/components/members/ImportMembersDialog.tsx`

**Step 3 (Preview) improvements:**
- Add a summary banner above the table: "X rows valid, Y rows with errors" with color coding
- Show ALL errors per row (not just `errors[0]`), each as a separate badge or as a comma-joined tooltip
- Highlight error rows with a red background tint
- Add an "Errors" column that shows a expandable list or tooltip with all validation issues
- Show error/warning icon on rows with issues
- Disable "Start Import" button if ALL rows have errors; show warning if some have errors

**Step 5 (Done) improvements:**
- Add an inline scrollable error list showing row number + name + reason (first 20 errors)
- Keep the "Download errors CSV" button for full list
- Make it clear which specific rows failed

### Changes (single file edit):

1. Preview summary banner with valid/error counts
2. Preview table: add red row highlighting + show all errors with tooltip
3. Preview: warn before import if errors exist
4. Done screen: inline error table (row, name, reason) capped at 20 rows

No other files need changes. No DB changes.

