import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Package, DollarSign, BarChart3, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, StatusBadge, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePromotion } from '@/hooks/usePromotions';
import { usePromotionPackages } from '@/hooks/usePromotionPackages';
import { EditPackagesDialog } from '@/components/promotions/EditPackagesDialog';
import { formatCurrency, getDateLocale } from '@/lib/formatters';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Package = Tables<'packages'>;

const PromotionDetails = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editPkgOpen, setEditPkgOpen] = useState(false);

  const { data: promo, isLoading } = usePromotion(id!);
  const { data: linkedPackages, isLoading: pkgLoading } = usePromotionPackages(
    promo?.applicable_packages ?? null
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Promotion not found
      </div>
    );
  }

  const copyCode = () => {
    if (promo.promo_code) {
      navigator.clipboard.writeText(promo.promo_code);
      toast.success('Promo code copied!');
    }
  };

  const getDiscountDisplay = () => {
    if (promo.discount_type === 'percentage') return `${promo.discount_value}%`;
    return formatCurrency(Number(promo.discount_value));
  };

  const computeNetPrice = (pkg: Package) => {
    const price = Number(pkg.price);
    if (promo.discount_type === 'percentage') {
      return price - price * (Number(promo.discount_value) / 100);
    }
    return Math.max(0, price - Number(promo.discount_value));
  };

  const computeDiscountAmount = (pkg: Package) => {
    const price = Number(pkg.price);
    if (promo.discount_type === 'percentage') {
      return price * (Number(promo.discount_value) / 100);
    }
    return Math.min(price, Number(promo.discount_value));
  };

  // TODO: Replace with actual transaction-based tracking when promotion_id is added to transactions
  const unitsSold = promo.usage_count ?? 0;
  const netRevenue = unitsSold * Number(promo.discount_value); // placeholder

  const packageColumns: Column<Package>[] = [
    {
      key: 'name',
      header: t('lobby.name'),
      cell: (row) => (language === 'th' ? row.name_th || row.name_en : row.name_en),
    },
    {
      key: 'sessions',
      header: t('promotions.sessions'),
      cell: (row) => row.sessions ?? '∞',
    },
    {
      key: 'price',
      header: t('promotions.price'),
      cell: (row) => formatCurrency(Number(row.price)),
    },
    {
      key: 'discount',
      header: t('promotions.discountApplied'),
      cell: (row) => `-${formatCurrency(computeDiscountAmount(row))}`,
    },
    {
      key: 'netPrice',
      header: t('promotions.netPrice'),
      cell: (row) => formatCurrency(computeNetPrice(row)),
    },
  ];

  return (
    <div>
      <PageHeader
        title={promo.name}
        breadcrumbs={[
          { label: t('nav.package'), href: '/package' },
          { label: t('promotions.title'), href: '/promotion' },
          { label: promo.name },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/promotion')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        }
      />

      {/* Status + Promo Code */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatusBadge variant={promo.status === 'active' ? 'active' : promo.status === 'scheduled' ? 'pending' : 'default'}>
          {promo.status}
        </StatusBadge>
        <StatusBadge variant={promo.type === 'promo_code' ? 'pending' : 'default'}>
          {promo.type === 'promo_code' ? 'Promo code' : 'Discount'}
        </StatusBadge>
        {promo.promo_code && (
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-md text-sm font-mono hover:bg-muted/80 transition-colors"
          >
            <code>{promo.promo_code}</code>
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t('promotions.unitsSold')}
          value={unitsSold.toString()}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          title={t('promotions.netRevenue')}
          value={formatCurrency(netRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="TODO: from transactions"
        />
        <StatCard
          title={t('promotions.usage')}
          value={`${promo.usage_count ?? 0} / ${promo.usage_limit ?? '∞'}`}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          title={t('promotions.discount')}
          value={getDiscountDisplay()}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Details Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('promotions.details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('lobby.name')}</dt>
              <dd className="font-medium">{promo.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('promotions.type')}</dt>
              <dd className="font-medium capitalize">{promo.type?.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('promotions.discount')}</dt>
              <dd className="font-medium">{getDiscountDisplay()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('promotions.usageLimit')}</dt>
              <dd className="font-medium">
                {promo.usage_limit ? `${promo.usage_count ?? 0} / ${promo.usage_limit}` : t('promotions.unlimited')}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('promotions.startedOn')}</dt>
              <dd className="font-medium">
                {promo.start_date ? format(new Date(promo.start_date), 'd MMM yyyy', { locale }) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('promotions.endingOn')}</dt>
              <dd className="font-medium">
                {promo.end_date ? format(new Date(promo.end_date), 'd MMM yyyy', { locale }) : '-'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Eligible Packages */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('promotions.eligiblePackages')}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditPkgOpen(true)}>
            {t('promotions.editPackages')}
          </Button>
        </CardHeader>
        <CardContent>
          {pkgLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : linkedPackages && linkedPackages.length > 0 ? (
            <DataTable
              columns={packageColumns}
              data={linkedPackages}
              rowKey={(row) => row.id}
              emptyMessage={t('promotions.noPackagesLinked')}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t('promotions.noPackagesLinked')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI Assist Placeholder */}
      <Card className="opacity-60">
        <CardHeader className="flex flex-row items-center gap-2">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <CardTitle>{t('promotions.aiAssist')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button disabled variant="outline">
            {t('promotions.aiComingSoon')}
          </Button>
        </CardContent>
      </Card>

      <EditPackagesDialog
        open={editPkgOpen}
        onOpenChange={setEditPkgOpen}
        promotionId={promo.id}
        currentPackageIds={promo.applicable_packages ?? []}
      />
    </div>
  );
};

export default PromotionDetails;
