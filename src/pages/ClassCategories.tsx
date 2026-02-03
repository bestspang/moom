import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';

const ClassCategories = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const categories = [
    { id: '1', name: 'Standard', classCount: 5 },
    { id: '2', name: 'Group Class', classCount: 12 },
    { id: '3', name: 'Personal Training A', classCount: 3 },
    { id: '4', name: 'Boxing/Combat', classCount: 4 },
    { id: '5', name: 'Pilates Studio', classCount: 6 },
  ];

  const columns: Column<typeof categories[0]>[] = [
    { key: 'name', header: 'Class category', cell: (row) => row.name },
    { key: 'classCount', header: t('categories.classesInCategory'), cell: (row) => row.classCount },
  ];

  return (
    <div>
      <PageHeader title={t('categories.title')} breadcrumbs={[{ label: t('nav.class') }, { label: t('categories.title') }]} actions={<Button className="bg-primary hover:bg-primary-hover">{t('common.create')}</Button>} />
      <SearchBar placeholder={t('categories.searchPlaceholder')} value={search} onChange={setSearch} className="max-w-md mb-6" />
      <DataTable columns={columns} data={categories} rowKey={(row) => row.id} />
    </div>
  );
};

export default ClassCategories;
