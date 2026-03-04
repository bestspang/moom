import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shuffle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreatePromotion } from '@/hooks/usePromotions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const promotionSchema = z.object({
  type: z.enum(['discount', 'promo_code']),
  name: z.string().min(1, 'Name is required'),
  name_th: z.string().optional(),
  description_en: z.string().optional(),
  description_th: z.string().optional(),
  promo_code: z.string().optional(),
  discount_mode: z.enum(['percentage', 'flat_rate']),
  percentage_discount: z.coerce.number().optional(),
  flat_rate_discount: z.coerce.number().optional(),
  same_discount_all_packages: z.boolean(),
  has_max_redemption: z.boolean(),
  max_redemption_value: z.coerce.number().optional(),
  has_min_price: z.boolean(),
  min_price_requirement: z.coerce.number().optional(),
  units_mode: z.enum(['infinite', 'specific']),
  available_units: z.coerce.number().optional(),
  per_user_mode: z.enum(['unlimited', 'one_time', 'multiple']),
  per_user_limit: z.coerce.number().optional(),
  usage_time_mode: z.enum(['any_day_any_time', 'specific_days_times']),
  start_mode: z.enum(['start_now', 'scheduled']),
  start_date: z.string().optional(),
  has_end_date: z.boolean(),
  end_date: z.string().optional(),
}).refine(
  (d) => d.type !== 'promo_code' || (d.promo_code && d.promo_code.length > 0),
  { message: 'Promo code is required', path: ['promo_code'] },
).refine(
  (d) => d.discount_mode !== 'percentage' || (d.percentage_discount != null && d.percentage_discount > 0),
  { message: 'Discount percentage is required', path: ['percentage_discount'] },
).refine(
  (d) => d.discount_mode !== 'flat_rate' || (d.flat_rate_discount != null && d.flat_rate_discount > 0),
  { message: 'Discount amount is required', path: ['flat_rate_discount'] },
);

type FormValues = z.infer<typeof promotionSchema>;

const CreatePromotion = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const createPromotion = useCreatePromotion();

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      type: 'discount',
      discount_mode: 'percentage',
      same_discount_all_packages: true,
      has_max_redemption: false,
      has_min_price: false,
      units_mode: 'infinite',
      per_user_mode: 'unlimited',
      usage_time_mode: 'any_day_any_time',
      start_mode: 'start_now',
      has_end_date: false,
    },
  });

  const promoType = watch('type');
  const discountMode = watch('discount_mode');
  const hasMaxRedemption = watch('has_max_redemption');
  const hasMinPrice = watch('has_min_price');
  const unitsMode = watch('units_mode');
  const perUserMode = watch('per_user_mode');
  const startMode = watch('start_mode');
  const hasEndDate = watch('has_end_date');

  const generatePromoCode = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];

    // Check uniqueness
    const { data } = await supabase.from('promotions').select('id').eq('promo_code', code).maybeSingle();
    if (data) {
      // Retry once
      code = '';
      for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
    }
    setValue('promo_code', code);
    toast.success(t('promotions.codeGenerated'));
  };

  const onSubmit = (data: FormValues, asDraft: boolean) => {
    // Determine status
    let status: 'drafts' | 'active' | 'scheduled' = 'drafts';
    if (!asDraft) {
      status = data.start_mode === 'scheduled' ? 'scheduled' : 'active';
    }

    // Map discount_value for backward compat
    const discountValue = data.discount_mode === 'percentage'
      ? (data.percentage_discount ?? 0)
      : (data.flat_rate_discount ?? 0);

    createPromotion.mutate(
      {
        name: data.name,
        type: data.type === 'promo_code' ? 'promo_code' : 'discount',
        discount_type: data.discount_mode,
        discount_value: discountValue,
        promo_code: data.type === 'promo_code' ? data.promo_code || null : null,
        start_date: data.start_mode === 'scheduled' ? data.start_date || null : new Date().toISOString(),
        end_date: data.has_end_date ? data.end_date || null : null,
        status,
        usage_limit: data.units_mode === 'specific' ? data.available_units || null : null,
      } as any,
      {
        onSuccess: () => {
          navigate('/promotion');
        },
      },
    );
  };

  return (
    <div>
      <PageHeader
        title={t('promotions.createPromotion')}
        breadcrumbs={[
          { label: t('nav.package'), href: '/package' },
          { label: t('promotions.title'), href: '/promotion' },
          { label: t('promotions.createPromotion') },
        ]}
      />

      <form className="space-y-6 max-w-2xl">
        {/* Promotion Type */}
        <Card>
          <CardHeader><CardTitle>{t('promotions.promotionType')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">{t('promotions.discountType')}</SelectItem>
                    <SelectItem value="promo_code">{t('promotions.promoCodeType')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {promoType === 'promo_code' && (
              <div className="space-y-2">
                <Label>{t('promotions.promoCode')}</Label>
                <div className="flex gap-2">
                  <Input {...register('promo_code')} placeholder="e.g. SUMMER25" className="font-mono uppercase" />
                  <Button type="button" variant="outline" size="icon" onClick={generatePromoCode}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                {errors.promo_code && <p className="text-sm text-destructive">{errors.promo_code.message}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Name & Description */}
        <Card>
          <CardHeader><CardTitle>{t('lobby.name')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('promotions.nameEn')}</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label>{t('promotions.nameTh')}</Label>
              <Input {...register('name_th')} />
            </div>
            <div>
              <Label>{t('promotions.descriptionEn')}</Label>
              <Textarea {...register('description_en')} rows={2} />
            </div>
            <div>
              <Label>{t('promotions.descriptionTh')}</Label>
              <Textarea {...register('description_th')} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Discount Settings */}
        <Card>
          <CardHeader><CardTitle>{t('promotions.discount')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="discount_mode"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>{t('promotions.discountMode')}</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">{t('promotions.percentage')}</SelectItem>
                      <SelectItem value="flat_rate">{t('promotions.flatRate')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            {discountMode === 'percentage' ? (
              <div>
                <Label>{t('promotions.percentageDiscount')} (%)</Label>
                <Input type="number" {...register('percentage_discount')} min={0} max={100} />
                {errors.percentage_discount && <p className="text-sm text-destructive">{errors.percentage_discount.message}</p>}
              </div>
            ) : (
              <div>
                <Label>{t('promotions.flatRateDiscount')} (THB)</Label>
                <Input type="number" {...register('flat_rate_discount')} min={0} />
                {errors.flat_rate_discount && <p className="text-sm text-destructive">{errors.flat_rate_discount.message}</p>}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Controller
                name="same_discount_all_packages"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label>{t('promotions.sameDiscountAllPackages')}</Label>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader><CardTitle>{t('promotions.usageLimit')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Max redemption */}
            <div className="flex items-center gap-3">
              <Controller
                name="has_max_redemption"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label>{t('promotions.hasMaxRedemption')}</Label>
            </div>
            {hasMaxRedemption && (
              <div>
                <Label>{t('promotions.maxRedemption')} (THB)</Label>
                <Input type="number" {...register('max_redemption_value')} min={0} />
              </div>
            )}

            {/* Min price */}
            <div className="flex items-center gap-3">
              <Controller
                name="has_min_price"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label>{t('promotions.hasMinPrice')}</Label>
            </div>
            {hasMinPrice && (
              <div>
                <Label>{t('promotions.minPrice')} (THB)</Label>
                <Input type="number" {...register('min_price_requirement')} min={0} />
              </div>
            )}

            {/* Units */}
            <Controller
              name="units_mode"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>{t('promotions.unitsMode')}</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infinite">{t('promotions.infinite')}</SelectItem>
                      <SelectItem value="specific">{t('promotions.specific')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            {unitsMode === 'specific' && (
              <div>
                <Label>{t('promotions.availableUnits')}</Label>
                <Input type="number" {...register('available_units')} min={1} />
              </div>
            )}

            {/* Per user */}
            <Controller
              name="per_user_mode"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>{t('promotions.perUserMode')}</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">{t('promotions.unlimited')}</SelectItem>
                      <SelectItem value="one_time">{t('promotions.oneTime')}</SelectItem>
                      <SelectItem value="multiple">{t('promotions.multiple')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            {perUserMode === 'multiple' && (
              <div>
                <Label>{t('promotions.perUserLimit')}</Label>
                <Input type="number" {...register('per_user_limit')} min={1} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader><CardTitle>{t('promotions.startMode')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="start_mode"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start_now">{t('promotions.startNow')}</SelectItem>
                    <SelectItem value="scheduled">{t('promotions.scheduled')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {startMode === 'scheduled' && (
              <div>
                <Label>{t('promotions.startAt')}</Label>
                <Input type="datetime-local" {...register('start_date')} />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Controller
                name="has_end_date"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label>{t('promotions.hasEndDate')}</Label>
            </div>
            {hasEndDate && (
              <div>
                <Label>{t('promotions.endAt')}</Label>
                <Input type="datetime-local" {...register('end_date')} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pb-12">
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            disabled={createPromotion.isPending}
          >
            {t('promotions.saveAsDraft')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, false))}
            disabled={createPromotion.isPending}
          >
            {t('promotions.publish')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePromotion;
