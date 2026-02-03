import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';

interface Promotion {
  id: string;
  name: string;
  type: 'discount' | 'promo_code';
  promoCode: string | null;
  discount: string;
  startedOn: Date;
  endingOn: Date;
  status: string;
}

const Promotions = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Sample data
  const promotions: Promotion[] = [
    {
      id: '1',
      name: 'New Year Sale',
      type: 'promo_code',
      promoCode: 'NEWYEAR2026',
      discount: '20%',
      startedOn: new Date('2026-01-01'),
      endingOn: new Date('2026-01-31'),
      status: 'active',
    },
    {
      id: '2',
      name: 'First Time Discount',
      type: 'discount',
      promoCode: null,
      discount: '10%',
      startedOn: new Date('2026-01-01'),
      endingOn: new Date('2026-12-31'),
      status: 'active',
    },
  ];

  const statusTabs: StatusTab[] = [
    { key: 'active', label: t('common.active'), count: 3, color: 'teal' },
    { key: 'scheduled', label: t('packages.scheduled'), count: 0 },
    { key: 'drafts', label: t('packages.drafts'), count: 0 },
    { key: 'archive', label: t('packages.archive'), count: 0, color: 'gray' },
  ];

  const columns: Column<Promotion>[] = [
    { key: 'name', header: t('lobby.name'), cell: (row) => row.name },
    {
      key: 'type',
      header: t('packages.type'),
      cell: (row) => (
        <StatusBadge variant={row.type === 'promo_code' ? 'pending' : 'default'}>
          {row.type === 'promo_code' ? 'Promo code' : 'Discount'}
        </StatusBadge>
      ),
    },
    {
      key: 'promoCode',
      header: t('promotions.promoCode'),
      cell: (row) =>
        row.promoCode ? (
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded text-sm">{row.promoCode}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => navigator.clipboard.writeText(row.promoCode!)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          '-'
        ),
    },
    { key: 'discount', header: t('promotions.discount'), cell: (row) => row.discount },
    {
      key: 'startedOn',
      header: t('promotions.startedOn'),
      cell: (row) => formatDate(row.startedOn),
    },
    {
      key: 'endingOn',
      header: t('promotions.endingOn'),
      cell: (row) => formatDate(row.endingOn),
    },
  ];

  const filteredPromotions = promotions.filter((promo) => {
    if (activeTab !== 'all' && promo.status !== activeTab) return false;
    if (search) {
      return promo.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title={t('promotions.title')}
        breadcrumbs={[{ label: t('nav.package') }, { label: t('promotions.title') }]}
        actions={
          <Button className="bg-primary hover:bg-primary-hover">
            {t('promotions.createPromotion')}
          </Button>
        }
      />

      <div className="mb-6">
        <SearchBar
          placeholder={t('promotions.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </div>

      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />

      <DataTable
        columns={columns}
        data={filteredPromotions}
        rowKey={(row) => row.id}
      />
    </div>
  );
};

export default Promotions;
