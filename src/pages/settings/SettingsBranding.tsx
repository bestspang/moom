import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminCard } from '@/components/admin-ds/AdminCard';
import { AdminPageHeader } from '@/components/admin-ds/AdminPageHeader';
import { applyBrandFromKit } from '@/components/admin-ds/BrandTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Download, RotateCcw, Upload, Check, Info } from 'lucide-react';
import {
  DEFAULT_BRAND,
  COLOR_PRESETS,
  FONT_CHOICES,
  PHOTO_STYLES,
  type BrandKit,
} from '@/components/branding/brandDefaults';
import { LogoMark, PhotoBlock } from '@/components/branding/LogoMark';
import { ColorField } from '@/components/branding/ColorField';
import { BrandPreviewPanel } from '@/components/branding/BrandPreviewPanel';
import { useBrandKit, useSaveBrandKit } from '@/hooks/useBrandKit';
import { toast } from 'sonner';

const SettingsBranding = () => {
  const { t } = useLanguage();
  const { data: saved, isLoading } = useBrandKit();
  const saveMutation = useSaveBrandKit();
  const [brand, setBrand] = useState<BrandKit>(DEFAULT_BRAND);

  // Hydrate from server once loaded
  useEffect(() => {
    if (saved) setBrand(saved);
  }, [saved]);

  // Apply tokens on every brand change (page-local preview)
  useEffect(() => {
    applyBrandFromKit(brand);
    return () => {
      // restore saved tokens on unmount
      applyBrandFromKit(saved ?? null);
    };
  }, [brand, saved]);

  const dirty = useMemo(
    () => !!saved && JSON.stringify(saved) !== JSON.stringify(brand),
    [saved, brand]
  );

  const set = (patch: Partial<BrandKit>) => setBrand((b) => ({ ...b, ...patch }));
  const setSocial = (patch: Partial<BrandKit['social']>) =>
    setBrand((b) => ({ ...b, social: { ...b.social, ...patch } }));
  const setContact = (patch: Partial<BrandKit['contact']>) =>
    setBrand((b) => ({ ...b, contact: { ...b.contact, ...patch } }));

  const handleRevert = () => {
    if (saved) {
      setBrand(saved);
      toast.success(t('settings.branding.revertedToast'));
    }
  };

  const handleReset = () => {
    if (window.confirm(t('settings.branding.resetConfirm'))) {
      setBrand(DEFAULT_BRAND);
      toast.success(t('settings.branding.resetToast'));
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(brand, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand.name.toLowerCase().replace(/\s+/g, '-')}-brand-kit.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('settings.branding.exportedToast'));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <AdminPageHeader
        title={
          <span className="inline-flex items-center gap-3">
            {t('settings.branding.pageTitle')}
            {dirty && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 hover:bg-amber-100 animate-fade-in text-[10px] font-bold"
              >
                • {t('settings.branding.dirty')}
              </Badge>
            )}
          </span>
        }
        subtitle={t('settings.branding.pageSubtitle')}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" />
              {t('settings.branding.exportKit')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              {t('settings.branding.reset')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
        {/* LEFT — editor */}
        <div className="space-y-4 min-w-0">
          {/* IDENTITY */}
          <AdminCard className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">{t('settings.branding.sectionIdentity')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.branding.sectionIdentitySub')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
              <div>
                <Label className="text-xs">{t('settings.branding.brandName')}</Label>
                <Input
                  value={brand.name}
                  onChange={(e) => set({ name: e.target.value.toUpperCase() })}
                  maxLength={60}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">
                  {t('settings.branding.logoLetter')}{' '}
                  <span className="text-muted-foreground font-normal">({t('settings.branding.logoLetterHint')})</span>
                </Label>
                <Input
                  value={brand.logoLetter}
                  onChange={(e) => set({ logoLetter: e.target.value.slice(0, 2).toUpperCase() })}
                  maxLength={2}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">{t('settings.branding.tagline')}</Label>
              <Input value={brand.tagline} onChange={(e) => set({ tagline: e.target.value })} className="mt-1" />
            </div>
            <div className="mt-3">
              <Label className="text-xs">
                {t('settings.branding.about')}{' '}
                <span className="text-muted-foreground font-normal">({t('settings.branding.aboutHint')})</span>
              </Label>
              <Textarea
                value={brand.about}
                onChange={(e) => set({ about: e.target.value })}
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </AdminCard>

          {/* LOGO */}
          <AdminCard className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">{t('settings.branding.sectionLogo')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.branding.sectionLogoSub')}</p>
            </div>
            <Label className="text-xs">{t('settings.branding.logoStyle')}</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['square', 'circle', 'wordmark'] as const).map((s) => {
                const active = brand.logoStyle === s;
                const labelKey = s === 'square' ? 'logoSquare' : s === 'circle' ? 'logoCircle' : 'logoWordmark';
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set({ logoStyle: s })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 py-4 rounded-lg border transition-all',
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <LogoMark brand={{ ...brand, logoStyle: s }} size={44} />
                    <span className={cn('text-[11px] font-semibold', active ? 'text-primary' : 'text-muted-foreground')}>
                      {t(`settings.branding.${labelKey}`)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <Label className="text-xs flex items-center justify-between">
                <span>{t('settings.branding.radius')}</span>
                <span className="font-mono text-muted-foreground">{brand.radius}px</span>
              </Label>
              <input
                type="range"
                min={0}
                max={30}
                value={brand.radius}
                onChange={(e) => set({ radius: +e.target.value })}
                className="w-full mt-2 accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium mt-1">
                <span>{t('settings.branding.radiusMin')}</span>
                <span>{t('settings.branding.radiusMax')}</span>
              </div>
            </div>

            <div className="mt-4 p-5 rounded-lg border border-dashed bg-muted/30 flex items-center justify-center gap-5">
              <LogoMark brand={brand} size={32} />
              <LogoMark brand={brand} size={56} />
              <LogoMark brand={brand} size={80} />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-3 opacity-60 pointer-events-none"
              disabled
            >
              <Upload className="h-4 w-4 mr-1.5" />
              {t('settings.branding.uploadLogo')}
            </Button>
          </AdminCard>

          {/* COLORS */}
          <AdminCard className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">{t('settings.branding.sectionColors')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.branding.sectionColorsSub')}</p>
            </div>
            <Label className="text-xs">{t('settings.branding.preset')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {COLOR_PRESETS.map((p) => {
                const active =
                  p.primary === brand.primary && p.secondary === brand.secondary && p.accent === brand.accent;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => set({ primary: p.primary, secondary: p.secondary, accent: p.accent })}
                    className={cn(
                      'text-left p-2.5 rounded-lg border transition-all',
                      active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <div className="flex gap-1 mb-1.5">
                      <span className="flex-1 h-4 rounded-sm" style={{ background: p.primary }} />
                      <span className="flex-1 h-4 rounded-sm" style={{ background: p.secondary }} />
                      <span className="flex-1 h-4 rounded-sm" style={{ background: p.accent }} />
                    </div>
                    <span className={cn('text-[11px] font-bold', active ? 'text-primary' : 'text-foreground')}>
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              <ColorField label={t('settings.branding.primary')} value={brand.primary} onChange={(v) => set({ primary: v })} />
              <ColorField label={t('settings.branding.secondary')} value={brand.secondary} onChange={(v) => set({ secondary: v })} />
              <ColorField label={t('settings.branding.accent')} value={brand.accent} onChange={(v) => set({ accent: v })} />
              <ColorField label={t('settings.branding.surface')} value={brand.surface} onChange={(v) => set({ surface: v })} />
            </div>

            <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 flex gap-2 items-start text-[11px]">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{t('settings.branding.colorTip')}</span>
            </div>
          </AdminCard>

          {/* TYPOGRAPHY */}
          <AdminCard className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">{t('settings.branding.sectionType')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.branding.sectionTypeSub')}</p>
            </div>
            <Label className="text-xs">{t('settings.branding.brandFont')}</Label>
            <div className="space-y-1.5 mt-2">
              {FONT_CHOICES.map((f) => {
                const active = brand.font === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set({ font: f.id })}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
                      active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-lg font-bold leading-none truncate"
                        style={{ fontFamily: `"${f.id}", sans-serif`, fontWeight: brand.fontWeight }}
                      >
                        {brand.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium mt-1">
                        {f.label} · {t(`settings.branding.fontMood.${f.moodKey}`)}
                      </div>
                    </div>
                    {active && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <Label className="text-xs flex items-center justify-between">
                <span>{t('settings.branding.fontWeight')}</span>
                <span className="font-mono text-muted-foreground">{brand.fontWeight}</span>
              </Label>
              <div className="flex gap-1.5 mt-2">
                {[500, 600, 700, 800].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => set({ fontWeight: w })}
                    className={cn(
                      'flex-1 h-9 rounded-lg border text-sm transition-all',
                      brand.fontWeight === w
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/40'
                    )}
                    style={{ fontWeight: w }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </AdminCard>

          {/* PHOTOGRAPHY */}
          <AdminCard className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">{t('settings.branding.sectionPhoto')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.branding.sectionPhotoSub')}</p>
            </div>
            <Label className="text-xs">{t('settings.branding.photoStyle')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {PHOTO_STYLES.map((p) => {
                const active = brand.photoStyle === p.id;
                const labelKey = `photo${p.id.charAt(0).toUpperCase() + p.id.slice(1)}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set({ photoStyle: p.id })}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all',
                      active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <PhotoBlock brand={{ ...brand, photoStyle: p.id }} w={100} h={64} />
                    <span className={cn('text-[11px] font-bold', active ? 'text-primary' : 'text-muted-foreground')}>
                      {t(`settings.branding.${labelKey}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </AdminCard>

          {/* SOCIAL */}
          <AdminCard className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">{t('settings.branding.sectionSocial')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.branding.sectionSocialSub')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ['ig', 'socialIg', '@'],
                ['fb', 'socialFb', '/'],
                ['line', 'socialLine', '@'],
                ['tt', 'socialTt', '@'],
                ['yt', 'socialYt', '@'],
                ['web', 'socialWeb', 'https://'],
              ] as const).map(([k, labelKey, prefix]) => (
                <div key={k}>
                  <Label className="text-xs">{t(`settings.branding.${labelKey}`)}</Label>
                  <div className="flex mt-1">
                    <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 bg-muted text-[11px] text-muted-foreground font-mono">
                      {prefix}
                    </span>
                    <Input
                      value={brand.social[k]}
                      onChange={(e) => setSocial({ [k]: e.target.value } as Partial<BrandKit['social']>)}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* CONTACT */}
          <AdminCard className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">{t('settings.branding.sectionContact')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.branding.sectionContactSub')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t('settings.branding.contactPhone')}</Label>
                <Input
                  value={brand.contact.phone}
                  onChange={(e) => setContact({ phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">{t('settings.branding.contactMail')}</Label>
                <Input
                  type="email"
                  value={brand.contact.mail}
                  onChange={(e) => setContact({ mail: e.target.value.toLowerCase().trim() })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">{t('settings.branding.contactAddr')}</Label>
              <Textarea
                value={brand.contact.addr}
                onChange={(e) => setContact({ addr: e.target.value })}
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
          </AdminCard>
        </div>

        {/* RIGHT — sticky preview */}
        <div className="lg:sticky lg:top-4">
          <BrandPreviewPanel brand={brand} previewLabel={t('settings.branding.previewLabel')} />
        </div>
      </div>

      {/* Sticky save bar (when dirty) */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t shadow-lg animate-in slide-in-from-bottom-4 duration-200">
          <div className="max-w-[1500px] mx-auto px-6 py-3 flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground mr-auto">
              • {t('settings.branding.dirty')}
            </span>
            <Button variant="ghost" size="sm" onClick={handleRevert} disabled={saveMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate(brand)}
              disabled={saveMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsBranding;
