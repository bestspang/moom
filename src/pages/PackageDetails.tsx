import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Check, X, ShoppingCart, DollarSign, Users, UserX, Archive } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, StatusBadge } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';
import { usePackage, useUpdatePackage, useArchivePackage } from '@/hooks/usePackages';
import { usePackageMetrics } from '@/hooks/usePackageMetrics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

type Package = Tables<'packages'>;

type EditingSection = 'names' | 'price' | 'term' | 'recurring' | 'quantity' | 'access' | 'description' | 'distribution' | null;

const PackageDetails = () => {
  const { t, language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [editValues, setEditValues] = useState<Partial<TablesUpdate<'packages'>>>({});

  const { data: pkg, isLoading } = usePackage(id!);
  const { data: metrics } = usePackageMetrics(id!);
  const updatePackage = useUpdatePackage();
  const archivePackage = useArchivePackage();

  // Resolve access_locations UUIDs to names
  const locationIds = pkg?.access_locations?.filter(Boolean) ?? [];
  const { data: accessLocationNames } = useQuery({
    queryKey: ['package-access-locations', id, locationIds],
    queryFn: async () => {
      if (!locationIds.length) return '';
      const { data, error } = await supabase
        .from('locations')
        .select('name')
        .in('id', locationIds);
      if (error) throw error;
      return (data || []).map((l) => l.name).join(', ');
    },
    enabled: !!pkg && !pkg.all_locations && locationIds.length > 0,
  });

  const startEdit = useCallback((section: EditingSection, initialValues: Partial<TablesUpdate<'packages'>>) => {
    setEditingSection(section);
    setEditValues(initialValues);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingSection(null);
    setEditValues({});
  }, []);

  const saveEdit = useCallback(async () => {
    if (!pkg || !id) return;

    // Compute diff for activity log
    const oldValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};
    for (const key of Object.keys(editValues) as (keyof typeof editValues)[]) {
      if (editValues[key] !== (pkg as Record<string, unknown>)[key]) {
        oldValue[key] = (pkg as Record<string, unknown>)[key];
        newValue[key] = editValues[key];
      }
    }

    updatePackage.mutate(
      { id, data: editValues },
      {
        onSuccess: async () => {
          // Log to activity_log
          if (Object.keys(newValue).length > 0) {
            await supabase.from('activity_log').insert([{
              event_type: 'package_updated',
              activity: `Updated package: ${pkg.name_en}`,
              entity_type: 'package',
              entity_id: id,
              old_value: oldValue as any,
              new_value: newValue as any,
            }]);
          }
          setEditingSection(null);
          setEditValues({});
        },
      }
    );
  }, [pkg, id, editValues, updatePackage]);

  const handleArchive = useCallback(() => {
    if (!id) return;
    archivePackage.mutate(id, {
      onSuccess: () => navigate('/package'),
    });
  }, [id, archivePackage, navigate]);

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'on_sale': return 'active' as const;
      case 'scheduled': return 'pending' as const;
      case 'drafts': return 'inactive' as const;
      case 'archive': return 'inactive' as const;
      default: return 'default' as const;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'on_sale': return t('packages.onSale');
      case 'scheduled': return t('packages.scheduled');
      case 'drafts': return t('packages.drafts');
      case 'archive': return t('packages.archive');
      default: return status || '-';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'unlimited': return t('packages.unlimited');
      case 'session': return t('packages.session');
      case 'pt': return t('packages.pt');
      default: return type;
    }
  };

  const getUsageTypeLabel = (usageType: string | null) => {
    switch (usageType) {
      case 'class_only': return t('packages.create.classOnly');
      case 'gym_checkin_only': return t('packages.create.gymCheckinOnly');
      case 'both': return t('packages.create.both');
      default: return usageType || '-';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('common.noData')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/package')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const packageName = language === 'th' && pkg.name_th ? pkg.name_th : pkg.name_en;

  const SectionHeader = ({ title, section, initialValues }: { title: string; section: EditingSection; initialValues: Partial<TablesUpdate<'packages'>> }) => (
    <div className="flex items-center justify-between">
      <CardTitle className="text-base">{title}</CardTitle>
      {editingSection === section ? (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit} disabled={updatePackage.isPending}>
            <Check className="h-4 w-4 text-accent-teal" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ) : (
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(section, initialValues)}>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/package')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-extrabold tracking-tight leading-tight">{packageName}</h1>
            <StatusBadge variant={getStatusBadgeVariant(pkg.status)}>
              {getStatusLabel(pkg.status)}
            </StatusBadge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {getTypeLabel(pkg.type)} · {formatCurrency(pkg.price)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/package/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-1" />
            {t('common.edit')}
          </Button>
          {pkg.status !== 'archive' && (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-1" />
              {t('packages.archive')}
            </Button>
          )}
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('packages.details.soldThisWeek')}
          value={metrics?.soldThisWeek ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="teal"
        />
        <StatCard
          title={t('packages.details.revenueToDate')}
          value={formatCurrency(metrics?.revenueToDate ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          color="orange"
        />
        <StatCard
          title={t('packages.details.activeMemberships')}
          value={metrics?.activeCount ?? 0}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title={t('packages.details.inactiveMemberships')}
          value={metrics?.inactiveCount ?? 0}
          icon={<UserX className="h-5 w-5" />}
          color="gray"
        />
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Names */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('packages.details.packageName')}
              section="names"
              initialValues={{ name_en: pkg.name_en, name_th: pkg.name_th }}
            />
          </CardHeader>
          <CardContent>
            {editingSection === 'names' ? (
              <div className="space-y-3">
                <div>
                  <Label>{t('packages.create.packageNameEn')}</Label>
                  <Input
                    value={(editValues.name_en as string) || ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, name_en: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t('packages.create.packageNameTh')}</Label>
                  <Input
                    value={(editValues.name_th as string) || ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, name_th: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <>
                <DetailRow label="EN" value={pkg.name_en} />
                <DetailRow label="TH" value={pkg.name_th || '-'} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Price */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('packages.create.price')}
              section="price"
              initialValues={{ price: pkg.price }}
            />
          </CardHeader>
          <CardContent>
            {editingSection === 'price' ? (
              <div>
                <Label>{t('packages.create.priceInclVat')}</Label>
                <Input
                  type="number"
                  value={editValues.price ?? ''}
                  onChange={(e) => setEditValues((v) => ({ ...v, price: Number(e.target.value) }))}
                />
              </div>
            ) : (
              <DetailRow label={t('packages.create.priceInclVat')} value={formatCurrency(pkg.price)} />
            )}
          </CardContent>
        </Card>

        {/* Term */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('packages.create.termSettings')}
              section="term"
              initialValues={{ term_days: pkg.term_days, expiration_days: pkg.expiration_days, sessions: pkg.sessions }}
            />
          </CardHeader>
          <CardContent>
            {editingSection === 'term' ? (
              <div className="space-y-3">
                <div>
                  <Label>{t('packages.create.packageDuration')}</Label>
                  <Input
                    type="number"
                    value={editValues.term_days ?? ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, term_days: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>{t('packages.create.packageExpiration')}</Label>
                  <Input
                    type="number"
                    value={editValues.expiration_days ?? ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, expiration_days: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>{t('packages.sessions')}</Label>
                  <Input
                    type="number"
                    value={editValues.sessions ?? ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, sessions: e.target.value ? Number(e.target.value) : null }))}
                  />
                </div>
              </div>
            ) : (
              <>
                <DetailRow label={t('packages.create.packageDuration')} value={`${pkg.term_days} ${t('packages.details.days')}`} />
                <DetailRow label={t('packages.create.packageExpiration')} value={`${pkg.expiration_days} ${t('packages.details.days')}`} />
                <DetailRow label={t('packages.sessions')} value={pkg.sessions ?? '-'} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Recurring */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('packages.create.recurringPayment')}
              section="recurring"
              initialValues={{ recurring_payment: pkg.recurring_payment }}
            />
          </CardHeader>
          <CardContent>
            {editingSection === 'recurring' ? (
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!editValues.recurring_payment}
                  onCheckedChange={(checked) => setEditValues((v) => ({ ...v, recurring_payment: checked }))}
                />
                <Label>{editValues.recurring_payment ? t('common.active') : t('common.inactive')}</Label>
              </div>
            ) : (
              <DetailRow
                label={t('packages.create.recurringPayment')}
                value={pkg.recurring_payment ? t('common.active') : t('common.inactive')}
              />
            )}
          </CardContent>
        </Card>

        {/* Quantity */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('packages.create.quantity')}
              section="quantity"
              initialValues={{
                infinite_quantity: pkg.infinite_quantity,
                quantity: pkg.quantity,
                infinite_purchase_limit: pkg.infinite_purchase_limit,
                user_purchase_limit: pkg.user_purchase_limit,
              }}
            />
          </CardHeader>
          <CardContent>
            {editingSection === 'quantity' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!editValues.infinite_quantity}
                    onCheckedChange={(checked) => setEditValues((v) => ({ ...v, infinite_quantity: checked, quantity: checked ? null : v.quantity }))}
                  />
                  <Label>{t('packages.create.infinite')}</Label>
                </div>
                {!editValues.infinite_quantity && (
                  <div>
                    <Label>{t('packages.create.specificAmount')}</Label>
                    <Input
                      type="number"
                      value={editValues.quantity ?? ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, quantity: Number(e.target.value) }))}
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!editValues.infinite_purchase_limit}
                    onCheckedChange={(checked) => setEditValues((v) => ({ ...v, infinite_purchase_limit: checked, user_purchase_limit: checked ? null : v.user_purchase_limit }))}
                  />
                  <Label>{t('packages.details.noPurchaseLimit')}</Label>
                </div>
                {!editValues.infinite_purchase_limit && (
                  <div>
                    <Label>{t('packages.create.userPurchaseLimit')}</Label>
                    <Input
                      type="number"
                      value={editValues.user_purchase_limit ?? ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, user_purchase_limit: Number(e.target.value) }))}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <DetailRow
                  label={t('packages.create.quantity')}
                  value={pkg.infinite_quantity ? t('packages.create.infinite') : (pkg.quantity ?? '-')}
                />
                <DetailRow
                  label={t('packages.create.userPurchaseLimit')}
                  value={pkg.infinite_purchase_limit ? t('packages.details.noPurchaseLimit') : (pkg.user_purchase_limit ?? '-')}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Access */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('packages.create.accessSettings')}
              section="access"
              initialValues={{
                usage_type: pkg.usage_type,
                all_categories: pkg.all_categories,
                any_day_any_time: pkg.any_day_any_time,
              }}
            />
          </CardHeader>
          <CardContent>
            {editingSection === 'access' ? (
              <div className="space-y-3">
                <div>
                  <Label>{t('packages.create.usageType')}</Label>
                  <Select
                    value={(editValues.usage_type as string) || 'both'}
                    onValueChange={(val) => setEditValues((v) => ({ ...v, usage_type: val as 'class_only' | 'gym_checkin_only' | 'both' }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class_only">{t('packages.create.classOnly')}</SelectItem>
                      <SelectItem value="gym_checkin_only">{t('packages.create.gymCheckinOnly')}</SelectItem>
                      <SelectItem value="both">{t('packages.create.both')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!editValues.all_categories}
                    onCheckedChange={(checked) => setEditValues((v) => ({ ...v, all_categories: checked }))}
                  />
                  <Label>{t('packages.create.allCategories')}</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!editValues.any_day_any_time}
                    onCheckedChange={(checked) => setEditValues((v) => ({ ...v, any_day_any_time: checked }))}
                  />
                  <Label>{t('packages.create.anyDayAnyTime')}</Label>
                </div>
              </div>
            ) : (
              <>
                <DetailRow label={t('packages.create.usageType')} value={getUsageTypeLabel(pkg.usage_type)} />
                <DetailRow label={t('packages.create.classCategories')} value={pkg.all_categories ? t('packages.create.allCategories') : (pkg.categories?.join(', ') || '-')} />
                <DetailRow label={t('packages.create.accessDays')} value={pkg.any_day_any_time ? t('packages.create.anyDayAnyTime') : t('packages.create.specificDays')} />
                <DetailRow label={t('packages.details.accessLocations')} value={pkg.all_locations ? t('packages.create.allLocations') : (accessLocationNames || '-')} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('packages.create.description')}
              section="description"
              initialValues={{ description_en: pkg.description_en, description_th: pkg.description_th }}
            />
          </CardHeader>
          <CardContent>
            {editingSection === 'description' ? (
              <div className="space-y-3">
                <div>
                  <Label>{t('packages.create.descriptionEn')}</Label>
                  <Textarea
                    value={(editValues.description_en as string) || ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, description_en: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>{t('packages.create.descriptionTh')}</Label>
                  <Textarea
                    value={(editValues.description_th as string) || ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, description_th: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <>
                <DetailRow label="EN" value={pkg.description_en || '-'} />
                <DetailRow label="TH" value={pkg.description_th || '-'} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Distribution / Status */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('packages.details.distribution')}
              section="distribution"
              initialValues={{ status: pkg.status, is_popular: pkg.is_popular }}
            />
          </CardHeader>
          <CardContent>
            {editingSection === 'distribution' ? (
              <div className="space-y-3">
                <div>
                  <Label>{t('common.status')}</Label>
                  <Select
                    value={(editValues.status as string) || 'drafts'}
                    onValueChange={(val) => setEditValues((v) => ({ ...v, status: val as 'on_sale' | 'scheduled' | 'drafts' | 'archive' }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_sale">{t('packages.onSale')}</SelectItem>
                      <SelectItem value="scheduled">{t('packages.scheduled')}</SelectItem>
                      <SelectItem value="drafts">{t('packages.drafts')}</SelectItem>
                      <SelectItem value="archive">{t('packages.archive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!editValues.is_popular}
                    onCheckedChange={(checked) => setEditValues((v) => ({ ...v, is_popular: checked }))}
                  />
                  <Label>{t('packages.popular')}</Label>
                </div>
              </div>
            ) : (
              <>
                <DetailRow label={t('common.status')} value={
                  <StatusBadge variant={getStatusBadgeVariant(pkg.status)}>
                    {getStatusLabel(pkg.status)}
                  </StatusBadge>
                } />
                <DetailRow label={t('packages.popular')} value={pkg.is_popular ? '⭐' : '-'} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PackageDetails;
