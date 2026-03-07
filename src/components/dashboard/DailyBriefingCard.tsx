import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
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

const PRIORITY_COLORS = {
  high: 'text-destructive',
  medium: 'text-primary',
  low: 'text-muted-foreground',
};

export const DailyBriefingCard: React.FC<DailyBriefingCardProps> = ({ stats }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
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
              <div className="space-y-3">
                <p className="text-sm text-foreground leading-relaxed">{data?.summary}</p>
                {data?.actions && data.actions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {data.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(action.route)}
                        className="flex items-center gap-2 w-full text-left hover:bg-accent/50 rounded-md p-2 -mx-1 transition-colors group"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          action.priority === 'high' ? 'bg-destructive' :
                          action.priority === 'medium' ? 'bg-primary' : 'bg-muted-foreground'
                        }`} />
                        <span className={`text-xs flex-1 ${PRIORITY_COLORS[action.priority]}`}>
                          {action.text}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
