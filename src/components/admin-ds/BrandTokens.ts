/**
 * BrandTokens — single source of CSS variables that the future "แบรนด์ยิม"
 * (Branding) page will be allowed to override at runtime.
 *
 * NOTE: We do NOT mutate any tokens here on import — values still come from
 * `src/index.css`. This file only documents the contract and exposes a helper
 * `applyBrandTokens()` for future use.
 *
 * Future flow (NOT wired yet):
 *   1. Branding page loads org_branding row from DB
 *   2. Calls applyBrandTokens({ primary: '32 100% 50%', radius: '0.875rem', ... })
 *   3. CSS vars on <html> update → every AdminCard/AdminKpiCard/etc. re-paints
 *
 * Keep this list small + intentional. Anything not listed here is DS-locked.
 */

export type BrandToken =
  | '--primary'
  | '--primary-hover'
  | '--accent'
  | '--accent-foreground'
  | '--radius'
  | '--shadow-md'
  | '--font-admin'
  | '--sidebar-background'
  | '--sidebar-foreground'
  | '--sidebar-accent'
  | '--sidebar-accent-foreground'
  | '--sidebar-subtle';

export type BrandTokenValues = Partial<Record<BrandToken, string>>;

/**
 * Apply a partial brand token override at runtime (e.g. live preview in Branding).
 * Pass `null` value to remove an override and fall back to index.css default.
 */
export const applyBrandTokens = (values: BrandTokenValues) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(values)) {
    if (value == null) root.style.removeProperty(key);
    else root.style.setProperty(key, value);
  }
};

/** Read the current resolved value of a brand token (after any overrides). */
export const readBrandToken = (key: BrandToken): string => {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(key).trim();
};
