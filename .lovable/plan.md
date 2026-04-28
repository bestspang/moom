# วิเคราะห์ MOOM Design System → แผน Adopt เข้า UI ปัจจุบัน

นี่เป็น **เฟสวิเคราะห์ + เสนอแผน** ยังไม่แก้โค้ดจนกว่าคุณจะอนุมัติ

---

## 1. โครงของ Design System ที่เจอ

```
MOOM Design System/
├─ SKILL.md, README.md              ← brand bible (voice, type, color, motion)
├─ colors_and_type.css              ← token layer (HSL custom properties)
├─ preview/                         ← ตัวอย่าง color/type/spacing/component cards
└─ ui_kits/
   ├─ admin/   (22 ไฟล์ JSX, มี Modern.jsx + Lobby.jsx เป็นตัวล่าสุด)
   ├─ member/  (Tokens, Components, Screens, ScreensV2 ← ใหม่สุด, HomeFun, Gamify, Flows)
   └─ trainer/ (Tokens, Components, Screens)
```

ทุก kit เป็น **vanilla React + inline style** สำหรับ prototyping — ไม่ใช่ shadcn/Tailwind ตรงๆ จึงต้อง **port หลักการ + token** เข้าโปรเจกต์ ไม่ใช่ copy-paste

---

## 2. ความต่างหลักระหว่าง Design System vs UI ปัจจุบัน

### 2.1 Design Tokens (`src/index.css` vs `colors_and_type.css`)

| Token | ปัจจุบัน (`src/index.css`) | Design System | ผลกระทบ |
|---|---|---|---|
| `--primary` (orange) | `32 100% 50%` (#FF8800) | `25 95% 53%` (อุ่นกว่า, แดงขึ้น) | สีแบรนด์เพี้ยน |
| `--background` | `0 0% 100%` (ขาวล้วน) | `30 10% 98%` (warm off-white) | DS จงใจไม่ใช้ขาวล้วน |
| `--foreground` | `0 0% 20%` (เทาเข้ม) | `220 20% 8%` (deep blue-black) | text มี undertone น้ำเงิน |
| `--secondary/cream` | `210 20% 96%` (เย็น) | `30 12% 93%` (warm cream) | sidebar/แผงรอง = cream signature |
| `--border` | `0 0% 88%` (เทากลาง) | `30 10% 89%` (เทาอุ่น) | บอร์เดอร์ undertone อุ่น |
| `--radius` | `0.5rem` (8px) | `0.75rem` (12px) base, hero card 16–20px | DS โค้งมนกว่ามาก |
| `--font-sans` | `Inter` + `IBM Plex Sans Thai` | **Anuphan** (admin) + **LINE Seed Sans TH** (member) | คนละฟอนต์ทั้งสอง surface |
| Base font size | 14–16px (Tailwind default) | **13px** (info-dense) | DS ตั้งใจให้แน่น |
| Tier ladder | `tier-mover/strong/elite/legend` | `starter/regular/dedicated/elite/champion/legend` (6 ขั้น) | enum tier ไม่ตรง |

### 2.2 Surface ของแต่ละ App

#### **Member App** (`ScreensV2.jsx` คือเวอร์ชันล่าสุดที่ตั้งใจให้ adopt)
มี pattern ชัดที่เรายังไม่มี:
- **NextUpCard hero** — gradient orange→deep-orange, 3 states (`has-booking`, `no-booking`, `checked-in`) มี primary/secondary CTA, decor icon มุมบน — เป็น "ฮีโร่ใบเดียว" ไม่แข่งกับการ์ดอื่น
- **MomentumStrip** (compact) — แทน MomentumCard แบบใหญ่ในหน้า home, แตะเพื่อ expand ไปหน้า rewards
- **QuickTile 4-grid** — book / history / friends / rewards (badge ที่มุม)
- **Quest collapsible card** — header + progress ring + chevron, ขยายดู quest list
- **Mood check-in strip** — 5 emotion (low/ok/good/strong/fire) แสดงเฉพาะถ้ายังไม่เลือก
- **Mascot "Moomu"** — รูปสัตว์มาสคอตขวาบน (ปัจจุบันมี `MascotIllustration` แล้ว)
- **AchievementTeaser / WellnessTip / FriendsActivity / Referral footer** — เรามีบางตัวแล้ว แต่ visual ยังไม่ตรง
- **Bottom nav + centered FAB** (check-in) — "signature mobile layout" ของ MOOM

ปัจจุบัน `MemberHomePage.tsx` (เพิ่งจัดเรียงใหม่ใน loop ที่แล้ว) มี widget ครบเกือบทุกตัวแล้ว แต่ **visual style ยังไม่ตรง DS** (radius เล็กไป, ขาด gradient hero, ขาด progress ring, ฟอนต์ไม่ใช่ LINE Seed)

#### **Trainer App** (`ui_kits/trainer/Screens.jsx`)
- **TrainerToday** = greeting + 3-stat strip (ลูกศิษย์/เช็คอินวันนี้/คะแนน) + **NextClass gradient hero** + class list
- **TrainerRoster** = sticky header + progress bar + tappable list rows
- ปัจจุบัน `TrainerHomePage` มี `CoachImpactCard` + `PartnerReputationCard` แล้ว แต่ **layout ยังไม่ตามกริด 3-stat + hero gradient**

#### **Admin Web** (`ui_kits/admin/Modern.jsx` คือล่าสุด)
- **ModernSidebar v2** — กลุ่ม nav แบบ collapsible (`home/people/business/gym/comms/org/settings`) + branch switcher + active orange left-rail (3px) + badge urgent สีแดง
- **ModernTopBar** — command bar (⌘K), date pill, quick actions, avatar menu
- **LivePulseCard** — check-in ticker + sparkline
- **RevenueChart** — 12-week area chart (pure SVG, token-based)
- **ActivityFeed, InsightCard, QuickActionTile**
- ปัจจุบัน admin sidebar เป็น flat list (ไม่มี grouping/collapse), top header ยังไม่มี ⌘K command, dashboard ใช้ chart library แทน inline SVG

### 2.3 Iconography & Motion

- DS ระบุ **Lucide เท่านั้น**, stroke 1.5–2px, active nav = stroke 2.5 → ปัจจุบันถูกต้องแล้ว
- Emoji ใช้ได้แค่ tier medals 🥉🥈🥇💠💎🖤 + celebration 🔥✨🎉 → ตรวจว่ามี emoji เกินที่ไหนบ้าง
- Motion: 200–400ms `ease-out`, `flame-flicker`/`shimmer`/`scan` เฉพาะ member app
- Card pattern: `1px border + rounded-lg + shadow-md + p-3` → ปัจจุบันใช้ `radius 0.5rem` ควรขยับเป็น `0.75rem`

---

## 3. ลำดับความสำคัญที่แนะนำ (เรียง impact สูง→ต่ำ)

### **Phase 1 — Foundation (Token layer)** ⭐ ต้องทำก่อน
1. อัปเดต `src/index.css` — port token จาก `colors_and_type.css` ทั้งหมด:
   - เปลี่ยน orange `32 100% 50%` → `25 95% 53%`
   - เปลี่ยน foreground → `220 20% 8%` (blue-black)
   - เปลี่ยน background → `30 10% 98%` (warm off-white)
   - เปลี่ยน secondary/cream → `30 12% 93%`
   - เปลี่ยน radius base → `0.75rem`
   - เพิ่ม `--font-admin`, `--font-member`, `.surface-admin`, `.surface-member`
   - เพิ่ม momentum tier ladder ที่ถูกต้อง (`starter/regular/dedicated/elite/champion/legend`)
2. โหลด font: **Anuphan** + **LINE Seed Sans TH** ผ่าน `@import` ใน `index.css` (อยู่เหนือ `@tailwind`)
3. apply `surface-admin` ที่ root admin layout, `surface-member` ที่ member/trainer/staff layout

**Risk:** เปลี่ยน `--primary` HSL กระทบทุกปุ่ม/ลิงก์ ต้องเช็ค hover/focus visually และ regression tier color

### **Phase 2 — Member App Visual Refresh**
1. **NextUpCard** — รีดีไซน์ `NextUpCard.tsx` ให้มี:
   - 3 states (has-booking / no-booking / checked-in)
   - gradient hero พร้อม decor icon
   - primary (filled white) + secondary (translucent) CTA
2. **MomentumStrip (compact)** — สร้างเวอร์ชัน inline สำหรับหน้า home, ส่ง MomentumCard ใหญ่ไปหน้า rewards/profile
3. **QuickTilesGrid** — ปรับ visual: tile 4 ใบ ขนาดเท่ากัน, icon ในกล่อง orange-soft 34px, badge มุมขวาบน
4. **Quest collapsible card with progress ring** — แทน QuestSummaryCard ปัจจุบัน
5. **Card radius 14–18px** + soft shadow ตามสเปก

### **Phase 3 — Trainer App**
1. `TrainerHomePage`: greeting + 3-stat strip (ลูกศิษย์/เช็คอินวันนี้/คะแนน) + NextClass gradient hero + class list
2. `TrainerRosterPage`: sticky header + progress bar + tappable rows
3. Class card variant สำหรับ trainer (filled/total + status pill done/live/upcoming)

### **Phase 4 — Admin Modernization**
1. **ModernSidebar v2** — แปลง flat sidebar เป็นกลุ่ม collapsible + active orange left-rail + urgent badge
2. **ModernTopBar** — ⌘K command bar + date pill + branch pill
3. **Dashboard widgets** — LivePulseCard, ActivityFeed, InsightCard (อันนี้เลือกได้, ไม่บังคับ)

### **Phase 5 — Polish**
- audit emoji usage (admin ห้ามมี)
- audit dashed borders / non-Lucide icons / non-DS gradients
- update `MOOM Design System/screenshots/` หลังเสร็จเพื่อเทียบ before/after

---

## 4. Risks & Constraints

- **PROTECTED_FILES**: `src/components/ui/*` (shadcn) ห้ามแก้ → ต้อง wrap แทน
- **AuthContext / hostname.ts / App.tsx routing** ต้องขออนุมัติก่อนแก้ → Phase 4 (ModernSidebar) อาจกระทบ admin layout, ขอ confirm ก่อน
- **i18n**: ทุก string ใหม่ต้องเพิ่มทั้ง `en.ts` + `th.ts`
- **Font swap**: เปลี่ยนเป็น Anuphan/LINE Seed อาจกระทบความสูงบรรทัด ต้อง smoke test ทุก surface
- **Tier enum**: DS ใช้ 6-tier ladder (`starter→legend`) ปัจจุบัน DB enum อาจไม่ตรง — ต้องตรวจ `gamification_levels` table ก่อนเปลี่ยน label
- **Base font 13px**: ปัจจุบันใช้ Tailwind default (16px) — ลดเป็น 13px จะกระทบ layout ทั้งแอป **แนะนำทำเฉพาะ surface-member ก่อน** ไม่ลด admin

---

## 5. คำถามก่อนเริ่ม Phase 1

1. **Scope:** เริ่ม Phase 1 (token+font) ทันทีเลยไหม? หรืออยากเลือกเฉพาะบาง surface ก่อน (เช่น member อย่างเดียว)?
2. **Base font 13px:** ลดทั้งแอป หรือเฉพาะ member/trainer (mobile)?
3. **Orange shift** (`32 100% 50%` → `25 95% 53%`): OK ที่สี brand จะเปลี่ยนเล็กน้อย (อุ่น/แดงขึ้น) หรืออยาก keep ของเดิม?
4. **Admin Modern shell** (Phase 4): ทำเลย หรือ defer (ใหญ่และ touch สิ่งที่ require approval)?

หลังตอบ จะเริ่ม implement **Phase 1 token foundation** เป็น migration เล็กก่อน — แล้วค่อยไล่ Phase 2 widget-by-widget เพื่อให้คุณเห็น diff ทีละจุด
