import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DatePicker, SearchBar, DataTable, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Schedule = () => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState('');

  return (
    <div>
      <PageHeader
        title={t('schedule.title')}
        breadcrumbs={[{ label: t('nav.class') }, { label: t('schedule.title') }]}
        actions={
          <Button className="bg-primary hover:bg-primary-hover">
            {t('schedule.scheduleClass')}
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <DatePicker date={selectedDate} onChange={setSelectedDate} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title={t('schedule.classes')} value={8} comparison={{ value: 5, label: t('dashboard.comparedToYesterday') }} color="teal" />
        <StatCard title={t('schedule.personalTraining')} value={3} comparison={{ value: -10 }} color="orange" />
        <StatCard title={t('schedule.avgCapacity')} value="72%" comparison={{ value: 8 }} color="blue" />
        <StatCard title={t('schedule.cancellations')} value={1} comparison={{ value: -50 }} color="gray" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="outline" className="rounded-full">{t('schedule.allTrainers')}</Button>
        <Button variant="ghost" className="rounded-full flex items-center gap-2">
          <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">JD</AvatarFallback></Avatar>
          John Doe
        </Button>
      </div>

      <EmptyState message={t('common.noData')} />
    </div>
  );
};

export default Schedule;
