## Goal
On the `/support` success screen, always tell the user clearly what happened with rewards — granted, or skipped with a specific reason (no member match, cooldown active, ineligible category, or no phone provided).

## Current gap
The success screen only shows two states:
- Rewards granted (green box with XP/Coin)
- "No member match" muted notice (only when phone provided + eligible category + no match)

Cases silently unexplained:
- Category not eligible (e.g. `billing`, `facility`) → no message at all
- No phone provided → no message at all
- Cooldown active (member submitted feedback in last 14 days) → looks identical to "no member match"
- Gamification call errored → silent

## Plan

### 1. Edge function — return an explicit `reward_status`
File: `supabase/functions/submit-support-ticket/index.ts`

Add a single string field `reward_status` in the response `data`, one of:
- `granted` — points awarded (also populates `points_awarded`)
- `skipped_ineligible_category` — category is not `suggestion`/`complaint`
- `skipped_no_phone` — eligible category, but no phone provided
- `skipped_no_member` — phone provided + eligible category, but no member matched
- `skipped_cooldown` — member matched + eligible, but gamification returned non-`processed` (cooldown/cap)
- `skipped_error` — gamification invocation threw

Keep existing fields (`member_matched`, `phone_provided`, `reward_eligible_category`, `points_awarded`) for backward compatibility. Determine `reward_status` from the same branches already in the function — no new business logic.

### 2. UI — one clear reward banner per state
File: `src/pages/support/PublicSupportPage.tsx`

Replace the current two-block conditional (green "granted" box + muted "no match" notice) with a single **reward status banner** that always renders on the success screen and picks its variant + copy from `reward_status`:

| status | visual | copy key |
|---|---|---|
| `granted` | primary tint + Sparkles icon | `support.public.reward.granted` (existing `pointsAwardedDesc`) |
| `skipped_cooldown` | muted + Clock icon | `support.public.reward.cooldown` |
| `skipped_no_member` | muted + Info icon | `support.public.reward.noMember` |
| `skipped_no_phone` | muted + Info icon | `support.public.reward.noPhone` |
| `skipped_ineligible_category` | muted + Info icon | `support.public.reward.ineligibleCategory` |
| `skipped_error` | muted + Info icon | `support.public.reward.tryLater` |

Remove the standalone `noMemberMatch` state — the new banner replaces it.

### 3. i18n — add friendly TH/EN copy
Files: `src/i18n/locales/th.ts`, `src/i18n/locales/en.ts`

Add under `support.public.reward.*`:
- `granted` — "ได้รับ {{xp}} XP และ {{coin}} Coin แล้ว 🎉" / "You earned {{xp}} XP and {{coin}} Coin 🎉"
- `cooldown` — "คุณเพิ่งได้รับรางวัลจากการส่งความคิดเห็นไปแล้วในช่วง 14 วันที่ผ่านมา รางวัลถัดไปจะพร้อมให้รับเร็ว ๆ นี้" / "You already claimed a feedback reward in the last 14 days. Next reward unlocks soon."
- `noMember` — "ไม่พบเบอร์นี้ในระบบสมาชิก จึงยังไม่ได้รับรางวัล — ลองใช้เบอร์ที่ลงทะเบียนไว้ครั้งหน้า" / "This phone isn't linked to a member account, so no reward this time — try your registered number next time."
- `noPhone` — "หากใส่เบอร์ที่ใช้สมัครสมาชิก จะได้รับ +10 XP และ +5 Coin ทุก 14 วัน" / "Add your registered phone number to earn +10 XP and +5 Coin every 14 days."
- `ineligibleCategory` — "รางวัลมีเฉพาะหมวด 'แนะนำ' และ 'ร้องเรียน' — ขอบคุณสำหรับข้อความ" / "Rewards apply only to 'Suggestion' and 'Complaint' categories — thanks for your message."
- `tryLater` — "ระบบรางวัลขัดข้องชั่วคราว ทีมงานจะตรวจสอบให้" / "Reward system hiccup — our team will look into it."

Keep existing `pointsAwardedTitle`, `pointsAwardedDesc`, `noMemberMatch` keys (still referenced elsewhere or safe to remove after grep — will confirm during build).

## Regression checklist
- Ticket creation flow unchanged; only response envelope gains one field.
- Existing consumers reading `points_awarded` / `member_matched` continue to work.
- Gamification cooldown behavior unchanged (still enforced server-side by `gamification_rules`).
- No DB schema change, no migration needed.
- Client 60s throttle unchanged.

## Files touched
- `supabase/functions/submit-support-ticket/index.ts`
- `src/pages/support/PublicSupportPage.tsx`
- `src/i18n/locales/th.ts`
- `src/i18n/locales/en.ts`
