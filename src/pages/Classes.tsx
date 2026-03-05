import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, StatusBadge, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses } from '@/hooks/useClasses';

const Classes = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: classesResult, isLoading } = useClasses(
    undefined, search, undefined, undefined, undefined, page, perPage
  );
  const classes = classesResult?.rows;
  const total = classesResult?.total ?? 0;

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
      ),
    },
    {
      key: 'categories',
      header: t('packages.categories'),
      cell: (row) => row.category?.name || '-',
    },
    { key: 'level', header: t('classes.level'), cell: (row) => getLevelLabel(row.level) },
    { key: 'duration', header: t('classes.duration'), cell: (row) => row.duration || 60 },
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

      <SearchBar
        placeholder={t('classes.searchPlaceholder')}
        value={search}
        onChange={(v) => { setSearch(v); setPage(1); }}
        className="max-w-md mb-6"
      />

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
