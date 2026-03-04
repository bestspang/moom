import React from 'react';
import { Sparkles, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDailyBriefing } from '@/hooks/useDailyBriefing';
import { useState } from 'react';

interface DailyBriefingCardProps {
  stats: {
    checkinsToday: number;
    classesToday: number;
    currentlyInClass: number;
    expiringPackages7d: number;
    expiringPackages30d: number;
    highRiskCount: number;
    activeMembers: number;
  } | undefined;
}

export const DailyBriefingCard: React.FC<DailyBriefingCardProps> = ({ stats }) => {
  const { t } = useLanguage();
  const { data, isLoading, isError, dismissed, dismiss, refresh } = useDailyBriefing(stats);
  const [isOpen, setIsOpen] = useState(true);

  if (dismissed || !stats) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">{t('dailyBriefing.title')}</CardTitle>
                {isOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={refresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={dismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : isError ? (
              <p className="text-sm text-muted-foreground">{t('dailyBriefing.error')}</p>
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{data?.summary}</p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
