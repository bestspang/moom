import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useAiSuggestions,
  useApproveSuggestion,
  useRejectSuggestion,
  type AiSuggestion,
} from '@/hooks/useAiSuggestions';

const SuggestionRow = ({ suggestion }: { suggestion: AiSuggestion }) => {
  const approve = useApproveSuggestion();
  const reject = useRejectSuggestion();

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {suggestion.suggestion_type}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {suggestion.entity_type}
          </span>
        </div>
        {suggestion.confidence != null && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {Math.round(suggestion.confidence * 100)}%
          </p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-primary hover:text-primary"
          onClick={() => approve.mutate(suggestion.id)}
          disabled={approve.isPending}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => reject.mutate(suggestion.id)}
          disabled={reject.isPending}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    ))}
  </div>
);

export const AiSuggestionsCard = () => {
  const { t } = useLanguage();
  const { data: suggestions = [], isLoading } = useAiSuggestions('pending', 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('ai.suggestions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <SuggestionRow key={s.id} suggestion={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('ai.noSuggestions')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
