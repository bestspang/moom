import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRevenueForecast } from '@/hooks/useRevenueForecast';
import { formatCurrency } from '@/lib/formatters';

export const RevenueForecastCard: React.FC = () => {
  const { t } = useLanguage();
  const { data, isLoading } = useRevenueForecast();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const maxVal = Math.max(data.lastMonth, data.thisMonth, data.projectedNextMonth, 1);

  const bars = [
    { label: t('revenueForecast.lastMonth'), value: data.lastMonth, projected: false },
    { label: t('revenueForecast.thisMonth'), value: data.thisMonth, projected: false },
    { label: t('revenueForecast.nextMonth'), value: data.projectedNextMonth, projected: true },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t('revenueForecast.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                {bar.label}
                {bar.projected && (
                  <span className="ml-1 text-[10px] text-muted-foreground/70">
                    ({t('revenueForecast.projected')})
                  </span>
                )}
              </span>
              <span className="font-medium">{formatCurrency(bar.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  bar.projected
                    ? 'bg-primary/40 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,hsl(var(--primary)/0.2)_4px,hsl(var(--primary)/0.2)_8px)]'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.max(2, (bar.value / maxVal) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
