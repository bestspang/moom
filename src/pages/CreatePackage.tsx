import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Infinity, Timer, User, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCreatePackage } from '@/hooks/usePackages';
import type { TablesInsert } from '@/integrations/supabase/types';

type PackageType = 'unlimited' | 'session' | 'pt';

const CreatePackage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const createPackage = useCreatePackage();

  const [packageType, setPackageType] = useState<PackageType>('unlimited');
  const [formData, setFormData] = useState({
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
    accessType: 'any',
    descriptionEn: '',
    descriptionTh: '',
  });

  const packageTypes = [
    {
      type: 'unlimited' as const,
      icon: Infinity,
      title: t('packages.unlimited'),
      description: t('packages.create.unlimitedDesc'),
    },
    {
      type: 'session' as const,
      icon: Timer,
      title: t('packages.session'),
      description: t('packages.create.sessionDesc'),
    },
    {
      type: 'pt' as const,
      icon: User,
      title: t('packages.pt'),
      description: t('packages.create.ptDesc'),
    },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const mapUsageType = (usageType: string): 'class_only' | 'gym_checkin_only' | 'both' => {
    switch (usageType) {
      case 'class_only': return 'class_only';
      case 'gym_only': return 'gym_checkin_only';
      case 'both': return 'both';
      default: return 'both';
    }
  };

  const handleSubmit = async (status: 'drafts' | 'on_sale') => {
    if (!formData.nameEn || !formData.price || !formData.duration || !formData.expiration) {
      return;
    }

    const packageData: TablesInsert<'packages'> = {
      name_en: formData.nameEn,
      name_th: formData.nameTh || null,
      type: packageType,
      price: parseFloat(formData.price),
      term_days: parseInt(formData.duration),
      expiration_days: parseInt(formData.expiration),
      sessions: packageType !== 'unlimited' && formData.sessions ? parseInt(formData.sessions) : null,
      recurring_payment: formData.recurringPayment,
      infinite_quantity: formData.quantityType === 'infinite',
      quantity: formData.quantityType === 'specific' && formData.quantity ? parseInt(formData.quantity) : null,
      infinite_purchase_limit: formData.purchaseLimitType === 'infinite',
      user_purchase_limit: formData.purchaseLimitType === 'specific' && formData.purchaseLimit ? parseInt(formData.purchaseLimit) : null,
      usage_type: mapUsageType(formData.usageType),
      all_categories: formData.categoryType === 'all',
      any_day_any_time: formData.accessType === 'any',
      description_en: formData.descriptionEn || null,
      description_th: formData.descriptionTh || null,
      status: status,
    };

    createPackage.mutate(packageData, {
      onSuccess: () => {
        navigate('/package');
      },
    });
  };

  const isFormValid = formData.nameEn && formData.price && formData.duration && formData.expiration;

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
          <Button variant="outline" onClick={() => navigate('/package')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        }
      />

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
                      onClick={() => setPackageType(type.type)}
                      className={cn(
                        'p-4 border rounded-lg text-left transition-colors',
                        packageType === type.type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Icon className="h-6 w-6 mb-2 text-primary" />
                      <h3 className="font-semibold">{type.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
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
                  <Input
                    value={formData.nameEn}
                    onChange={(e) => handleInputChange('nameEn', e.target.value)}
                    placeholder={t('packages.create.packageNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label>{t('packages.create.packageNameTh')}</Label>
                  <Input
                    value={formData.nameTh}
                    onChange={(e) => handleInputChange('nameTh', e.target.value)}
                    placeholder="ชื่อแพ็คเกจ"
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
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="pr-12"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    THB
                  </span>
                </div>
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
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="30"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {t('packages.create.daysAfterActivation')}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>{t('packages.create.packageExpiration')} *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={formData.expiration}
                      onChange={(e) => handleInputChange('expiration', e.target.value)}
                      placeholder="90"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {t('packages.create.daysAfterSale')}
                    </span>
                  </div>
                </div>
              </div>

              {packageType !== 'unlimited' && (
                <div>
                  <Label>{t('packages.sessions')} *</Label>
                  <Input
                    type="number"
                    value={formData.sessions}
                    onChange={(e) => handleInputChange('sessions', e.target.value)}
                    placeholder="10"
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('packages.create.recurringPayment')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic recurring payments
                  </p>
                </div>
                <Switch
                  checked={formData.recurringPayment}
                  onCheckedChange={(checked) =>
                    handleInputChange('recurringPayment', checked)
                  }
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
              <RadioGroup
                value={formData.quantityType}
                onValueChange={(v) => handleInputChange('quantityType', v)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="infinite" id="qty-infinite" />
                  <Label htmlFor="qty-infinite">{t('packages.create.infinite')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="qty-specific" />
                  <Label htmlFor="qty-specific">
                    {t('packages.create.specificAmount')}
                  </Label>
                </div>
              </RadioGroup>
              {formData.quantityType === 'specific' && (
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="100"
                />
              )}

              <Separator />

              <div>
                <Label className="mb-2 block">
                  {t('packages.create.userPurchaseLimit')}
                </Label>
                <RadioGroup
                  value={formData.purchaseLimitType}
                  onValueChange={(v) => handleInputChange('purchaseLimitType', v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="infinite" id="limit-infinite" />
                    <Label htmlFor="limit-infinite">{t('packages.create.infinite')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="limit-specific" />
                    <Label htmlFor="limit-specific">
                      {t('packages.create.specificAmount')}
                    </Label>
                  </div>
                </RadioGroup>
                {formData.purchaseLimitType === 'specific' && (
                  <Input
                    type="number"
                    value={formData.purchaseLimit}
                    onChange={(e) => handleInputChange('purchaseLimit', e.target.value)}
                    placeholder="1"
                    className="mt-2"
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
              <div>
                <Label className="mb-2 block">{t('packages.create.usageType')} *</Label>
                <RadioGroup
                  value={formData.usageType}
                  onValueChange={(v) => handleInputChange('usageType', v)}
                >
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
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block">
                  {t('packages.create.classCategories')} *
                </Label>
                <RadioGroup
                  value={formData.categoryType}
                  onValueChange={(v) => handleInputChange('categoryType', v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="cat-all" />
                    <Label htmlFor="cat-all">{t('packages.create.allCategories')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="cat-specific" />
                    <Label htmlFor="cat-specific">
                      {t('packages.create.specificCategories')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block">{t('packages.create.accessDays')} *</Label>
                <RadioGroup
                  value={formData.accessType}
                  onValueChange={(v) => handleInputChange('accessType', v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="access-any" />
                    <Label htmlFor="access-any">{t('packages.create.anyDayAnyTime')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="access-specific" />
                    <Label htmlFor="access-specific">
                      {t('packages.create.specificDays')}
                    </Label>
                  </div>
                </RadioGroup>
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
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => handleInputChange('descriptionEn', e.target.value)}
                  maxLength={250}
                  placeholder={t('packages.create.descriptionPlaceholder')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.descriptionEn.length}/250
                </p>
              </div>
              <div>
                <Label>{t('packages.create.descriptionTh')}</Label>
                <Textarea
                  value={formData.descriptionTh}
                  onChange={(e) => handleInputChange('descriptionTh', e.target.value)}
                  maxLength={250}
                  placeholder="คำอธิบายแพ็คเกจ..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.descriptionTh.length}/250
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                {t('packages.create.completeRequired')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button variant="link" onClick={() => navigate('/package')}>
                  {t('packages.create.discard')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleSubmit('drafts')}
                  disabled={!isFormValid || createPackage.isPending}
                >
                  {createPackage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('packages.create.saveAsDraft')}
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary-hover"
                  onClick={() => handleSubmit('on_sale')}
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Package name</span>
                <span className="font-medium">{formData.nameEn || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">
                  {formData.price ? `฿${formData.price}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Term</span>
                <span className="font-medium">
                  {formData.duration ? `${formData.duration} days` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">
                  {formData.duration ? `${formData.duration} days` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiration</span>
                <span className="font-medium">
                  {formData.expiration ? `${formData.expiration} days` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recurring</span>
                <span className="font-medium">
                  {formData.recurringPayment ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">
                  {formData.quantityType === 'infinite'
                    ? 'Infinite'
                    : formData.quantity || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Access</span>
                <span className="font-medium capitalize">
                  {formData.usageType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categories</span>
                <span className="font-medium">
                  {formData.categoryType === 'all' ? 'All' : 'Specific'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Access days</span>
                <span className="font-medium">
                  {formData.accessType === 'any' ? 'Any day' : 'Specific'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatePackage;
