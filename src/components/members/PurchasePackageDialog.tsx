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
import { Search, Package, Banknote, CreditCard, QrCode, ArrowLeft, Check } from 'lucide-react';
import { usePackages } from '@/hooks/usePackages';
import { useAssignPackageToMember } from '@/hooks/useMemberDetails';
import { useLocations } from '@/hooks/useLocations';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

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

  const { data: packages, isLoading } = usePackages('on_sale', search);
  const { data: locations } = useLocations('open');
  const assignMutation = useAssignPackageToMember();

  const selectedPkg = useMemo(
    () => packages?.find((p) => p.id === selectedPkgId) || null,
    [packages, selectedPkgId]
  );

  const selectedLocation = useMemo(
    () => locations?.find((l) => l.id === locationId) || null,
    [locations, locationId]
  );

  // VAT calculations
  const vatBreakdown = useMemo(() => {
    if (!selectedPkg) return null;
    const gross = selectedPkg.price;
    const exVat = Math.round((gross / 1.07) * 100) / 100;
    const vat = Math.round((gross - exVat) * 100) / 100;
    return { gross, exVat, vat };
  }, [selectedPkg]);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'unlimited': return 'Unlimited';
      case 'session': return 'Session';
      case 'pt': return 'PT';
      default: return type;
    }
  };

  const handleConfirm = () => {
    if (!selectedPkg) return;
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
      },
      {
        onSuccess: () => {
          resetAndClose();
        },
      }
    );
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedPkgId(null);
    setSearch('');
    setPaymentMethod('cash');
    setLocationId('');
    setNotes('');
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

        {/* ─── Step 2: Payment Details ─── */}
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
        {step === 3 && selectedPkg && vatBreakdown && (
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

                  {/* Price breakdown */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('members.priceExVat')}</span>
                      <span>{formatCurrency(vatBreakdown.exVat)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('members.vatAmount')}</span>
                      <span>{formatCurrency(vatBreakdown.vat)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>{t('members.totalAmount')}</span>
                      <span>{formatCurrency(vatBreakdown.gross)}</span>
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
