# Audit — Brand Kit Propagation

**Date:** 2026-05-19
**Scope:** Gym Brand Kit (ชื่อยิม / โลโก้ / สี / ฟอนต์ / radius / ติดต่อ / โซเชียล) across all 4 surfaces.

## Root Cause (Before Fix)

`applyBrandFromKit` was only invoked inside `SettingsBranding.tsx` and reverted on unmount. Result: saving the Brand Kit did not propagate to Sidebar / Headers / Auth pages / `document.title` / favicon. Every surface drifted independently and hardcoded "MOOM" strings.

## Architecture (After Fix)

```
settings table (section='branding', key='brand_kit', value=BrandKit)
   ↓
useBrandKit() — TanStack Query (queryKey: settings('branding'))
   ↓
BrandProvider (src/contexts/BrandContext.tsx) — wraps entire app in App.tsx
   ↓
   ├─ applyBrandFromKit(brand)            → CSS vars (--primary, --accent, --radius, --font-admin)
   ├─ document.title = brand.name         → tab title on every surface
   ├─ <link rel="icon"> = brand.logoUrl   → favicon
   └─ useBrand() / <BrandMark/>           → every consumer reads runtime value
```

## Consumer Trace

| Location | Before | After | Status |
|---|---|---|---|
| `Sidebar.tsx` (brand header) | hardcoded "M" + "MOOM Gym" | `<BrandMark/>` + `brand.name` | ✅ |
| `Sidebar.tsx` (footer) | "© 2026 MOOM CLUB" | `© {year} {brand.name}` | ✅ |
| `MemberHeader.tsx` | hardcoded "MOOM" | `{brand.name}` | ✅ |
| `TrainerHeader.tsx` | hardcoded "MOOM" | `{brand.name}` | ✅ |
| `AdminLogin.tsx` | "MOOM Admin" | `{brand.name} Admin` | ✅ |
| `MemberLogin.tsx` | "MOOM" | `{brand.name}` | ✅ |
| `Signup.tsx` | "MOOM CLUB" | `{brand.name}` | ✅ |
| `index.html` | "Lovable App" default | "MOOM CLUB" + meta tags | ✅ |
| `document.title` (runtime) | static | synced from `brand.name` | ✅ |
| Favicon (runtime) | static | synced from `brand.logoUrl` | ✅ |
| `MemberHeaderErrorBoundary` | hardcoded "MOOM" | `DEFAULT_BRAND.name` (no hooks in class) | ✅ |

## RBAC — `SettingsBranding`

| Role | Read kit | Edit kit | Save | Export | Reset | Revert | Upload logo |
|---|---|---|---|---|---|---|---|
| Owner (`level_4_master`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager (`level_3_manager`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trainer (`level_2_operator`) | ✅ read-only | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Front Desk (`level_1_minimum`) | ❌ (page blocked by `can('settings','read')`) | – | – | – | – | – | – |

Enforced by `usePermissions().can('settings', 'write')` in `SettingsBranding.tsx`.

## Out of Scope (Tracked in DEVLOG)

- Edge function emails / receipts still use hardcoded brand → TODO
- Multi-brand per location (current model: 1 brand / org)
- Locale-specific brand copy in `i18n/locales/*` retains the literal "MOOM" in marketing strings on purpose

## Regression Guards

1. **`src/contexts/BrandContext.test.tsx`** — provider loads, title syncs, favicon mounts
2. **`src/components/branding/BrandMark.test.tsx`** — default + suffix render contract
3. **`scripts/check-brand-consumers.mjs`** — CI fails if hardcoded "MOOM" returns to protected surfaces
4. **`PROTECTED_FILES.md`** — Tier-1 entries for `BrandContext.tsx`, `BrandMark.tsx`, `useBrandKit.ts`, `brandDefaults.ts`, `BrandTokens.ts`
5. **`AI_GUARDRAILS.md`** — Rule 15: no hardcoded brand strings

## Smoke Test

See `docs/SMOKE_TEST.md` § "Brand Kit Propagation".
