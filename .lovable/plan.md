

# Fix Badge Emoji on Home Page MomentumCard

## Problem
The `MomentumCard.tsx` (home page) still uses `b.badge?.iconUrl` to render an `<img>` tag. Since the icon files don't exist, the browser shows a broken image. The other badge components (`BadgeGrid`, `MemberBadgeGalleryPage`, `TrainerBadgesPage`) were already updated to use `getBadgeEmoji()` but MomentumCard was missed.

## Fix

### File: `src/apps/member/features/momentum/MomentumCard.tsx`

1. Add import: `import { getBadgeEmoji } from './badgeEmoji';`
2. Replace lines 193-197 — remove the `iconUrl` image branch and always use emoji:

**Before:**
```tsx
{b.badge?.iconUrl ? (
  <img src={b.badge.iconUrl} alt={b.badge.nameEn} className="w-6 h-6 rounded-full object-cover" />
) : (
  <span className="text-sm">🏅</span>
)}
```

**After:**
```tsx
<span className="text-sm leading-none" role="img">{getBadgeEmoji(null, b.badge?.nameEn)}</span>
```

One file, two-line change.

