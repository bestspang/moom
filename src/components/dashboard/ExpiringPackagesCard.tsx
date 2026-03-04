import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpiringPackages } from '@/hooks/useExpiringPackages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExpiringPackagesCard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: packages = [], isLoading } = useExpiringPackages();

  const urgentCount = packages.filter((p) => p.urgency === 'red').length;
  const warningCount = packages.filter((p) => p.urgency === 'yellow').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t('dashboard.expiringPackages')}
          </CardTitle>
          {packages.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              {urgentCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                  {urgentCount} {t('dashboard.urgent')}
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                  {warningCount} {t('dashboard.soon')}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : packages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('dashboard.noExpiringPackages')} 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {packages.slice(0, 8).map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => navigate(`/members/${pkg.memberId}/detail`)}
                className="flex items-center gap-3 w-full text-left hover:bg-accent/50 rounded-md p-1.5 -mx-1.5 transition-colors"
              >
                <div
                  className={cn(
                    'h-2 w-2 rounded-full flex-shrink-0',
                    pkg.urgency === 'red' && 'bg-destructive',
                    pkg.urgency === 'yellow' && 'bg-amber-500',
                    pkg.urgency === 'green' && 'bg-emerald-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pkg.memberName}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {pkg.packageName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={cn(
                      'text-xs font-medium',
                      pkg.urgency === 'red' && 'text-destructive',
                      pkg.urgency === 'yellow' && 'text-amber-600',
                      pkg.urgency === 'green' && 'text-muted-foreground'
                    )}
                  >
                    <Clock className="h-3 w-3 inline mr-0.5" />
                    {pkg.daysLeft}d
                  </p>
                </div>
              </button>
            ))}
            {packages.length > 8 && (
              <Button
                variant="link"
                size="sm"
                className="text-primary p-0 h-auto text-xs w-full text-center"
                onClick={() => navigate('/report/member/members-at-risk')}
              >
                +{packages.length - 8} {t('common.viewAll')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
