import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryError({ message, onRetry }: QueryErrorProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in-0 duration-200">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{t('common.failedToLoad')}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">{message ?? t('common.error')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-1" /> {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
