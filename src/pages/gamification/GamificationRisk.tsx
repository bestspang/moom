import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGamificationAudit } from '@/hooks/useGamificationAudit';
import { EmptyState } from '@/components/common';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/formatters';

const GamificationRisk = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const { data: flagged, isLoading: flagLoading } = useGamificationAudit({ flaggedOnly: true, limit: 50 });
  const { data: allAudit, isLoading: auditLoading } = useGamificationAudit({ limit: 100 });

  if (flagLoading || auditLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('gamification.risk.description')}</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {t('gamification.risk.flaggedActivity')} ({flagged?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!flagged?.length ? (
            <EmptyState icon={<ShieldAlert className="h-12 w-12" />} message={t('gamification.risk.noFlags')} description={t('gamification.risk.noFlagsDesc')} />
          ) : (
            <div className="space-y-2">
              {flagged.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="font-medium text-sm">{entry.event_type}</span>
                      {entry.action_key && <span className="text-xs text-muted-foreground">· {entry.action_key}</span>}
                    </div>
                    {entry.flag_reason && <p className="text-xs text-destructive mt-0.5">{entry.flag_reason}</p>}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{format(new Date(entry.created_at), 'dd MMM HH:mm', { locale })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t('gamification.risk.auditLog')}</CardTitle></CardHeader>
        <CardContent>
          {!allAudit?.length ? (
            <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1">
              {allAudit.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-xs">
                  <div className="flex items-center gap-2">
                    {entry.flagged && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                    <span className="font-medium">{entry.event_type}</span>
                    {entry.action_key && <span className="text-muted-foreground">{entry.action_key}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {entry.xp_delta !== 0 && <span className={entry.xp_delta > 0 ? 'text-accent-teal' : 'text-destructive'}>{entry.xp_delta > 0 ? '+' : ''}{entry.xp_delta} XP</span>}
                    {entry.points_delta !== 0 && <span className={entry.points_delta > 0 ? 'text-primary' : 'text-destructive'}>{entry.points_delta > 0 ? '+' : ''}{entry.points_delta} pts</span>}
                    <span>{format(new Date(entry.created_at), 'dd/MM HH:mm', { locale })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationRisk;
