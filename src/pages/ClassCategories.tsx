import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassCategories } from '@/hooks/useClassCategories';
import type { Tables } from '@/integrations/supabase/types';

type ClassCategory = Tables<'class_categories'>;

const ClassCategories = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const { data: categories, isLoading } = useClassCategories(search);

  const columns: Column<ClassCategory>[] = [
    { key: 'name', header: t('categories.classCategory'), cell: (row) => row.name },
    { key: 'classCount', header: t('categories.classesInCategory'), cell: (row) => row.class_count || 0 },
  ];

  return (
    <div>
      <PageHeader 
        title={t('categories.title')} 
        breadcrumbs={[{ label: t('nav.class') }, { label: t('categories.title') }]} 
        actions={
          <Button className="bg-primary hover:bg-primary-hover">
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
        />
      )}
    </div>
  );
};

export default ClassCategories;
