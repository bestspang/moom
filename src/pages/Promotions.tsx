import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePromotions, usePromotionStats } from '@/hooks/usePromotions';
import { formatCurrency, getDateLocale } from '@/lib/formatters';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Promotion = Tables<'promotions'>;

const Promotions = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const { data: promotions, isLoading } = usePromotions(activeTab, search);
  const { data: stats } = usePromotionStats();

  const statusTabs: StatusTab[] = [
    { key: 'active', label: t('common.active'), count: stats?.active || 0, color: 'teal' },
    { key: 'scheduled', label: t('packages.scheduled'), count: stats?.scheduled || 0 },
    { key: 'drafts', label: t('packages.drafts'), count: stats?.drafts || 0 },
    { key: 'archive', label: t('packages.archive'), count: stats?.archive || 0, color: 'gray' },
  ];

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied!');
  };

  const getDiscountDisplay = (promo: Promotion) => {
    // Prefer new schema columns, fallback to legacy
    const mode = (promo as any).discount_mode || promo.discount_type;
    if (mode === 'percentage') {
      const val = (promo as any).percentage_discount ?? promo.discount_value;
      return `${val}%`;
    }
    const val = (promo as any).flat_rate_discount ?? promo.discount_value;
    return formatCurrency(Number(val));
  };

  const columns: Column<Promotion>[] = [
    { key: 'name', header: t('lobby.name'), cell: (row) => row.name },
    { 
      key: 'type', 
      header: t('packages.type'), 
      cell: (row) => (
        <StatusBadge variant={row.type === 'promo_code' ? 'pending' : 'default'}>
          {row.type === 'promo_code' ? 'Promo code' : 'Discount'}
        </StatusBadge>
      )
    },
    { 
      key: 'promoCode', 
      header: t('promotions.promoCode'), 
      cell: (row) => row.promo_code ? (
        <div className="flex items-center gap-2">
          <code className="bg-muted px-2 py-1 rounded text-sm">{row.promo_code}</code>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6"
            onClick={() => copyPromoCode(row.promo_code!)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ) : '-'
    },
    { key: 'discount', header: t('promotions.discount'), cell: (row) => getDiscountDisplay(row) },
    { 
      key: 'startDate', 
      header: t('promotions.startedOn'), 
      cell: (row) => row.start_date ? format(new Date(row.start_date), 'd MMM yyyy', { locale }) : '-'
    },
    { 
      key: 'endDate', 
      header: t('promotions.endingOn'), 
      cell: (row) => row.end_date ? format(new Date(row.end_date), 'd MMM yyyy', { locale }) : '-'
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('promotions.title')}
        breadcrumbs={[{ label: t('nav.package') }, { label: t('promotions.title') }]}
        actions={
          <Button className="bg-primary hover:bg-primary-hover" onClick={() => navigate('/promotion/create')}>
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

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={promotions || []}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/promotion/${row.id}`)}
          emptyMessage={t('common.noData')}
        />
      )}
    </div>
  );
};

export default Promotions;
