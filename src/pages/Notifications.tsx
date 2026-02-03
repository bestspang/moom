import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, EmptyState } from '@/components/common';

const Notifications = () => {
  const { t } = useLanguage();
  return (
    <div>
      <PageHeader title={t('notifications.title')} breadcrumbs={[{ label: t('notifications.title') }]} />
      <EmptyState message={t('notifications.noUnread')} />
    </div>
  );
};

export default Notifications;
