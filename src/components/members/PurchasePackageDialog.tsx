import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, Package, Banknote, CreditCard, QrCode, ArrowLeft, Check, Tag, Ticket, CircleDollarSign } from 'lucide-react';
import { usePackages } from '@/hooks/usePackages';
import { useAssignPackageToMember } from '@/hooks/useMemberDetails';
import { useLocations } from '@/hooks/useLocations';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface PurchasePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
}

type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'qr_promptpay';

const PAYMENT_METHODS: { value: PaymentMethod; icon: React.ReactNode; labelKey: string }[] = [
  { value: 'cash', icon: <Banknote className="h-4 w-4" />, labelKey: 'finance.cash' },
  { value: 'bank_transfer', icon: <Banknote className="h-4 w-4" />, labelKey: 'finance.bankTransfer' },
  { value: 'credit_card', icon: <CreditCard className="h-4 w-4" />, labelKey: 'finance.creditCard' },
  { value: 'qr_promptpay', icon: <QrCode className="h-4 w-4" />, labelKey: 'finance.promptpay' },
];

export const PurchasePackageDialog = ({ open, onOpenChange, memberId, memberName }: PurchasePackageDialogProps) => {
  const { t, language } = useLanguage();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [search, setSearch] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);

  // Step 2 state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [locationId, setLocationId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Discount state
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>('');
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [manualDiscount, setManualDiscount] = useState<number>(0);

  const { data: packages, isLoading } = usePackages('on_sale', search);
  const { data: locations } = useLocations('open');
  const assignMutation = useAssignPackageToMember();

  // Fetch active promotions
  const { data: promotions } = useQuery({
    queryKey: ['promotions-for-purchase'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch member's active coupons
  const { data: memberCoupons } = useQuery({
    queryKey: ['member-coupons-for-purchase', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_wallet')
        .select('*, coupon_template:coupon_templates(*)')
        .eq('member_id', memberId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!memberId,
  });

  const selectedPkg = useMemo(
    () => packages?.find((p) => p.id === selectedPkgId) || null,
    [packages, selectedPkgId]
  );

  const selectedLocation = useMemo(
    () => locations?.find((l) => l.id === locationId) || null,
    [locations, locationId]
  );

  const selectedPromotion = useMemo(
    () => promotions?.find((p) => p.id === selectedPromotionId) || null,
    [promotions, selectedPromotionId]
  );

  const selectedCoupon = useMemo(
    () => memberCoupons?.find((c) => c.id === selectedCouponId) || null,
    [memberCoupons, selectedCouponId]
  );

  // Calculate promotion discount
  const promotionDiscountAmount = useMemo(() => {
    if (!selectedPkg || !selectedPromotion) return 0;
    const price = selectedPkg.price;
    if (selectedPromotion.discount_type === 'percentage') {
      const pct = selectedPromotion.percentage_discount || selectedPromotion.discount_value || 0;
      const disc = Math.round(price * pct / 100);
      const max = selectedPromotion.max_redemption_value;
      return max ? Math.min(disc, max) : disc;
    }
    return selectedPromotion.flat_rate_discount || selectedPromotion.discount_value || 0;
  }, [selectedPkg, selectedPromotion]);

  // Calculate coupon discount
  const couponDiscountAmount = useMemo(() => {
    if (!selectedPkg || !selectedCoupon) return 0;
    const template = selectedCoupon.coupon_template as any;
    if (!template) return 0;
    const price = selectedPkg.price;
    if (template.discount_type === 'percentage') {
      const disc = Math.round(price * template.discount_value / 100);
      return template.max_discount ? Math.min(disc, template.max_discount) : disc;
    }
    return template.discount_value || 0;
  }, [selectedPkg, selectedCoupon]);

  // Total discount and VAT
  const discountBreakdown = useMemo(() => {
    if (!selectedPkg) return null;
    const originalPrice = selectedPkg.price;
    const totalDiscount = Math.min(promotionDiscountAmount + couponDiscountAmount + manualDiscount, originalPrice);
    const netPrice = originalPrice - totalDiscount;
    const exVat = Math.round((netPrice / 1.07) * 100) / 100;
    const vat = Math.round((netPrice - exVat) * 100) / 100;
    return { originalPrice, promotionDiscountAmount, couponDiscountAmount, manualDiscount: Math.min(manualDiscount, originalPrice), totalDiscount, netPrice, exVat, vat };
  }, [selectedPkg, promotionDiscountAmount, couponDiscountAmount, manualDiscount]);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'unlimited': return 'Unlimited';
      case 'session': return 'Session';
      case 'pt': return 'PT';
      default: return type;
    }
  };

  const handleConfirm = () => {
    if (!selectedPkg || !discountBreakdown) return;
    assignMutation.mutate(
      {
        memberId,
        memberName,
        pkg: {
          id: selectedPkg.id,
          name_en: selectedPkg.name_en,
          price: selectedPkg.price,
          sessions: selectedPkg.sessions,
          type: selectedPkg.type,
          term_days: selectedPkg.term_days,
        },
        paymentMethod,
        locationId: locationId || undefined,
        locationName: selectedLocation?.name,
        notes: notes || undefined,
        promotionId: selectedPromotionId || undefined,
        promotionDiscount: promotionDiscountAmount,
        couponWalletId: selectedCouponId || undefined,
        couponDiscount: couponDiscountAmount,
        manualDiscount: manualDiscount,
      },
      { onSuccess: () => resetAndClose() }
    );
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedPkgId(null);
    setSearch('');
    setPaymentMethod('cash');
    setLocationId('');
    setNotes('');
    setSelectedPromotionId('');
    setSelectedCouponId('');
    setManualDiscount(0);
    onOpenChange(false);
  };

  const stepLabels = [t('members.selectPackage'), t('members.paymentDetails'), t('members.purchaseSummary')];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('members.purchasePackage')}</DialogTitle>
          <p className="text-sm text-muted-foreground">{memberName}</p>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  s === step ? 'bg-primary text-primary-foreground' :
                  s < step ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {s < step ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground max-w-[60px] text-center leading-tight hidden sm:block">
                  {stepLabels[s - 1]}
                </span>
              </div>
              {s < 3 && <div className={`h-px w-6 sm:w-8 ${s < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* ─── Step 1: Select Package ─── */}
        {step === 1 && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[40vh]">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
              ) : !packages?.length ? (
                <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
              ) : (
                packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id === selectedPkgId ? null : pkg.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      pkg.id === selectedPkgId
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {language === 'th' && pkg.name_th ? pkg.name_th : pkg.name_en}
                        </span>
                      </div>
                      <Badge variant="secondary">{typeLabel(pkg.type)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground ml-6">
                      <span>{formatCurrency(pkg.price)}</span>
                      {pkg.sessions && <span>{pkg.sessions} sessions</span>}
                      <span>{pkg.term_days} {t('members.days')}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={resetAndClose}>
                {t('common.cancel')}
              </Button>
              <Button onClick={() => setStep(2)} disabled={!selectedPkgId}>
                {t('common.next')}
              </Button>
            </div>
          </>
        )}

        {/* ─── Step 2: Payment Details + Discounts ─── */}
        {step === 2 && (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0 max-h-[50vh]">
              {/* Payment method */}
              <div className="space-y-2">
                <Label>{t('members.selectPaymentMethod')}</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((pm) => (
                      <label
                        key={pm.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          paymentMethod === pm.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={pm.value} className="sr-only" />
                        {pm.icon}
                        <span className="text-sm font-medium">{t(pm.labelKey)}</span>
                        {paymentMethod === pm.value && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>{t('members.selectLocation')}</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('members.selectLocation')} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ─── Discount Section ─── */}
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Tag className="h-4 w-4" /> {t('members.discountSection')}
                </Label>

                {/* Promotion selector */}
                <div className="space-y-1">
                  <Label className="text-sm flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> {t('members.selectPromotion')}
                  </Label>
                  <Select value={selectedPromotionId} onValueChange={setSelectedPromotionId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('members.selectPromotion')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.noData')}</SelectItem>
                      {promotions?.map((promo) => (
                        <SelectItem key={promo.id} value={promo.id}>
                          {language === 'th' && promo.name_th ? promo.name_th : (promo.name_en || promo.name)}
                          {promo.discount_type === 'percentage'
                            ? ` (-${promo.percentage_discount || promo.discount_value}%)`
                            : ` (-${formatCurrency(promo.flat_rate_discount || promo.discount_value || 0)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Coupon selector */}
                <div className="space-y-1">
                  <Label className="text-sm flex items-center gap-1">
                    <Ticket className="h-3.5 w-3.5" /> {t('members.selectCoupon')}
                  </Label>
                  <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('members.selectCoupon')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.noData')}</SelectItem>
                      {memberCoupons?.map((coupon) => {
                        const tpl = coupon.coupon_template as any;
                        const label = tpl ? (language === 'th' && tpl.name_th ? tpl.name_th : tpl.name_en) : 'Coupon';
                        const discLabel = tpl?.discount_type === 'percentage'
                          ? `(-${tpl.discount_value}%)`
                          : `(-${formatCurrency(tpl?.discount_value || 0)})`;
                        return (
                          <SelectItem key={coupon.id} value={coupon.id}>
                            {label} {discLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Manual discount */}
                <div className="space-y-1">
                  <Label className="text-sm flex items-center gap-1">
                    <CircleDollarSign className="h-3.5 w-3.5" /> {t('members.manualDiscount')}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={manualDiscount || ''}
                    onChange={(e) => setManualDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>{t('members.paymentNotes')}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('members.paymentNotesPlaceholder')}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
              </Button>
              <Button onClick={() => setStep(3)}>
                {t('common.next')}
              </Button>
            </div>
          </>
        )}

        {/* ─── Step 3: Summary ─── */}
        {step === 3 && selectedPkg && discountBreakdown && (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0 max-h-[50vh]">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  {/* Package info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {language === 'th' && selectedPkg.name_th ? selectedPkg.name_th : selectedPkg.name_en}
                      </span>
                    </div>
                    <Badge variant="secondary">{typeLabel(selectedPkg.type)}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {selectedPkg.sessions && (
                      <div className="flex justify-between">
                        <span>{t('members.sessions')}</span>
                        <span>{selectedPkg.sessions}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t('members.termDays')}</span>
                      <span>{selectedPkg.term_days} {t('members.days')}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Price breakdown with discounts */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('members.originalPrice')}</span>
                      <span>{formatCurrency(discountBreakdown.originalPrice)}</span>
                    </div>

                    {discountBreakdown.promotionDiscountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t('members.promotionDiscount')}</span>
                        <span>-{formatCurrency(discountBreakdown.promotionDiscountAmount)}</span>
                      </div>
                    )}
                    {discountBreakdown.couponDiscountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t('members.couponDiscount')}</span>
                        <span>-{formatCurrency(discountBreakdown.couponDiscountAmount)}</span>
                      </div>
                    )}
                    {discountBreakdown.manualDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t('members.manualDiscount')}</span>
                        <span>-{formatCurrency(discountBreakdown.manualDiscount)}</span>
                      </div>
                    )}

                    {discountBreakdown.totalDiscount > 0 && <Separator />}

                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('members.netPrice')}</span>
                      <span>{formatCurrency(discountBreakdown.netPrice)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('members.priceExVat')}</span>
                      <span>{formatCurrency(discountBreakdown.exVat)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('members.vatAmount')}</span>
                      <span>{formatCurrency(discountBreakdown.vat)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>{t('members.totalAmount')}</span>
                      <span>{formatCurrency(discountBreakdown.netPrice)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Purchase details */}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>{t('members.purchaseFor')}</span>
                      <span className="font-medium text-foreground">{memberName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('finance.paymentMethod')}</span>
                      <span className="font-medium text-foreground">
                        {t(PAYMENT_METHODS.find((p) => p.value === paymentMethod)?.labelKey || '')}
                      </span>
                    </div>
                    {selectedLocation && (
                      <div className="flex justify-between">
                        <span>{t('finance.location')}</span>
                        <span className="font-medium text-foreground">{selectedLocation.name}</span>
                      </div>
                    )}
                    {notes && (
                      <div className="flex justify-between">
                        <span>{t('members.paymentNotes')}</span>
                        <span className="font-medium text-foreground text-right max-w-[60%] truncate">{notes}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
              </Button>
              <Button onClick={handleConfirm} disabled={assignMutation.isPending}>
                {assignMutation.isPending ? t('common.saving') : t('members.confirmPurchase')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
