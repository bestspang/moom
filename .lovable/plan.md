

# `/liff/member` คืออะไร + Gamification UX/UI Upgrade

## `/liff/member` คือ?

`/liff/member` คือ **LINE LIFF Shell** — เป็น mini-app ที่รันภายใน LINE app โดยตรง ใช้สำหรับ member ที่เข้าผ่าน LINE (ไม่ต้อง login ด้วย email) ตอนนี้มันเป็นแค่ shell เบาๆ มี:
- Welcome header + LINE profile picture
- แสดง member ID
- Bottom nav 5 tabs แต่ 4 tabs ยังเป็น "Coming Soon"

**สรุป**: มันเป็น placeholder สำหรับ LINE users — ยังไม่มี gamification UI เลย

---

## แผนอัพเกรด Gamification UX/UI

จาก reference screenshots ที่ส่งมา จะเห็น pattern หลัก:
1. **Tabbed hub** — Level / Quests / Redeem ในหน้าเดียว
2. **XP/RP balance bar** เด่นชัดด้านบน
3. **Mission cards** ที่มี "days left", reward preview, progress bar
4. **Badge/Perk gallery** แบบ horizontal scroll พร้อม rarity color

### สิ่งที่จะทำ (Focus: Member App `/member`)

#### 1. สร้าง **Momentum Hub Page** — `/member/momentum`
หน้ารวม gamification ทั้งหมดในที่เดียว แทนที่จะกระจายหลายหน้า

**3 Tabs:**
- **Level** — XP progress, tier badge, streak, level requirements
- **Quests** — Active challenges + joinable challenges with days left & rewards
- **Rewards** — RP balance + redeemable rewards + history

**Top bar:** แสดง XP balance + RP balance ชัดเจนเหมือน reference

#### 2. อัพเกรด **MomentumCard** บนหน้า Home
- Tap ที่ card → navigate ไป `/member/momentum` (hub)
- เพิ่ม "Active Quests" section ใต้ streak row (compact, max 2)
- ให้ card ดู "gamified" มากขึ้น — subtle gradient, level requirements preview

#### 3. อัพเกรด **Quest/Challenge Cards**
- เพิ่ม "days left" badge ที่มุมขวาบน
- แสดง reward (XP + RP) ชัดเจนขึ้น
- Progress bar มี shimmer effect (มีแล้ว ✅)
- ใช้ icon ตาม challenge type

#### 4. เพิ่ม **Active Perks/Badges** horizontal scroll
- แสดงบน Momentum Hub ใต้ level info
- แต่ละ badge มี rarity border color (Common/Rare/Epic/Legendary) — มีแล้วใน BadgeGallery, จะ reuse

### Files to Create
- `src/apps/member/pages/MemberMomentumPage.tsx` — Hub page with 3 tabs

### Files to Modify
- `src/App.tsx` — Add route `/member/momentum`
- `src/apps/member/features/momentum/MomentumCard.tsx` — Add quest preview + tap to navigate
- `src/apps/member/features/momentum/QuestCard.tsx` — Enhanced layout with days left
- `src/apps/member/pages/MemberHomePage.tsx` — Remove standalone Challenges section (moved into MomentumCard)
- `src/apps/member/components/MemberBottomNav.tsx` — Consider swapping or no change (Check-in stays center)

### Risk
- Low — all additive, new page + enhanced existing components
- MemberRewardsPage and MemberBadgeGalleryPage stay as-is (deep links still work)
- No DB/edge function changes needed

