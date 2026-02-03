import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses, useClassStats } from '@/hooks/useClasses';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/formatters';

const Classes = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: classes, isLoading } = useClasses(activeTab === 'all' ? undefined : activeTab, search);
  const { data: stats } = useClassStats();

  const statusTabs: StatusTab[] = [
    { key: 'all', label: t('classes.allClasses'), count: stats?.all || 0, color: 'teal' },
    { key: 'drafts', label: t('packages.drafts'), count: stats?.drafts || 0 },
    { key: 'archive', label: t('packages.archive'), count: stats?.archive || 0 },
  ];

  const getLevelLabel = (level: string | null) => {
    switch (level) {
      case 'all_levels': return t('classes.allLevels');
      case 'beginner': return t('classes.beginner');
      case 'intermediate': return t('classes.intermediate');
      case 'advanced': return t('classes.advanced');
      default: return level || '-';
    }
  };

  const columns: Column<any>[] = [
    { key: 'name', header: t('classes.className'), cell: (row) => row.name },
    { 
      key: 'type', 
      header: t('packages.type'), 
      cell: (row) => (
        <StatusBadge variant={row.type === 'pt' ? 'pending' : 'default'}>
          {row.type === 'pt' ? 'PT' : 'Class'}
        </StatusBadge>
      )
    },
    { 
      key: 'categories', 
      header: t('packages.categories'), 
      cell: (row) => row.category?.name || '-'
    },
    { key: 'level', header: t('classes.level'), cell: (row) => getLevelLabel(row.level) },
    { key: 'duration', header: t('classes.duration'), cell: (row) => row.duration || 60 },
    { 
      key: 'dateModified', 
      header: t('classes.dateModified'), 
      cell: (row) => row.updated_at ? format(new Date(row.updated_at), 'd MMM yyyy', { locale }) : '-'
    },
  ];

  return (
    <div>
      <PageHeader 
        title={t('classes.title')} 
        breadcrumbs={[{ label: t('nav.class') }, { label: t('classes.title') }]} 
        actions={
          <Button className="bg-primary hover:bg-primary-hover">
            {t('classes.createClass')}
          </Button>
        } 
      />
      
      <SearchBar 
        placeholder={t('classes.searchPlaceholder')} 
        value={search} 
        onChange={setSearch} 
        className="max-w-md mb-6" 
      />
      
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={classes || []} 
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
        />
      )}
    </div>
  );
};

export default Classes;
