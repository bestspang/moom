import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClasses, useClassStats } from '@/hooks/useClasses';
import { useClassCategories } from '@/hooks/useClassCategories';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/formatters';

const Classes = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const effectiveType = typeFilter && typeFilter !== 'all' ? typeFilter : undefined;
  const effectiveCategory = categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined;
  const effectiveLevel = levelFilter && levelFilter !== 'all' ? levelFilter : undefined;

  const { data: classesResult, isLoading } = useClasses(
    activeTab === 'all' ? undefined : activeTab,
    search,
    effectiveType,
    effectiveCategory,
    effectiveLevel,
    page,
    perPage,
  );
  const classes = classesResult?.rows;
  const total = classesResult?.total ?? 0;
  const { data: stats } = useClassStats();
  const { data: categories } = useClassCategories();

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
          <Button className="bg-primary hover:bg-primary-hover" onClick={() => navigate('/class/create')}>
            {t('classes.createClass')}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchBar
          placeholder={t('classes.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('packages.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="class">Class</SelectItem>
            <SelectItem value="pt">PT</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('packages.categories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('classes.level')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="all_levels">{t('classes.allLevels')}</SelectItem>
            <SelectItem value="beginner">{t('classes.beginner')}</SelectItem>
            <SelectItem value="intermediate">{t('classes.intermediate')}</SelectItem>
            <SelectItem value="advanced">{t('classes.advanced')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); setPage(1); }} />

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
          onRowClick={(row) => navigate(`/class/${row.id}`)}
          emptyMessage={t('classes.noClasses')}
          pagination={{ page, perPage, total }}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default Classes;
