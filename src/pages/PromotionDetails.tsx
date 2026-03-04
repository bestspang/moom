import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Package, DollarSign, BarChart3, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type PackageRow = Tables<'packages'> & { discount_override?: number | null; max_sale_amount?: number | null };

/** Query real redemption stats from promotion_redemptions */
const usePromotionRedemptionStats = (promotionId: string | null) => {
  return useQuery({
    queryKey: ['promotion-redemptions', promotionId, 'stats'],
    queryFn: async () => {
      if (!promotionId) return { unitsSold: 0, netRevenue: 0, totalDiscount: 0 };
      const { data, error } = await supabase
        .from('promotion_redemptions')
        .select('discount_amount, net_amount')
        .eq('promotion_id', promotionId);
      if (error) throw error;
      const rows = data || [];
      return {
        unitsSold: rows.length,
        netRevenue: rows.reduce((s, r) => s + Number(r.net_amount || 0), 0),
        totalDiscount: rows.reduce((s, r) => s + Number(r.discount_amount || 0), 0),
      };
    },
    enabled: !!promotionId,
  });
};

const PromotionDetails = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editPkgOpen, setEditPkgOpen] = useState(false);

  const { data: promo, isLoading } = usePromotion(id!);
  const { data: linkedPackages, isLoading: pkgLoading } = usePromotionPackages(
    id ?? null,
    promo?.applicable_packages ?? null,
  );
  const { data: redemptionStats } = usePromotionRedemptionStats(id ?? null);

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

  // Use new columns with fallback to legacy
  const discountMode = promo.discount_mode || promo.discount_type || 'percentage';

  const getDiscountDisplay = () => {
    if (discountMode === 'percentage') {
      const val = promo.percentage_discount ?? promo.discount_value;
      return `${val}%`;
    }
    const val = promo.flat_rate_discount ?? promo.discount_value;
    return formatCurrency(Number(val));
  };

  const getPackageDiscount = (pkg: PackageRow): number => {
    // Per-package override when same_discount_all_packages is false
    if (promo.same_discount_all_packages === false && pkg.discount_override != null) {
      return pkg.discount_override;
    }
    // Global discount
    if (discountMode === 'percentage') return Number(promo.percentage_discount ?? promo.discount_value ?? 0);
    return Number(promo.flat_rate_discount ?? promo.discount_value ?? 0);
  };

  const computeDiscountAmount = (pkg: PackageRow) => {
    const price = Number(pkg.price);
    const discount = getPackageDiscount(pkg);
    if (discountMode === 'percentage') {
      return price * (discount / 100);
    }
    return Math.min(price, discount);
  };

  const computeNetPrice = (pkg: PackageRow) => {
    return Math.max(0, Number(pkg.price) - computeDiscountAmount(pkg));
  };

  const unitsSold = redemptionStats?.unitsSold ?? promo.usage_count ?? 0;
  const netRevenue = redemptionStats?.netRevenue ?? 0;

  const packageColumns: Column<PackageRow>[] = [
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

  // Helper for per-user display
  const perUserDisplay = () => {
    const mode = promo.per_user_mode || 'unlimited';
    if (mode === 'unlimited') return t('promotions.unlimited');
    if (mode === 'one_time') return t('promotions.oneTime');
    return `${promo.per_user_limit ?? '-'} ${t('promotions.times')}`;
  };

  return (
    <div>
      <PageHeader
        title={language === 'th' ? (promo.name_th || promo.name) : (promo.name_en || promo.name)}
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
        />
        <StatCard
          title={t('promotions.usage')}
          value={`${promo.usage_count ?? 0} / ${promo.units_mode === 'specific' ? (promo.available_units ?? '∞') : '∞'}`}
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
              <dd className="font-medium">{language === 'th' ? (promo.name_th || promo.name) : (promo.name_en || promo.name)}</dd>
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
                {promo.units_mode === 'specific'
                  ? `${promo.usage_count ?? 0} / ${promo.available_units ?? '∞'}`
                  : t('promotions.unlimited')}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('promotions.perUserMode')}</dt>
              <dd className="font-medium">{perUserDisplay()}</dd>
            </div>
            {promo.has_max_redemption && (
              <div>
                <dt className="text-muted-foreground">{t('promotions.maxRedemption')}</dt>
                <dd className="font-medium">{formatCurrency(Number(promo.max_redemption_value ?? 0))}</dd>
              </div>
            )}
            {promo.has_min_price && (
              <div>
                <dt className="text-muted-foreground">{t('promotions.minPrice')}</dt>
                <dd className="font-medium">{formatCurrency(Number(promo.min_price_requirement ?? 0))}</dd>
              </div>
            )}
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
              data={linkedPackages as PackageRow[]}
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
