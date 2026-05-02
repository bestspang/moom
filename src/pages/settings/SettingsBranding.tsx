import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Palette, Type, Image as ImageIcon } from 'lucide-react';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';
import { SettingsLayout } from '@/components/settings';
import { applyBrandTokens } from '@/components/admin-ds/BrandTokens';

/**
 * SettingsBranding — placeholder page for the future "แบรนด์ยิม" experience.
 *
 * Why this exists now:
 *   - Sidebar already exposes a "Branding" entry. It used to redirect to
 *     /setting/general which was confusing. This page gives it a real home.
 *   - Reuses the existing SettingsLayout + useSettings hooks so when the
 *     full Branding builder lands (per MOOM Design System / Branding.jsx)
 *     it slots into the same shell with no routing churn.
 *
 * What it intentionally does NOT do (yet):
 *   - No logo upload, no font picker, no full color builder. Those land in
 *     the dedicated builder per the DS spec.
 *   - The brand-name field below is a thin demo of the wiring (settings
 *     section: 'general', key: 'brand_name') so we can prove the pipe
 *     end-to-end without inventing a new DB table.
 */

type Section = 'identity' | 'colors' | 'typography' | 'assets';

const SettingsBranding = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('general');
  const updateSetting = useUpdateSetting();
  const [activeSection, setActiveSection] = useState<Section>('identity');

  const brandName = getSettingValue<string>(settings, 'brand_name', 'MOOM CLUB');
  const [draftBrandName, setDraftBrandName] = useState<string>(brandName);

  React.useEffect(() => {
    setDraftBrandName(brandName);
  }, [brandName]);

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="h-12 md:h-64 w-full md:w-52" />
        <Skeleton className="h-96 flex-1" />
      </div>
    );
  }

  const menuItems = [
    { id: 'identity', label: t('settings.branding.identityMenu') },
    { id: 'colors', label: t('settings.branding.colorsMenu') },
    { id: 'typography', label: t('settings.branding.typographyMenu') },
    { id: 'assets', label: t('settings.branding.assetsMenu') },
  ];

  const ComingSoonCard = ({
    icon: Icon,
    title,
    desc,
  }: {
    icon: React.ElementType;
    title: string;
    desc: string;
  }) => (
    <div className="border rounded-lg p-6 bg-muted/20 opacity-60 pointer-events-none">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <Badge variant="secondary" className="text-[10px]">
              {t('roadmap.comingSoon')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
    </div>
  );

  const renderIdentity = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.branding.identityDesc')}
      </p>

      <div className="border rounded-lg p-4 space-y-3">
        <div>
          <Label htmlFor="brand-name" className="font-medium">
            {t('settings.branding.brandName')}
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            {t('settings.branding.brandNameDesc')}
          </p>
        </div>
        <Input
          id="brand-name"
          value={draftBrandName}
          onChange={(e) => setDraftBrandName(e.target.value)}
          placeholder="MOOM CLUB"
          maxLength={60}
        />
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDraftBrandName(brandName)}
            disabled={draftBrandName === brandName || updateSetting.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={() =>
              updateSetting.mutate({
                section: 'general',
                key: 'brand_name',
                value: draftBrandName.trim() || 'MOOM CLUB',
              })
            }
            disabled={
              draftBrandName.trim() === brandName.trim() || updateSetting.isPending
            }
          >
            {t('common.save')}
          </Button>
        </div>
      </div>

      <ComingSoonCard
        icon={Sparkles}
        title={t('settings.branding.taglineTitle')}
        desc={t('settings.branding.taglineDesc')}
      />
    </div>
  );

  const renderColors = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.branding.colorsDesc')}
      </p>
      <ComingSoonCard
        icon={Palette}
        title={t('settings.branding.primaryPaletteTitle')}
        desc={t('settings.branding.primaryPaletteDesc')}
      />
      <div className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
        {t('settings.branding.tokenHint')}
        <code className="ml-1 font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
          applyBrandTokens()
        </code>
      </div>
      {/* Touch the import so dead-code elimination doesn't drop it once wiring lands */}
      <span className="hidden">{typeof applyBrandTokens}</span>
    </div>
  );

  const renderTypography = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.branding.typographyDesc')}
      </p>
      <ComingSoonCard
        icon={Type}
        title={t('settings.branding.fontFamilyTitle')}
        desc={t('settings.branding.fontFamilyDesc')}
      />
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.branding.assetsDesc')}
      </p>
      <ComingSoonCard
        icon={ImageIcon}
        title={t('settings.branding.logoUploadTitle')}
        desc={t('settings.branding.logoUploadDesc')}
      />
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'identity':
        return renderIdentity();
      case 'colors':
        return renderColors();
      case 'typography':
        return renderTypography();
      case 'assets':
        return renderAssets();
      default:
        return null;
    }
  };

  return (
    <SettingsLayout
      items={menuItems}
      activeId={activeSection}
      onSelect={(id) => setActiveSection(id as Section)}
      withCard
    >
      {renderContent()}
    </SettingsLayout>
  );
};

export default SettingsBranding;
