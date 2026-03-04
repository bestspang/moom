import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Infinity, Timer, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCreatePackage } from '@/hooks/usePackages';
import { useLocations } from '@/hooks/useLocations';
import { useClassCategories } from '@/hooks/useClassCategories';
import { toast } from 'sonner';

const DRAFT_KEY = 'package-create-draft';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const accessDaySchema = z.object({
  day: z.string(),
  start_time: z.string().default('06:00'),
  end_time: z.string().default('22:00'),
});

const createPackageSchema = z.object({
  packageType: z.enum(['unlimited', 'session', 'pt']),
  nameEn: z.string().min(1, 'Package name is required'),
  nameTh: z.string().optional().default(''),
  price: z.string().min(1, 'Price is required'),
  duration: z.string().min(1, 'Duration is required'),
  expiration: z.string().min(1, 'Expiration is required'),
  sessions: z.string().optional().default(''),
  recurringPayment: z.boolean().default(false),
  quantityType: z.enum(['infinite', 'specific']).default('infinite'),
  quantity: z.string().optional().default(''),
  purchaseLimitType: z.enum(['infinite', 'specific']).default('infinite'),
  purchaseLimit: z.string().optional().default(''),
  usageType: z.enum(['class_only', 'gym_only', 'both']).default('both'),
  categoryType: z.enum(['all', 'specific']).default('all'),
  selectedCategories: z.array(z.string()).default([]),
  locationMode: z.enum(['all', 'specific']).default('all'),
  selectedLocations: z.array(z.string()).default([]),
  accessType: z.enum(['any', 'specific']).default('any'),
  accessDays: z.array(accessDaySchema).default([]),
  descriptionEn: z.string().optional().default(''),
  descriptionTh: z.string().optional().default(''),
  distribution: z.enum(['sell_now', 'scheduled', 'draft']).default('sell_now'),
  scheduleStartAt: z.string().optional().default(''),
  scheduleEndAt: z.string().optional().default(''),
});

type FormValues = z.infer<typeof createPackageSchema>;

const defaultValues: FormValues = {
  packageType: 'unlimited',
  nameEn: '',
  nameTh: '',
  price: '',
  duration: '',
  expiration: '',
  sessions: '',
  recurringPayment: false,
  quantityType: 'infinite',
  quantity: '',
  purchaseLimitType: 'infinite',
  purchaseLimit: '',
  usageType: 'both',
  categoryType: 'all',
  selectedCategories: [],
  locationMode: 'all',
  selectedLocations: [],
  accessType: 'any',
  accessDays: [],
  descriptionEn: '',
  descriptionTh: '',
  distribution: 'sell_now',
  scheduleStartAt: '',
  scheduleEndAt: '',
};

const CreatePackage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const createPackage = useCreatePackage();
  const { data: locations } = useLocations();
  const { data: classCategories } = useClassCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(createPackageSchema),
    defaultValues,
  });

  const { control, watch, reset, handleSubmit, setValue, formState: { errors } } = form;
  const watchAll = watch();

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        reset({ ...defaultValues, ...parsed });
        toast.info(t('packages.create.draftRestored'));
      }
    } catch {
      // ignore
    }
  }, []);

  // Autosave draft (debounced 1s)
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(watchAll));
      } catch {
        // ignore
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [watchAll]);

  const handleDiscard = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    reset(defaultValues);
    toast.success(t('packages.create.draftDiscarded'));
  }, [reset, t]);

  const mapUsageType = (usageType: string): 'class_only' | 'gym_checkin_only' | 'both' => {
    switch (usageType) {
      case 'class_only': return 'class_only';
      case 'gym_only': return 'gym_checkin_only';
      case 'both': return 'both';
      default: return 'both';
    }
  };

  const getStatusFromDistribution = (dist: string): 'on_sale' | 'scheduled' | 'drafts' => {
    switch (dist) {
      case 'sell_now': return 'on_sale';
      case 'scheduled': return 'scheduled';
      case 'draft': return 'drafts';
      default: return 'on_sale';
    }
  };

  const onSubmit = async (data: FormValues) => {
    const accessDaysJson = data.accessType === 'specific' ? data.accessDays : [];

    const packageData: any = {
      name_en: data.nameEn,
      name_th: data.nameTh || null,
      type: data.packageType,
      price: parseFloat(data.price),
      term_days: parseInt(data.duration),
      expiration_days: parseInt(data.expiration),
      sessions: data.packageType !== 'unlimited' && data.sessions ? parseInt(data.sessions) : null,
      recurring_payment: data.recurringPayment,
      infinite_quantity: data.quantityType === 'infinite',
      quantity: data.quantityType === 'specific' && data.quantity ? parseInt(data.quantity) : null,
      infinite_purchase_limit: data.purchaseLimitType === 'infinite',
      user_purchase_limit: data.purchaseLimitType === 'specific' && data.purchaseLimit ? parseInt(data.purchaseLimit) : null,
      usage_type: mapUsageType(data.usageType),
      all_categories: data.categoryType === 'all',
      categories: data.categoryType === 'specific' ? data.selectedCategories : [],
      any_day_any_time: data.accessType === 'any',
      access_days: accessDaysJson,
      all_locations: data.locationMode === 'all',
      access_locations: data.locationMode === 'specific' ? data.selectedLocations : [],
      description_en: data.descriptionEn || null,
      description_th: data.descriptionTh || null,
      status: getStatusFromDistribution(data.distribution),
      schedule_start_at: data.distribution === 'scheduled' && data.scheduleStartAt ? data.scheduleStartAt : null,
      schedule_end_at: data.distribution === 'scheduled' && data.scheduleEndAt ? data.scheduleEndAt : null,
    };

    createPackage.mutate(packageData, {
      onSuccess: () => {
        localStorage.removeItem(DRAFT_KEY);
        navigate('/package');
      },
    });
  };

  const packageTypes = [
    { type: 'unlimited' as const, icon: Infinity, title: t('packages.unlimited'), description: t('packages.create.unlimitedDesc') },
    { type: 'session' as const, icon: Timer, title: t('packages.session'), description: t('packages.create.sessionDesc') },
    { type: 'pt' as const, icon: User, title: t('packages.pt'), description: t('packages.create.ptDesc') },
  ];

  const toggleArrayItem = (field: 'selectedCategories' | 'selectedLocations', item: string) => {
    const current = watchAll[field] || [];
    if (current.includes(item)) {
      setValue(field, current.filter((i: string) => i !== item));
    } else {
      setValue(field, [...current, item]);
    }
  };

  const toggleAccessDay = (day: string) => {
    const current = watchAll.accessDays || [];
    const exists = current.find((d) => d.day === day);
    if (exists) {
      setValue('accessDays', current.filter((d) => d.day !== day));
    } else {
      setValue('accessDays', [...current, { day, start_time: '06:00', end_time: '22:00' }]);
    }
  };

  const updateAccessDayTime = (day: string, field: 'start_time' | 'end_time', value: string) => {
    const current = watchAll.accessDays || [];
    setValue('accessDays', current.map((d) => d.day === day ? { ...d, [field]: value } : d));
  };

  const isFormValid = watchAll.nameEn && watchAll.price && watchAll.duration && watchAll.expiration;

  return (
    <div>
      <PageHeader
        title={t('packages.create.title')}
        breadcrumbs={[
          { label: t('nav.package') },
          { label: t('packages.title'), href: '/package' },
          { label: t('packages.create.title') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDiscard}>
              <Trash2 className="h-4 w-4 mr-1" />
              {t('packages.create.discardDraft')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/package')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package type selection */}
            <Card>
              <CardHeader>
                <CardTitle>{t('packages.create.selectType')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {packageTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.type}
                        type="button"
                        onClick={() => setValue('packageType', type.type)}
                        className={cn(
                          'p-4 border rounded-lg text-left transition-colors',
                          watchAll.packageType === type.type
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Icon className="h-6 w-6 mb-2 text-primary" />
                        <h3 className="font-semibold">{type.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Package details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('packages.create.packageDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('packages.create.packageNameEn')} *</Label>
                    <Controller
                      control={control}
                      name="nameEn"
                      render={({ field }) => (
                        <Input {...field} placeholder={t('packages.create.packageNamePlaceholder')} />
                      )}
                    />
                    {errors.nameEn && <p className="text-sm text-destructive mt-1">{errors.nameEn.message}</p>}
                  </div>
                  <div>
                    <Label>{t('packages.create.packageNameTh')}</Label>
                    <Controller
                      control={control}
                      name="nameTh"
                      render={({ field }) => <Input {...field} placeholder="ชื่อแพ็คเกจ" />}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price */}
            <Card>
              <CardHeader>
                <CardTitle>{t('packages.create.price')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>{t('packages.create.priceInclVat')} *</Label>
                  <div className="relative">
                    <Controller
                      control={control}
                      name="price"
                      render={({ field }) => (
                        <Input {...field} type="number" className="pr-12" placeholder="0" />
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">THB</span>
                  </div>
                  {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Term */}
            <Card>
              <CardHeader>
                <CardTitle>{t('packages.create.termSettings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('packages.create.packageDuration')} *</Label>
                    <div className="flex items-center gap-2">
                      <Controller
                        control={control}
                        name="duration"
                        render={({ field }) => <Input {...field} type="number" placeholder="30" />}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{t('packages.create.daysAfterActivation')}</span>
                    </div>
                  </div>
                  <div>
                    <Label>{t('packages.create.packageExpiration')} *</Label>
                    <div className="flex items-center gap-2">
                      <Controller
                        control={control}
                        name="expiration"
                        render={({ field }) => <Input {...field} type="number" placeholder="90" />}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{t('packages.create.daysAfterSale')}</span>
                    </div>
                  </div>
                </div>

                {watchAll.packageType !== 'unlimited' && (
                  <div>
                    <Label>{t('packages.sessions')} *</Label>
                    <Controller
                      control={control}
                      name="sessions"
                      render={({ field }) => <Input {...field} type="number" placeholder="10" />}
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('packages.create.recurringPayment')}</Label>
                    <p className="text-sm text-muted-foreground">Enable automatic recurring payments</p>
                  </div>
                  <Controller
                    control={control}
                    name="recurringPayment"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quantity */}
            <Card>
              <CardHeader>
                <CardTitle>{t('packages.create.quantity')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={control}
                  name="quantityType"
                  render={({ field }) => (
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="infinite" id="qty-infinite" />
                        <Label htmlFor="qty-infinite">{t('packages.create.infinite')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="specific" id="qty-specific" />
                        <Label htmlFor="qty-specific">{t('packages.create.specificAmount')}</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                {watchAll.quantityType === 'specific' && (
                  <Controller
                    control={control}
                    name="quantity"
                    render={({ field }) => <Input {...field} type="number" placeholder="100" />}
                  />
                )}

                <Separator />

                <div>
                  <Label className="mb-2 block">{t('packages.create.userPurchaseLimit')}</Label>
                  <Controller
                    control={control}
                    name="purchaseLimitType"
                    render={({ field }) => (
                      <RadioGroup value={field.value} onValueChange={field.onChange}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="infinite" id="limit-infinite" />
                          <Label htmlFor="limit-infinite">{t('packages.create.infinite')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="specific" id="limit-specific" />
                          <Label htmlFor="limit-specific">{t('packages.create.specificAmount')}</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {watchAll.purchaseLimitType === 'specific' && (
                    <Controller
                      control={control}
                      name="purchaseLimit"
                      render={({ field }) => <Input {...field} type="number" placeholder="1" className="mt-2" />}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Access */}
            <Card>
              <CardHeader>
                <CardTitle>{t('packages.create.accessSettings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Usage type */}
                <div>
                  <Label className="mb-2 block">{t('packages.create.usageType')} *</Label>
                  <Controller
                    control={control}
                    name="usageType"
                    render={({ field }) => (
                      <RadioGroup value={field.value} onValueChange={field.onChange}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="class_only" id="usage-class" />
                          <Label htmlFor="usage-class">{t('packages.create.classOnly')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gym_only" id="usage-gym" />
                          <Label htmlFor="usage-gym">{t('packages.create.gymCheckinOnly')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="both" id="usage-both" />
                          <Label htmlFor="usage-both">{t('packages.create.both')}</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                <Separator />

                {/* Access Locations */}
                <div>
                  <Label className="mb-2 block">{t('packages.create.accessLocations')} *</Label>
                  <Controller
                    control={control}
                    name="locationMode"
                    render={({ field }) => (
                      <RadioGroup value={field.value} onValueChange={field.onChange}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="loc-all" />
                          <Label htmlFor="loc-all">{t('packages.create.allLocations')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="specific" id="loc-specific" />
                          <Label htmlFor="loc-specific">{t('packages.create.specificLocations')}</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {watchAll.locationMode === 'specific' && locations && (
                    <div className="mt-3 space-y-2 pl-6">
                      {locations.map((loc) => (
                        <div key={loc.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`loc-${loc.id}`}
                            checked={(watchAll.selectedLocations || []).includes(loc.id)}
                            onCheckedChange={() => toggleArrayItem('selectedLocations', loc.id)}
                          />
                          <Label htmlFor={`loc-${loc.id}`} className="font-normal">{loc.name}</Label>
                        </div>
                      ))}
                      {locations.length === 0 && (
                        <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Class categories */}
                <div>
                  <Label className="mb-2 block">{t('packages.create.classCategories')} *</Label>
                  <Controller
                    control={control}
                    name="categoryType"
                    render={({ field }) => (
                      <RadioGroup value={field.value} onValueChange={field.onChange}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="cat-all" />
                          <Label htmlFor="cat-all">{t('packages.create.allCategories')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="specific" id="cat-specific" />
                          <Label htmlFor="cat-specific">{t('packages.create.specificCategories')}</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {watchAll.categoryType === 'specific' && classCategories && (
                    <div className="mt-3 space-y-2 pl-6">
                      {classCategories.map((cat) => (
                        <div key={cat.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cat-${cat.id}`}
                            checked={(watchAll.selectedCategories || []).includes(cat.name)}
                            onCheckedChange={() => toggleArrayItem('selectedCategories', cat.name)}
                          />
                          <Label htmlFor={`cat-${cat.id}`} className="font-normal">{cat.name}</Label>
                        </div>
                      ))}
                      {classCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Access days & times */}
                <div>
                  <Label className="mb-2 block">{t('packages.create.accessDays')} *</Label>
                  <Controller
                    control={control}
                    name="accessType"
                    render={({ field }) => (
                      <RadioGroup value={field.value} onValueChange={field.onChange}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="any" id="access-any" />
                          <Label htmlFor="access-any">{t('packages.create.anyDayAnyTime')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="specific" id="access-specific" />
                          <Label htmlFor="access-specific">{t('packages.create.specificDays')}</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {watchAll.accessType === 'specific' && (
                    <div className="mt-3 space-y-3 pl-6">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = (watchAll.accessDays || []).some((d) => d.day === day);
                        const dayData = (watchAll.accessDays || []).find((d) => d.day === day);
                        return (
                          <div key={day} className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`day-${day}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleAccessDay(day)}
                              />
                              <Label htmlFor={`day-${day}`} className="font-normal capitalize">{day}</Label>
                            </div>
                            {isSelected && dayData && (
                              <div className="flex items-center gap-2 pl-6">
                                <Input
                                  type="time"
                                  value={dayData.start_time}
                                  onChange={(e) => updateAccessDayTime(day, 'start_time', e.target.value)}
                                  className="w-32"
                                />
                                <span className="text-muted-foreground">—</span>
                                <Input
                                  type="time"
                                  value={dayData.end_time}
                                  onChange={(e) => updateAccessDayTime(day, 'end_time', e.target.value)}
                                  className="w-32"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>{t('packages.create.description')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('packages.create.descriptionEn')}</Label>
                  <Controller
                    control={control}
                    name="descriptionEn"
                    render={({ field }) => (
                      <Textarea {...field} maxLength={250} placeholder={t('packages.create.descriptionPlaceholder')} />
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{(watchAll.descriptionEn || '').length}/250</p>
                </div>
                <div>
                  <Label>{t('packages.create.descriptionTh')}</Label>
                  <Controller
                    control={control}
                    name="descriptionTh"
                    render={({ field }) => (
                      <Textarea {...field} maxLength={250} placeholder={t('packages.create.descriptionThPlaceholder')} />
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{(watchAll.descriptionTh || '').length}/250</p>
                </div>
              </CardContent>
            </Card>

            {/* Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t('packages.create.distributionTitle')}</CardTitle>
                <CardDescription>{t('packages.create.distributionDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={control}
                  name="distribution"
                  render={({ field }) => (
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sell_now" id="dist-sell" />
                        <Label htmlFor="dist-sell">{t('packages.create.sellNow')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="scheduled" id="dist-scheduled" />
                        <Label htmlFor="dist-scheduled">{t('packages.create.scheduledSale')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="draft" id="dist-draft" />
                        <Label htmlFor="dist-draft">{t('packages.create.saveAsDraft')}</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                {watchAll.distribution === 'scheduled' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label>{t('packages.create.scheduleStart')}</Label>
                      <Controller
                        control={control}
                        name="scheduleStartAt"
                        render={({ field }) => (
                          <Input {...field} type="datetime-local" />
                        )}
                      />
                    </div>
                    <div>
                      <Label>{t('packages.create.scheduleEnd')}</Label>
                      <Controller
                        control={control}
                        name="scheduleEndAt"
                        render={({ field }) => (
                          <Input {...field} type="datetime-local" />
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Assist (Coming Soon) */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {t('packages.create.aiAssist')}
                  <Badge variant="secondary" className="ml-2">{t('packages.create.comingSoon')}</Badge>
                </CardTitle>
                <CardDescription>{t('packages.create.aiAssistDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {t('packages.create.aiTagsPlaceholder')}
                </div>
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {t('packages.create.aiPricePlaceholder')}
                </div>
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {t('packages.create.aiCopyPlaceholder')}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('packages.create.completeRequired')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button variant="link" type="button" onClick={() => navigate('/package')}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid || createPackage.isPending}
                  >
                    {createPackage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t('packages.create.createPackage')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview sidebar */}
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>{t('packages.create.preview')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <PreviewRow label="Package name" value={watchAll.nameEn || '-'} />
                <PreviewRow label="Price" value={watchAll.price ? `฿${watchAll.price}` : '-'} />
                <PreviewRow label="Type" value={watchAll.packageType} />
                <PreviewRow label="Term" value={watchAll.duration ? `${watchAll.duration} days` : '-'} />
                <PreviewRow label="Expiration" value={watchAll.expiration ? `${watchAll.expiration} days` : '-'} />
                {watchAll.packageType !== 'unlimited' && (
                  <PreviewRow label="Sessions" value={watchAll.sessions || '-'} />
                )}
                <PreviewRow label="Recurring" value={watchAll.recurringPayment ? 'Yes' : 'No'} />
                <PreviewRow
                  label="Quantity"
                  value={watchAll.quantityType === 'infinite' ? 'Infinite' : watchAll.quantity || '-'}
                />
                <PreviewRow label="Access" value={watchAll.usageType.replace('_', ' ')} />

                <Separator />

                <PreviewRow
                  label="Locations"
                  value={
                    watchAll.locationMode === 'all'
                      ? t('packages.create.allLocations')
                      : watchAll.selectedLocations?.length
                        ? `${watchAll.selectedLocations.length} selected`
                        : '-'
                  }
                />
                <PreviewRow
                  label="Categories"
                  value={
                    watchAll.categoryType === 'all'
                      ? t('packages.create.allCategories')
                      : watchAll.selectedCategories?.length
                        ? `${watchAll.selectedCategories.length} selected`
                        : '-'
                  }
                />
                <PreviewRow
                  label="Access days"
                  value={
                    watchAll.accessType === 'any'
                      ? t('packages.create.anyDayAnyTime')
                      : watchAll.accessDays?.length
                        ? `${watchAll.accessDays.length} days`
                        : '-'
                  }
                />

                <Separator />

                <PreviewRow
                  label="Distribution"
                  value={
                    watchAll.distribution === 'sell_now'
                      ? t('packages.create.sellNow')
                      : watchAll.distribution === 'scheduled'
                        ? t('packages.create.scheduledSale')
                        : t('packages.create.saveAsDraft')
                  }
                />
                {watchAll.distribution === 'scheduled' && watchAll.scheduleStartAt && (
                  <PreviewRow label="Start" value={new Date(watchAll.scheduleStartAt).toLocaleDateString()} />
                )}
                {watchAll.distribution === 'scheduled' && watchAll.scheduleEndAt && (
                  <PreviewRow label="End" value={new Date(watchAll.scheduleEndAt).toLocaleDateString()} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

const PreviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium capitalize text-right max-w-[60%] truncate">{value}</span>
  </div>
);

export default CreatePackage;
