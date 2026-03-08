import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PauseCircle } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useCreateMemberSuspension, useEndMemberSuspension, type MemberSuspension } from '@/hooks/useMemberDetails';

interface MemberSuspensionsTabProps {
  memberId: string;
  suspensions: MemberSuspension[];
  isLoading: boolean;
}

export const MemberSuspensionsTab = ({ memberId, suspensions, isLoading }: MemberSuspensionsTabProps) => {
  const { t } = useLanguage();
  const createSuspension = useCreateMemberSuspension();
  const endSuspension = useEndMemberSuspension();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleAdd = () => {
    if (!startDate) return;
    createSuspension.mutate(
      { memberId, reason: reason || undefined, start_date: startDate, end_date: endDate || undefined },
      { onSuccess: () => { setOpen(false); setReason(''); setStartDate(''); setEndDate(''); } }
    );
  };

  const columns: Column<MemberSuspension>[] = [
    { key: 'start_date', header: t('members.startDate'), cell: (row) => formatDate(row.start_date) },
    { key: 'end_date', header: t('members.endDate'), cell: (row) => row.end_date ? formatDate(row.end_date) : '-' },
    { key: 'reason', header: t('members.reason'), cell: (row) => row.reason || '-' },
    { key: 'is_active', header: t('common.status'), cell: (row) => (
      <Badge variant={row.is_active ? 'destructive' : 'secondary'}>
        {row.is_active ? t('members.activeSuspension') : t('members.ended')}
      </Badge>
    )},
    { key: 'actions', header: t('common.actions'), cell: (row) => row.is_active ? (
      <Button variant="outline" size="sm" onClick={() => endSuspension.mutate({ suspensionId: row.id, memberId })} disabled={endSuspension.isPending}>
        {t('members.endSuspension')}
      </Button>
    ) : null },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive"><PauseCircle className="h-4 w-4 mr-2" />{t('members.suspendMember')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('members.suspendMember')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t('members.reason')}</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
              <div><Label>{t('members.startDate')}</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div><Label>{t('members.endDate')}</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              <Button onClick={handleAdd} disabled={!startDate || createSuspension.isPending}>{t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <Skeleton className="h-48" /> : suspensions.length === 0 ? <EmptyState message={t('common.noData')} /> : (
        <DataTable columns={columns} data={suspensions} rowKey={(row) => row.id} />
      )}
    </>
  );
};
