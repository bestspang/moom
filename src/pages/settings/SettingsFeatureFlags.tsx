import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags, useToggleFeatureFlag } from '@/hooks/useFeatureFlags';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common';
import { Flag } from 'lucide-react';

const SettingsFeatureFlags = () => {
  const { t } = useLanguage();
  const { data: flags, isLoading } = useFeatureFlags();
  const toggleFlag = useToggleFeatureFlag();

  const getScopeBadgeVariant = (scope: string) => {
    switch (scope) {
      case 'global': return 'default';
      case 'location': return 'secondary';
      case 'user': return 'outline';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-11" />
          </div>
        ))}
      </div>
    );
  }

  if (!flags || flags.length === 0) {
    return <EmptyState message={t('common.noData')} />;
  }

  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{t('featureFlags.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('featureFlags.description')}</p>
      </div>

      <div className="space-y-3">
        {flags.map((flag) => (
          <div
            key={flag.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Flag className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{flag.name}</span>
                  <Badge variant={getScopeBadgeVariant(flag.scope || 'global')} className="text-[10px] px-1.5 py-0">
                    {flag.scope || 'global'}
                  </Badge>
                </div>
                {flag.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{flag.description}</p>
                )}
                <p className="text-xs text-muted-foreground/60 mt-1 font-mono">{flag.key}</p>
              </div>
            </div>
            <Switch
              checked={flag.enabled ?? false}
              onCheckedChange={(checked) => toggleFlag.mutate({ id: flag.id, enabled: checked })}
              disabled={toggleFlag.isPending}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsFeatureFlags;
