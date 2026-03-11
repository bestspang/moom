

# Remove Leaderboard & Squad from QuickMenuStrip

## Change

**`src/apps/member/components/QuickMenuStrip.tsx`**

Remove these two entries from the `quickItems` array (lines 42-43):
- `{ icon: <Trophy ...>, label: t('member.leaderboard'), to: '/member/leaderboard' }`
- `{ icon: <Users ...>, label: t('member.mySquad'), to: '/member/squad' }`

They remain in the `allPages` array (the "More" dialog) so users can still find them there. Unused imports (`Trophy`, `Users`) will also be cleaned up.

