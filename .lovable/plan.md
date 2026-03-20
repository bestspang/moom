

# Cross-System Audit — Realtime Publication Gap

## Critical Finding: 8 Tables Missing from Supabase Realtime Publication

`useRealtimeSync.ts` subscribes to tables that are **not added to the `supabase_realtime` publication**. Supabase requires tables to be explicitly added via `ALTER PUBLICATION supabase_realtime ADD TABLE ...` for Postgres Changes to fire. Without this, the subscription silently receives nothing.

### Tables in `useRealtimeSync.ts` but NOT in `supabase_realtime` publication:

| Table | Impact |
|-------|--------|
| `staff` | Staff list changes don't auto-refresh |
| `roles` | Role changes don't propagate to UI |
| `user_roles` | Permission changes invisible until refresh |
| `transfer_slips` | Slip status updates stale in finance view |
| `notifications` | Notification bell doesn't update in realtime |
| `quest_instances` | Quest progress doesn't live-update |
| `member_status_tiers` | Tier badge stays stale after evaluation |
| `sp_ledger` | SP changes don't trigger tier refresh |

### What IS correctly in the publication (verified):
All other 28 tables in `useRealtimeSync.ts` are present in the publication — no issues there.

### Everything else verified as synchronized:
- `evaluate_member_tier` RPC: uses correct `event_type` column ✅
- Edge function SP writing: correct package term lookup + shop formula ✅
- `PLATFORM_CONTRACT.md`: all 8 gamification edge functions documented ✅
- `data-contract.md`: Sections 19-20 present, Realtime list updated ✅
- Query keys match between components and realtime invalidation map ✅
- `on_auth_user_created` trigger registered on `auth.users` ✅
- `handle_new_user` function handles member signup + referral ✅
- i18n EN + TH complete ✅

---

## Implementation Plan

### 1. Database Migration — Add 8 tables to Realtime publication

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transfer_slips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quest_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_status_tiers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sp_ledger;
```

**Risk:** Zero — purely additive. Does not modify any table structure, data, or existing subscriptions.

**Result:** All 8 tables will start emitting Postgres Changes events, which `useRealtimeSync.ts` already handles. The UI will auto-refresh for:
- Notification bell count (notifications)
- Staff list updates (staff)
- Tier badge changes (member_status_tiers, sp_ledger)
- Quest progress (quest_instances)
- Transfer slip status (transfer_slips)
- Permission changes (roles, user_roles)

### No other changes needed
All code, documentation, edge functions, and frontend components are verified synchronized.

