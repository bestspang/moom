import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface CardQueryErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  /** Compact = for KPI tiles; default fits in chart/list cards */
  compact?: boolean;
}

/**
 * Inline error state for a single card/tile. Shows an icon + short
 * message + Retry button. Keeps the surrounding layout intact so the
 * user can see which specific component failed.
 */
export function CardQueryError({ message, onRetry, className, compact }: CardQueryErrorProps) {
  const { t } = useTranslation();
  const msg = message || t('common.cardError');
  if (compact) {
    return (
      <div
        role="alert"
        className={cn(
          'flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive',
          className,
        )}
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate">{msg}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium hover:bg-destructive/10"
            aria-label={t('common.retry')}
          >
            <RefreshCw className="h-3 w-3" />
            {t('common.retry')}
          </button>
        )}
      </div>
    );
  }
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 py-6 px-4 text-center',
        className,
      )}
    >
      <AlertCircle className="mb-2 h-5 w-5 text-destructive" />
      <p className="text-sm font-medium text-destructive">{t('common.failedToLoad')}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{msg}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 h-7 text-xs">
          <RefreshCw className="mr-1 h-3 w-3" /> {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

export default CardQueryError;
