import React from 'react';
import { Wrench } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Public "we're improving the site" screen shown when the global
 * `maintenance_mode` feature flag is ON. Intentionally has no link to
 * the login page — admins enter via `/admin`.
 */
const Maintenance: React.FC = () => {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Wrench className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t('maintenance.title')}
          </h1>
          <p className="text-muted-foreground">{t('maintenance.subtitle')}</p>
        </div>
        <p className="text-sm text-muted-foreground">{t('maintenance.body')}</p>
      </div>
    </main>
  );
};

export default Maintenance;
