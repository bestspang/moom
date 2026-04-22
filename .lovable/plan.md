

# 🛡️ Phase 2 + 3 + 4 — Compact Final Sweep + AI Regression Hardening

## ✅ Re-audit ผลจริง (สถานะ Sprint 2-3 ดีกว่าที่คิด — scope หดเหลือ 30%)

| Item ที่วางแผนไว้ | สถานะจริง | Action |
|---|---|---|
| S2-1 `slip_file_url` fix | ✅ **ใช้ถูกแล้ว** ทั้ง 4 จุดใน `StaffPaymentsPage.tsx` | Skip |
| S2-2 `logActivity()` ใน 9 hooks | ✅ **ครบทุก hook** ที่มี useMutation | Skip |
| S2-4/S2-5 delete + onError mutations | ✅ มี logActivity แล้ว | Skip |
| S2-6 `auto-notifications` paginate | ⚠️ ของรอง — defer |
| S3-1 Coming Soon 5 จุด | ⚠️ **เหลือ 1 จุด** (`MemberRunClubPage.tsx`) — ของจริงเป็น `<Card>` พร้อม `opacity-60 pointer-events-none` แล้ว | Verify pattern |
| S3-2 `MemberCheckInPage` MobilePageHeader | ✅ ทุก member page มี header | Skip |
| **S2-3 TH i18n missing** | ❌ **80 keys ขาด** (gamification admin labels) | **DO** |
| `sell-package` / `approve-slip` ใช้ RPC ใหม่ | ✅ ใช้ `process_package_sale` + `process_slip_approval` แล้ว | ✅ Phase 1 done |

**เหลือทำจริง 3 อย่าง:**
1. เติม TH translation 80 keys (gamification admin)
2. Verify `MemberRunClubPage` Coming Soon pattern ตรง policy
3. **AI Regression Prevention layer** (สำคัญสุด — root cause ที่ user ขอ)

---

## 🎯 What this plan ships

### Part A — i18n Sync (TH 80 keys)

เติม TH translations ที่ขาดทั้งหมด 80 keys ในไฟล์ `src/i18n/locales/th.ts` — กลุ่มหลักคือ gamification admin (rules, badges, challenges, levels, rewards, tier management):

- **Categories:** categoryAccess, categoryEvent, categoryMerch, categoryPackageBooster, categoryPerk
- **Tiers:** bronze, silver, gold, platinum (diamond/black มีแล้ว)
- **Quest goals:** goalActionKey, goalActionKeyHint, goalTypeActionCount, goalTypeClassCount, goalTypeStreak, goalTypeXpThreshold
- **Empty states:** noBadges/Desc, noChallenges/Desc, noFlags/Desc, noLevels/Desc, noRewards/Desc, noTiers/Desc
- **Stats labels:** activeChallenges, activeProfiles, activeRewards, activeRules, avgMemberLevel, coinInCirculation, economyHealth, flaggedActivity, flaggedEvents, questCompletion, questsAssigned, recentActivity, totalBadges, totalCoinEarned, totalCoinSpent, totalRedemptions, totalUnits, totalXpDistributed, xpDistributed
- **Form labels:** action, color, cooldown, displayPriority, label, labelEn, labelTh, levelNumber, maxDay, minScore, points, pointsCost, rewardBadge, rewardPoints, rewardXp, sectionBasic, sectionGoal, sectionReward, sectionSchedule, stock, tierNameEn, tierNameTh, trainerType, unlimitedStock
- **Misc:** addLevel, addTier, draft, economySummary, editLevel, freelance, inHouse, noDescription, questTemplates, systemConfig

### Part B — Coming Soon Verification

Verify `src/apps/member/pages/MemberRunClubPage.tsx` ใช้ pattern ที่ถูก: `opacity-60 pointer-events-none`, ไม่มี chevron, ไม่มี toast (ถ้าผิดจะแก้)

### Part C — AI Regression Prevention Layer (root cause fix)

สร้าง 3 ไฟล์ + 1 memory เพื่อบังคับ AI ใน session ถัดๆ ไป **ไม่แก้ของที่ทำงานอยู่**:

#### 1. `AI_GUARDRAILS.md` (root)
Mandatory checklist ที่ AI **ต้องอ่านก่อนแก้โค้ด** — บังคับผ่าน CLAUDE.md reference:
```
ก่อนแก้โค้ด AI ต้องทำ:
1. อ่านไฟล์เป้าหมาย "ทั้งไฟล์" — ห้ามเดาจาก memory
2. ระบุ blast radius — grep หาคนที่ import / call function นี้
3. Classify scope: WORKING / PARTIAL / BROKEN — ห้ามแตะ WORKING
4. Minimal diff only — ทุกบรรทัดต้อง trace กลับไปหา task ของ user ได้
5. ห้ามแก้ field/property/import ที่ไม่อยู่ใน scope task
6. ถ้าจะแตะ PROTECTED_FILES → STOP, ขอ approval
7. หลังแก้: smoke test feature เดิมในไฟล์นั้นยังทำงาน
```

#### 2. `PROTECTED_FILES.md` (root)
รายการไฟล์ที่ห้าม AI แก้โดยไม่ขอ approval:
- `src/integrations/supabase/{client,types}.ts` (auto-generated)
- `src/components/ui/*` (shadcn primitives)
- `src/contexts/AuthContext.tsx`
- `src/apps/shared/hostname.ts` (surface routing)
- `src/App.tsx` route table
- `src/hooks/useRealtimeSync.ts` (only ADD tables, never remove)
- `supabase/migrations/*.sql` ที่ deploy แล้ว
- `supabase/config.toml` project-level
- `.env`

#### 3. Update `CLAUDE.md` Section 9
เพิ่ม `AI_GUARDRAILS.md` + `PROTECTED_FILES.md` ใน "MUST READ every session" tier — ทำให้ทุก AI session โหลดอัตโนมัติ

#### 4. Memory: `mem://ai-regression-prevention`
สรุป pattern: "Verify before modify" + reference ไป AI_GUARDRAILS.md — auto-loaded ทุก session ผ่าน mem://index.md

#### 5. Update `docs/SMOKE_TEST.md`
เพิ่ม section "AI Change Verification (5-step gate before marking done)":
- ✅ `bun run build` เขียว
- ✅ Feature เดิมในไฟล์ที่แก้ยังทำงาน (manual click test)
- ✅ ไม่มีไฟล์ใน PROTECTED_FILES.md ถูกแตะ
- ✅ ทุก mutation ที่แก้มี `logActivity()`
- ✅ TH/EN i18n ตรงกัน (no missing keys)

---

## ⚠️ Phase 4 (Docs sync) — Inline กับ Part C

Update เฉพาะที่จำเป็น (ไม่ทำใหญ่):
- **`docs/DEVLOG.md`** — append Phase 0+1+2 entry (typed client factory, 3 atomic RPCs, TH i18n, AI guardrails)
- **`docs/CONTRACTS.md`** — เพิ่ม 3 RPCs ใหม่ (`process_redeem_reward`, `process_package_sale`, `process_slip_approval`) ใน "Database Key Tables" section
- **ไม่แตะ:** PROJECT_MEMORY, INTEGRATION_NOTES, data-contract*.md (ของเดิมยังถูก)

---

## 📦 Files Touched (minimal diff)

```
แก้:
  src/i18n/locales/th.ts         — เติม 80 keys (additive only, ไม่แก้ key เดิม)
  CLAUDE.md                       — section 9 เพิ่ม 2 references
  docs/DEVLOG.md                  — append entry
  docs/CONTRACTS.md               — เพิ่ม 3 RPCs
  docs/SMOKE_TEST.md              — เพิ่ม "AI Change Verification" section

สร้างใหม่:
  AI_GUARDRAILS.md                — root level checklist
  PROTECTED_FILES.md              — root level do-not-touch list
  mem://ai-regression-prevention  — memory rule

Verify only (อาจไม่แก้):
  src/apps/member/pages/MemberRunClubPage.tsx — confirm Coming Soon pattern
```

**Protected files NOT touched:** ทุกไฟล์ใน `PROTECTED_FILES.md`, edge functions, migrations, routes, AuthContext

---

## 🛡️ Regression Checklist (after change)

1. ✅ `bun run build` เขียว
2. ✅ TH/EN parity: `grep -c keys` ทั้ง 2 ไฟล์เท่ากัน (≥ 2196)
3. ✅ Member/Admin Gamification admin pages: ไม่มี raw English key visible (สลับ TH)
4. ✅ MemberRunClubPage: Coming Soon ไม่ trigger toast / navigation
5. ✅ AI_GUARDRAILS.md + PROTECTED_FILES.md exist และอ้างอิงใน CLAUDE.md
6. ✅ DEVLOG entry ใหม่บันทึก Phase 0+1+2 ครบ

---

## 🚦 Why this is the FINAL phase (รอบนี้)

หลัง phase นี้ระบบจะเป็น stable + documented + AI-resistant:
- **Code:** edge functions atomic, build เขียว, ไม่มี broken UI
- **Docs:** DEVLOG + CONTRACTS sync, smoke test มี AI gate
- **Defense:** AI_GUARDRAILS + PROTECTED_FILES + memory rule = AI session ถัดไปถูกบังคับให้ verify ก่อน modify

**สิ่งที่ defer (ไม่ทำรอบนี้ — scope creep):**
- ❌ S3-4 Migrate 473 inline query keys → dedicated round
- ❌ S2-6 auto-notifications paginate → ไม่ urgent (cron 1x/day)
- ❌ Refactor folder structure
- ❌ DB enum rename `class_attended` → `class_attend` (legacy values, non-breaking)

**Approve เพื่อเริ่ม:** ผมจะทำ Part A (TH i18n) ก่อนเป็น chunk แรก, verify build เขียว, แล้วทำ Part B+C ตามลำดับในรอบเดียว

