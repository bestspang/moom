import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminPageHeader } from '@/components/admin-ds/AdminPageHeader';
import { applyBrandFromKit } from '@/components/admin-ds/BrandTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Download, RotateCcw, Upload, Check, Info,
  Sparkles, Image as ImageIcon, Palette, Type, Globe, Building2,
  Instagram, Facebook, Youtube, MessageCircle, Music2, Phone, Mail, MapPin,
} from 'lucide-react';
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
import { BrandSectionCard } from '@/components/branding/BrandSectionCard';
import { BrandSummaryCard } from '@/components/branding/BrandSummaryCard';
import { useBrandKit, useSaveBrandKit } from '@/hooks/useBrandKit';
import { ImageUploadField } from '@/components/branding/ImageUploadField';
import { usePermissions } from '@/hooks/usePermissions';
import { AdminCard } from '@/components/admin-ds/AdminCard';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

// DS accent colors mirroring adminTokens in MOOM Design System
const ACCENT = {
  orange: 'hsl(22 95% 55%)',
  info: 'hsl(212 90% 48%)',
  pink: 'hsl(330 80% 58%)',
  success: 'hsl(152 60% 42%)',
  purple: 'hsl(270 70% 55%)',
  warn: 'hsl(38 92% 50%)',
};

const SettingsBranding = () => {
  const { t } = useLanguage();
  const { can, loading: permLoading } = usePermissions();
  const canRead = can('settings', 'read');
  const canWrite = can('settings', 'write');
  const { data: saved, isLoading } = useBrandKit();
  const saveMutation = useSaveBrandKit();
  const [brand, setBrand] = useState<BrandKit>(DEFAULT_BRAND);

  useEffect(() => {
    if (saved) setBrand(saved);
  }, [saved]);

  useEffect(() => {
    applyBrandFromKit(brand);
    return () => {
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

  if (isLoading || permLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="space-y-4 max-w-[900px] mx-auto">
        <AdminPageHeader
          title={t('settings.branding.pageTitle')}
          subtitle={t('settings.branding.pageSubtitle')}
        />
        <AdminCard className="flex flex-col items-center text-center py-12 gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-base font-bold">{t('settings.branding.noAccessTitle')}</div>
          <div className="text-sm text-muted-foreground max-w-md">
            {t('settings.branding.noAccessBody')}
          </div>
        </AdminCard>
      </div>
    );
  }

  const socialFields: {
    k: keyof BrandKit['social']; labelKey: string; prefix: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string;
  }[] = [
    { k: 'ig', labelKey: 'socialIg', prefix: '@', icon: Instagram, color: ACCENT.pink },
    { k: 'fb', labelKey: 'socialFb', prefix: '/', icon: Facebook, color: ACCENT.info },
    { k: 'line', labelKey: 'socialLine', prefix: '@', icon: MessageCircle, color: ACCENT.success },
    { k: 'tt', labelKey: 'socialTt', prefix: '@', icon: Music2, color: 'hsl(0 0% 14%)' },
    { k: 'yt', labelKey: 'socialYt', prefix: '@', icon: Youtube, color: 'hsl(0 78% 56%)' },
    { k: 'web', labelKey: 'socialWeb', prefix: 'https://', icon: Globe, color: ACCENT.info },
  ];

  const summaryRows = [
    { label: t('settings.branding.summaryName'), value: brand.name },
    { label: t('settings.branding.summaryFont'), value: `${brand.font} · ${brand.fontWeight}` },
    { label: t('settings.branding.summaryRadius'), value: `${brand.radius}px` },
    {
      label: t('settings.branding.summaryStyle'),
      value: t(`settings.branding.logo${brand.logoStyle.charAt(0).toUpperCase() + brand.logoStyle.slice(1)}`),
    },
  ];

  return (
    <div className="space-y-4 pb-24 max-w-[1500px] mx-auto">
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
        <div className="space-y-3 min-w-0">
          {/* IDENTITY */}
          <BrandSectionCard
            title={t('settings.branding.sectionIdentity')}
            subtitle={t('settings.branding.sectionIdentitySub')}
            icon={Sparkles}
            accent={ACCENT.orange}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wide">{t('settings.branding.brandName')}</Label>
                  <Input
                    value={brand.name}
                    onChange={(e) => set({ name: e.target.value.toUpperCase() })}
                    maxLength={60}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wide">
                    {t('settings.branding.logoLetter')}{' '}
                    <span className="text-muted-foreground font-normal normal-case">({t('settings.branding.logoLetterHint')})</span>
                  </Label>
                  <Input
                    value={brand.logoLetter}
                    onChange={(e) => set({ logoLetter: e.target.value.slice(0, 2).toUpperCase() })}
                    maxLength={2}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wide">{t('settings.branding.tagline')}</Label>
                <Input value={brand.tagline} onChange={(e) => set({ tagline: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wide">
                  {t('settings.branding.about')}{' '}
                  <span className="text-muted-foreground font-normal normal-case">({t('settings.branding.aboutHint')})</span>
                </Label>
                <Textarea
                  value={brand.about}
                  onChange={(e) => set({ about: e.target.value })}
                  rows={3}
                  className="mt-1.5 resize-none"
                />
              </div>
            </div>
          </BrandSectionCard>

          {/* LOGO */}
          <BrandSectionCard
            title={t('settings.branding.sectionLogo')}
            subtitle={t('settings.branding.sectionLogoSub')}
            icon={ImageIcon}
            accent={ACCENT.info}
          >
            <Label className="text-[11px] font-bold uppercase tracking-wide">{t('settings.branding.logoStyle')}</Label>
            <div className="grid grid-cols-3 gap-2.5 mt-2">
              {(['square', 'circle', 'wordmark'] as const).map((s) => {
                const active = brand.logoStyle === s;
                const labelKey = s === 'square' ? 'logoSquare' : s === 'circle' ? 'logoCircle' : 'logoWordmark';
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set({ logoStyle: s })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2.5 py-4 rounded-lg border transition-all',
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <LogoMark brand={{ ...brand, logoStyle: s }} size={44} />
                    <span className={cn('text-[11px] font-bold', active ? 'text-primary' : 'text-muted-foreground')}>
                      {t(`settings.branding.${labelKey}`)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3.5">
              <Label className="text-[11px] font-bold uppercase tracking-wide flex items-center justify-between">
                <span>{t('settings.branding.radius')}</span>
                <span className="font-mono text-muted-foreground normal-case">{brand.radius}px</span>
              </Label>
              <input
                type="range"
                min={0}
                max={30}
                value={brand.radius}
                onChange={(e) => set({ radius: +e.target.value })}
                className="w-full mt-2 accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold mt-1">
                <span>{t('settings.branding.radiusMin')}</span>
                <span>{t('settings.branding.radiusMax')}</span>
              </div>
            </div>

            <div className="mt-3.5 p-[18px] rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center gap-[18px]">
              <LogoMark brand={brand} size={32} />
              <LogoMark brand={brand} size={56} />
              <LogoMark brand={brand} size={80} />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-2.5 opacity-60 pointer-events-none"
              disabled
            >
              <Upload className="h-4 w-4 mr-1.5" />
              {t('settings.branding.uploadLogo')}
            </Button>
          </BrandSectionCard>

          {/* COLORS */}
          <BrandSectionCard
            title={t('settings.branding.sectionColors')}
            subtitle={t('settings.branding.sectionColorsSub')}
            icon={Palette}
            accent={ACCENT.pink}
          >
            <Label className="text-[11px] font-bold uppercase tracking-wide">{t('settings.branding.preset')}</Label>
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
                    <div className="flex gap-[3px] mb-1.5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              <ColorField label={t('settings.branding.primary')} value={brand.primary} onChange={(v) => set({ primary: v })} />
              <ColorField label={t('settings.branding.secondary')} value={brand.secondary} onChange={(v) => set({ secondary: v })} />
              <ColorField label={t('settings.branding.accent')} value={brand.accent} onChange={(v) => set({ accent: v })} />
              <ColorField label={t('settings.branding.surface')} value={brand.surface} onChange={(v) => set({ surface: v })} />
            </div>

            <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 flex gap-2 items-start text-[11px] font-semibold leading-relaxed">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{t('settings.branding.colorTip')}</span>
            </div>
          </BrandSectionCard>

          {/* TYPOGRAPHY */}
          <BrandSectionCard
            title={t('settings.branding.sectionType')}
            subtitle={t('settings.branding.sectionTypeSub')}
            icon={Type}
            accent={ACCENT.success}
          >
            <Label className="text-[11px] font-bold uppercase tracking-wide">{t('settings.branding.brandFont')}</Label>
            <div className="space-y-1.5 mt-2">
              {FONT_CHOICES.map((f) => {
                const active = brand.font === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set({ font: f.id })}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-3 rounded-lg border text-left transition-all',
                      active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xl font-extrabold leading-none truncate tracking-tight"
                        style={{ fontFamily: `"${f.id}", sans-serif` }}
                      >
                        {brand.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-semibold mt-1">
                        {f.label} · {t(`settings.branding.fontMood.${f.moodKey}`)}
                      </div>
                    </div>
                    {active && <Check className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>

            <div className="mt-3.5">
              <Label className="text-[11px] font-bold uppercase tracking-wide flex items-center justify-between">
                <span>{t('settings.branding.fontWeight')}</span>
                <span className="font-mono text-muted-foreground normal-case">{brand.fontWeight}</span>
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
          </BrandSectionCard>

          {/* PHOTOGRAPHY */}
          <BrandSectionCard
            title={t('settings.branding.sectionPhoto')}
            subtitle={t('settings.branding.sectionPhotoSub')}
            icon={ImageIcon}
            accent={ACCENT.purple}
          >
            <Label className="text-[11px] font-bold uppercase tracking-wide">{t('settings.branding.photoStyle')}</Label>
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
                      'flex flex-col items-center gap-1.5 p-1.5 rounded-lg border transition-all',
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
          </BrandSectionCard>

          {/* SOCIAL */}
          <BrandSectionCard
            title={t('settings.branding.sectionSocial')}
            subtitle={t('settings.branding.sectionSocialSub')}
            icon={Globe}
            accent={ACCENT.orange}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {socialFields.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.k}>
                    <Label className="text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5">
                      <Icon className="h-3 w-3" style={{ color: s.color }} />
                      <span>{t(`settings.branding.${s.labelKey}`)}</span>
                    </Label>
                    <div className="flex mt-1.5">
                      <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 bg-muted text-[11px] text-muted-foreground font-mono font-bold">
                        {s.prefix}
                      </span>
                      <Input
                        value={brand.social[s.k]}
                        onChange={(e) => setSocial({ [s.k]: e.target.value } as Partial<BrandKit['social']>)}
                        className="rounded-l-none"
                        placeholder={s.k === 'web' ? 'moomclub.co' : ''}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </BrandSectionCard>

          {/* CONTACT */}
          <BrandSectionCard
            title={t('settings.branding.sectionContact')}
            subtitle={t('settings.branding.sectionContactSub')}
            icon={Building2}
            accent={ACCENT.warn}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  <span>{t('settings.branding.contactPhone')}</span>
                </Label>
                <Input
                  value={brand.contact.phone}
                  onChange={(e) => setContact({ phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  <span>{t('settings.branding.contactMail')}</span>
                </Label>
                <Input
                  type="email"
                  value={brand.contact.mail}
                  onChange={(e) => setContact({ mail: e.target.value.toLowerCase().trim() })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="mt-2.5">
              <Label className="text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                <span>{t('settings.branding.contactAddr')}</span>
              </Label>
              <Textarea
                value={brand.contact.addr}
                onChange={(e) => setContact({ addr: e.target.value })}
                rows={2}
                className="mt-1.5 resize-none"
              />
            </div>
          </BrandSectionCard>
        </div>

        {/* RIGHT — sticky preview + summary */}
        <div className="lg:sticky lg:top-4 flex flex-col gap-3">
          <BrandPreviewPanel
            brand={brand}
            previewLabel={t('settings.branding.previewLabel')}
            deviceLabels={{
              mobile: t('settings.branding.deviceMobile'),
              web: t('settings.branding.deviceWeb'),
              card: t('settings.branding.deviceCard'),
            }}
          />
          <BrandSummaryCard
            brand={brand}
            title={t('settings.branding.summaryTitle')}
            rows={summaryRows}
          />
        </div>
      </div>

      {/* Sticky save bar (when dirty) */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t shadow-lg animate-in slide-in-from-bottom-4 duration-200">
          <div className="max-w-[1500px] mx-auto px-6 py-3 flex items-center justify-end gap-2">
            <span className="text-xs text-amber-700 font-semibold mr-auto inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {t('settings.branding.dirty')}
            </span>
            <Button variant="ghost" size="sm" onClick={handleRevert} disabled={saveMutation.isPending}>
              {t('settings.branding.saveBarCancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate(brand)}
              disabled={saveMutation.isPending}
            >
              {t('settings.branding.saveBarSave')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsBranding;
