import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CreditCard, CheckCircle, XCircle, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useApproveSlip, useRejectSlip } from '@/hooks/useTransferSlips';

type Slip = {
  id: string;
  amount_thb: number | null;
  status: string | null;
  slip_datetime: string | null;
  member_id: string | null;
  slip_file_url?: string | null;
  members: { first_name: string; last_name: string | null } | null;
};

export default function StaffPaymentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [selectedSlip, setSelectedSlip] = useState<Slip | null>(null);

  const approveSlip = useApproveSlip();
  const rejectSlip = useRejectSlip();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff-transfer-slips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfer_slips')
        .select('id, amount_thb, status, slip_datetime, member_id, slip_file_url, members(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as Slip[];
    },
    enabled: !!user,
  });

  const memberName = (s: Slip) =>
    s.members ? `${s.members.first_name} ${s.members.last_name ?? ''}`.trim() : t('staff.unknownMember');

  const statusColor = (status: string | null) => {
    if (status === 'approved') return 'text-primary';
    if (status === 'needs_review' || status === 'pending') return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const handleApprove = async () => {
    if (!selectedSlip) return;
    await approveSlip.mutateAsync({ slipId: selectedSlip.id });
    setSelectedSlip(null);
    refetch();
  };

  const handleReject = async () => {
    if (!selectedSlip) return;
    await rejectSlip.mutateAsync({ slipId: selectedSlip.id, reviewNote: 'Rejected by staff' });
    setSelectedSlip(null);
    refetch();
  };

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('staff.paymentsTitle')} subtitle={t('staff.paymentsSubtitle')} />
      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <Section><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div></Section>
      ) : !data?.length ? (
        <EmptyState icon={<CreditCard className="h-10 w-10" />} title={t('staff.noSlips')} description={t('staff.slipsWillAppear')} />
      ) : (
        <Section>
          <div className="space-y-2">
            {data.map((s) => (
              <ListCard
                key={s.id}
                title={memberName(s)}
                subtitle={s.slip_datetime ? format(parseISO(s.slip_datetime), 'd MMM yyyy', { locale: dateLocale }) : undefined}
                meta={`฿${Number(s.amount_thb ?? 0).toLocaleString()}`}
                trailing={
                  <span className={`text-xs font-medium ${statusColor(s.status)}`}>
                    {s.status}
                  </span>
                }
                onClick={() => setSelectedSlip(s)}
              />
            ))}
          </div>
        </Section>
      )}

      <Sheet open={!!selectedSlip} onOpenChange={open => !open && setSelectedSlip(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{t('staff.paymentsTitle')}</SheetTitle>
          </SheetHeader>
          {selectedSlip && (
            <div className="space-y-4">
              {/* Slip image */}
              {selectedSlip.slip_file_url ? (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src={selectedSlip.slip_file_url} alt="Transfer slip" className="w-full object-contain max-h-56" />
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border h-32">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}

              {/* Details */}
              <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('staff.membersTitle')}</span>
                  <span className="font-medium">{memberName(selectedSlip)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('staff.paymentsTitle')}</span>
                  <span className="font-semibold text-foreground">฿{Number(selectedSlip.amount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${statusColor(selectedSlip.status)}`}>{selectedSlip.status}</span>
                </div>
                {selectedSlip.slip_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{format(parseISO(selectedSlip.slip_date), 'd MMM yyyy', { locale: dateLocale })}</span>
                  </div>
                )}
              </div>

              {/* Approve / Reject */}
              {(selectedSlip.status === 'needs_review' || selectedSlip.status === 'pending') && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-destructive/30 text-destructive"
                    onClick={handleReject}
                    disabled={rejectSlip.isPending || approveSlip.isPending}
                  >
                    {rejectSlip.isPending
                      ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      : <XCircle className="h-4 w-4 mr-1.5" />}
                    Reject
                  </Button>
                  <Button onClick={handleApprove} disabled={approveSlip.isPending || rejectSlip.isPending}>
                    {approveSlip.isPending
                      ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      : <CheckCircle className="h-4 w-4 mr-1.5" />}
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
