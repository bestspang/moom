## Scope

Three refinements to `/support` public form + reward logic:

1. Reward (+10 XP / +5 Coin) awarded **only** when `category ∈ {suggestion, complaint}` — other categories create the ticket normally but skip gamification.
2. Stronger phone validation + normalization; when the user submits a phone but **no member matches**, show a clear inline/toast error (still allow submit? see decision below).
3. Persist TH/EN language toggle on `/support` across reloads.

## Decisions / Assumptions

- **Reward-eligible categories:** `suggestion` (แนะนำ) and `complaint` (ร้องเรียน). Confirmed both already exist in `CATEGORIES`.
- **Phone normalization rules (TH-centric):**
  - Strip spaces, dashes, parentheses.
  - Accept `+66xxxxxxxxx` → convert to `0xxxxxxxxx` (Thai local form, 10 digits starting with 0).
  - Accept 9-digit form missing leading 0 → prepend `0`.
  - Final canonical form: 10 digits starting with `0`. Reject anything else with clear error.
- **No-match behavior:** Ticket is **still submitted** (feedback must never be lost), but the success screen shows a soft notice: "เบอร์นี้ไม่ตรงกับสมาชิก จึงไม่ได้รับคะแนน" so the user understands why no reward appeared. Reward hint text stays informative, not blocking.
- **Language persistence:** `LanguageContext` already persists to `localStorage['moom-language']` and defaults to `'th'`. `/support` uses `useLanguage()`, so persistence already works globally. **No new storage needed** — will verify by reading the page and note this in the plan, not add duplicate logic.

## Changes

### 1. Edge function `submit-support-ticket/index.ts`
- Add helper `normalizeThaiPhone(raw)` returning `{ canonical: string | null, reason: 'empty'|'invalid'|'ok' }`.
- Return `phone_valid: boolean` and `member_matched: boolean` in the response envelope so UI can message precisely.
- Gate gamification call: only invoke `gamification-process-event` when `matchedMemberId && (category === 'suggestion' || category === 'complaint')`.
- Update member lookup to use the canonical 10-digit form (exact match + last-9-digit fallback).

### 2. Migration
- Update `gamification_rules` row for `action_key='support_ticket_submit'`:
  - No schema change. Add a `metadata`/`conditions` note or simply enforce category gating in the edge function (simpler, no rule engine change needed). **Choice: enforce in edge function only** — the rule stays generic; the emitter decides eligibility. No migration required.

### 3. UI `src/pages/support/PublicSupportPage.tsx`
- Update Zod `phone` schema to run through `normalizeThaiPhone` via `.superRefine`; show error `support.public.invalidPhoneTH` when a value is entered but invalid.
- Change reward hint text to be conditional on selected category:
  - When `suggestion` or `complaint` selected → show reward hint under phone.
  - Otherwise → hide reward hint (avoid misleading users).
- Success screen: if user provided a phone but `member_matched === false`, show a muted notice line ("เบอร์ที่กรอกไม่ตรงกับสมาชิก จึงไม่ได้รับคะแนน / Phone did not match a member, no points awarded").
- Language toggle: no code change — already persisted via `LanguageContext`. Add a brief code comment noting this.

### 4. i18n `src/i18n/locales/{en,th}.ts`
Add keys:
- `support.public.invalidPhoneTH` — "กรอกเบอร์ 10 หลักขึ้นต้นด้วย 0" / "Enter a 10-digit phone starting with 0"
- `support.public.phoneRewardHint` — update to clarify eligibility: "แนะนำ/ร้องเรียน + เบอร์สมาชิก = +10 XP / +5 Coin (สูงสุด 1 ครั้ง / 2 สัปดาห์)"
- `support.public.noMemberMatch` — "เบอร์ที่กรอกไม่ตรงกับสมาชิก จึงไม่ได้รับคะแนน" / "Phone did not match any member, no points were awarded"
- `support.public.rewardOnlyForFeedback` — helper text explaining reward is only for แนะนำ/ร้องเรียน categories

## Technical Notes

- Reward gating happens **server-side** in the edge function — client cannot spoof by picking category then re-editing. Safe.
- Existing 60s client-side throttle unchanged.
- `gamification-process-event` cooldown (14 days) still enforced globally, so switching category won't bypass the 2-week cap.
- No DB schema changes → no new migration file.

## Regression Checklist

- Anonymous submits with reward-eligible category + no phone → ticket created, no reward. ✓
- Member submits with `billing` category + valid phone → ticket created, no reward (category gate). ✓
- Member submits with `complaint` + valid matched phone, first time → +10 XP / +5 Coin. ✓
- Same member, `complaint` again within 14 days → ticket created, no reward. ✓
- Invalid phone format (e.g. `12345`) → form blocks submit with clear error. ✓
- Language toggle → persists across reloads (already handled by `LanguageContext`). ✓
