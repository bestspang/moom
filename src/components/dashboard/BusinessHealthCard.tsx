import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusinessHealth } from '@/hooks/useBusinessHealth';
import { cn } from '@/lib/utils';

const scoreColor = (score: number) => {
  if (score >= 70) return 'text-accent-teal';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
};

const scoreBg = (score: number) => {
  if (score >= 70) return 'bg-accent-teal/10';
  if (score >= 40) return 'bg-warning/10';
  return 'bg-destructive/10';
};

export const BusinessHealthCard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data, isLoading } = useBusinessHealth();

  if (isLoading) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;

  const metrics = [
    { label: t('businessHealth.retention'), value: data.components.retention },
    { label: t('businessHealth.revenue'), value: data.components.revenueTrend },
    { label: t('businessHealth.classUtil'), value: data.components.classUtilization },
    { label: t('businessHealth.leadConv'), value: data.components.leadConversion },
  ];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/insights')}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Score circle */}
          <div className={cn('h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0', scoreBg(data.score))}>
            <span className={cn('text-xl font-bold', scoreColor(data.score))}>
              {data.score}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{t('businessHealth.title')}</span>
              <TrendIcon className={cn(
                'h-3.5 w-3.5',
                data.trend === 'up' && 'text-accent-teal',
                data.trend === 'down' && 'text-destructive',
                data.trend === 'stable' && 'text-muted-foreground',
              )} />
            </div>

            {/* Mini metric bars */}
            <div className="grid grid-cols-4 gap-2">
              {metrics.map((m) => (
                <div key={m.label} className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground truncate block">{m.label}</span>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', scoreColor(m.value).replace('text-', 'bg-'))}
                      style={{ width: `${Math.max(4, m.value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
