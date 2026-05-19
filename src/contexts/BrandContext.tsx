/**
 * BrandContext — single runtime source of truth for the gym's Brand Kit.
 *
 * Loads `settings.branding.brand_kit` once via `useBrandKit()` and exposes it
 * to the entire app. Also applies the kit's CSS tokens, document title, and
 * favicon globally so every surface (Admin / Member / Trainer / Staff) stays
 * in sync without each consumer having to re-apply manually.
 *
 * Why this exists:
 *   Previously `applyBrandFromKit` was only called inside SettingsBranding and
 *   reverted on unmount, so saved brand never propagated past that page.
 *   This provider fixes that without changing the DB shape or the existing
 *   `useBrandKit` hook signature.
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useBrandKit } from '@/hooks/useBrandKit';
import { applyBrandFromKit } from '@/components/admin-ds/BrandTokens';
import { DEFAULT_BRAND, type BrandKit } from '@/components/branding/brandDefaults';

interface BrandContextValue {
  brand: BrandKit;
  isLoading: boolean;
}

const BrandContext = createContext<BrandContextValue>({
  brand: DEFAULT_BRAND,
  isLoading: false,
});

const setFavicon = (url: string | undefined) => {
  if (typeof document === 'undefined' || !url) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (link.href !== url) link.href = url;
};

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading } = useBrandKit();
  const brand = data ?? DEFAULT_BRAND;

  // Apply CSS tokens whenever the saved brand changes (global, never reverts).
  useEffect(() => {
    applyBrandFromKit(brand);
  }, [brand]);

  // Sync document title + favicon for all surfaces.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (brand.name) document.title = brand.name;
    setFavicon(brand.logoUrl);
  }, [brand.name, brand.logoUrl]);

  const value = useMemo(() => ({ brand, isLoading }), [brand, isLoading]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export const useBrand = (): BrandContextValue => useContext(BrandContext);
