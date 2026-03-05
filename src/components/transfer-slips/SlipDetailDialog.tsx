import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/formatters';
import { useTransferSlipDetail, useSlipActivityLog, useApproveSlip, useRejectSlip, useVoidSlip } from '@/hooks/useTransferSlips';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Ban, Clock, FileText, User, MapPin, Banknote, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SlipDetailDialogProps {
  slipId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SlipDetailDialog: React.FC<SlipDetailDialogProps> = ({ slipId, open, onOpenChange }) => {
  const { t, language } = useLanguage();
  const { data: slip, isLoading } = useTransferSlipDetail(slipId);
  const { data: activityLog } = useSlipActivityLog(slipId);
  const approveSlip = useApproveSlip();
  const rejectSlip = useRejectSlip();
  const voidSlip = useVoidSlip();

  const [mode, setMode] = useState<'view' | 'approve' | 'reject' | 'void'>('view');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [reviewNote, setReviewNote] = useState('');

  // Fetch packages for approval dropdown
  const { data: packages } = useQuery({
    queryKey: ['packages-for-approval'],
    enabled: open && mode === 'approve',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('id, name_en, name_th, type, price, sessions')
        .eq('status', 'on_sale' as any)
        .order('name_en');
      if (error) throw error;
      return data;
    },
  });

  const handleApprove = async () => {
    if (!slipId) return;
    await approveSlip.mutateAsync({
      slipId,
      packageId: selectedPackageId || undefined,
      note: reviewNote || undefined,
    });
    resetAndClose();
  };

  const handleReject = async () => {
    if (!slipId || !reviewNote.trim()) return;
    await rejectSlip.mutateAsync({ slipId, reviewNote });
    resetAndClose();
  };

  const handleVoid = async () => {
    if (!slipId) return;
    await voidSlip.mutateAsync({ slipId, reviewNote: reviewNote || undefined });
    resetAndClose();
  };

  const resetAndClose = () => {
    setMode('view');
    setSelectedPackageId('');
    setReviewNote('');
    onOpenChange(false);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'paid';
      case 'needs_review': return 'pending';
      case 'rejected': return 'voided';
      case 'voided': return 'voided';
      default: return 'default';
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      needs_review: t('transferSlips.needsReview'),
      approved: t('transferSlips.paid'),
      rejected: t('transferSlips.rejected'),
      voided: t('transferSlips.voided'),
    };
    return map[status] || status;
  };

  const paymentMethodLabel = (method: string | null) => {
    const map: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      credit_card: 'Credit Card',
      qr_promptpay: 'QR PromptPay',
      credit_offline: 'Credit (Offline)',
      credit_stripe: 'Credit (Stripe)',
      qr_promptpay_stripe: 'PromptPay (Stripe)',
    };
    return method ? (map[method] || method) : '-';
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!slip) return null;

  const memberName = slip.member
    ? `${slip.member.first_name} ${slip.member.last_name}`
    : slip.member_name_text || '-';

  const packageName = slip.package
    ? (language === 'th' && slip.package.name_th ? slip.package.name_th : slip.package.name_en)
    : '-';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('transferSlips.slipDetail')}
          </DialogTitle>
        </DialogHeader>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <StatusBadge variant={getStatusVariant(slip.status as string) as any}>
            {statusLabel(slip.status as string)}
          </StatusBadge>
          {slip.linked_transaction && (
            <Badge variant="outline" className="text-xs">
              {(slip.linked_transaction as any).transaction_id}
            </Badge>
          )}
        </div>

        {/* Slip Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">{t('finance.dateTime')}</p>
              <p className="font-medium">
                {slip.slip_datetime
                  ? format(new Date(slip.slip_datetime), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) })
                  : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Banknote className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">{t('transferSlips.amount')}</p>
              <p className="font-medium">{formatCurrency(Number(slip.amount_thb))}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">{t('transferSlips.soldTo')}</p>
              <p className="font-medium">{memberName}</p>
              {(slip.member?.phone || slip.member_phone_text) && (
                <p className="text-xs text-muted-foreground">{slip.member?.phone || slip.member_phone_text}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">{t('transferSlips.soldAt')}</p>
              <p className="font-medium">{slip.location?.name || '-'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">{t('transferSlips.packageName')}</p>
              <p className="font-medium">{packageName}</p>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">{t('finance.paymentMethod')}</p>
            <p className="font-medium">{paymentMethodLabel(slip.payment_method)}</p>
          </div>

          {slip.bank_reference && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">{t('transferSlips.bankReference')}</p>
              <p className="font-medium">{slip.bank_reference}</p>
            </div>
          )}
        </div>

        {/* Review info if reviewed */}
        {slip.reviewed_at && (
          <>
            <Separator />
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground text-xs">{t('transferSlips.reviewedBy')}</p>
              <p className="font-medium">
                {slip.reviewer ? `${(slip.reviewer as any).first_name} ${(slip.reviewer as any).last_name}` : '-'}
                {' · '}
                {format(new Date(slip.reviewed_at), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) })}
              </p>
              {slip.review_note && (
                <p className="text-muted-foreground italic">"{slip.review_note}"</p>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Action Buttons / Forms */}
        {mode === 'view' && (
          <div className="flex gap-2">
            {slip.status === 'needs_review' && (
              <>
                <Button onClick={() => setMode('approve')} className="flex-1 gap-1" variant="default">
                  <CheckCircle className="h-4 w-4" />
                  {t('transferSlips.approve')}
                </Button>
                <Button onClick={() => setMode('reject')} className="flex-1 gap-1" variant="outline">
                  <XCircle className="h-4 w-4" />
                  {t('transferSlips.reject')}
                </Button>
              </>
            )}
            {slip.status === 'approved' && (
              <Button onClick={() => setMode('void')} className="flex-1 gap-1" variant="destructive">
                <Ban className="h-4 w-4" />
                {t('transferSlips.void')}
              </Button>
            )}
          </div>
        )}

        {/* Approve Form */}
        {mode === 'approve' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('transferSlips.selectPackage')}</label>
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transferSlips.optionalPackage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('transferSlips.noPackage')}</SelectItem>
                  {packages?.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {language === 'th' && pkg.name_th ? pkg.name_th : pkg.name_en} ({pkg.type}) — {formatCurrency(pkg.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('transferSlips.note')}</label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={t('transferSlips.notePlaceholder')}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApprove} disabled={approveSlip.isPending} className="flex-1">
                {approveSlip.isPending ? t('common.loading') : t('transferSlips.confirmApprove')}
              </Button>
              <Button onClick={() => setMode('view')} variant="outline">
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Reject Form */}
        {mode === 'reject' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('transferSlips.rejectReason')} *</label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={t('transferSlips.rejectReasonPlaceholder')}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReject} disabled={rejectSlip.isPending || !reviewNote.trim()} variant="destructive" className="flex-1">
                {rejectSlip.isPending ? t('common.loading') : t('transferSlips.confirmReject')}
              </Button>
              <Button onClick={() => setMode('view')} variant="outline">
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Void Form */}
        {mode === 'void' && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{t('transferSlips.voidWarning')}</p>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('transferSlips.note')}</label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={t('transferSlips.notePlaceholder')}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleVoid} disabled={voidSlip.isPending} variant="destructive" className="flex-1">
                {voidSlip.isPending ? t('common.loading') : t('transferSlips.confirmVoid')}
              </Button>
              <Button onClick={() => setMode('view')} variant="outline">
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Activity Log */}
        {activityLog && activityLog.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">{t('transferSlips.activityLog')}</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activityLog.map((log) => (
                  <div key={log.id} className="text-xs border-l-2 border-border pl-3 py-1">
                    <p className="text-muted-foreground">
                      {format(new Date(log.created_at!), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) })}
                    </p>
                    <p>{log.activity}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
