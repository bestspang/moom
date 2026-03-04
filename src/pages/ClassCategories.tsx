import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassCategories, type ClassCategoryWithCount } from '@/hooks/useClassCategories';
import CreateClassCategoryDialog from '@/components/categories/CreateClassCategoryDialog';

const ClassCategories = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: categories, isLoading } = useClassCategories(search);

  const columns: Column<ClassCategoryWithCount>[] = [
    {
      key: 'name',
      header: t('categories.classCategory'),
      cell: (row) => language === 'th' && row.name_th ? row.name_th : row.name,
    },
    {
      key: 'classCount',
      header: t('categories.classesInCategory'),
      cell: (row) => row.computed_class_count,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('categories.title')}
        breadcrumbs={[{ label: t('nav.class') }, { label: t('categories.title') }]}
        actions={
          <Button className="bg-primary hover:bg-primary-hover" onClick={() => setCreateOpen(true)}>
            {t('common.create')}
          </Button>
        }
      />

      <SearchBar
        placeholder={t('categories.searchPlaceholder')}
        value={search}
        onChange={setSearch}
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
          data={categories || []}
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
          onRowClick={(row) => navigate(`/class-category/${row.id}`)}
        />
      )}

      <CreateClassCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default ClassCategories;
