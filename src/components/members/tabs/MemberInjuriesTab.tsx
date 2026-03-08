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
import { Plus, Check } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useCreateMemberInjury, useMarkInjuryRecovered, type MemberInjury } from '@/hooks/useMemberDetails';

interface MemberInjuriesTabProps {
  memberId: string;
  injuries: MemberInjury[];
  isLoading: boolean;
}

export const MemberInjuriesTab = ({ memberId, injuries, isLoading }: MemberInjuriesTabProps) => {
  const { t } = useLanguage();
  const createInjury = useCreateMemberInjury();
  const markRecovered = useMarkInjuryRecovered();

  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!desc.trim()) return;
    createInjury.mutate(
      { memberId, injury_description: desc, injury_date: date || undefined, notes: notes || undefined },
      { onSuccess: () => { setOpen(false); setDesc(''); setDate(''); setNotes(''); } }
    );
  };

  const columns: Column<MemberInjury>[] = [
    { key: 'injury_date', header: t('members.injuryDate'), cell: (row) => formatDate(row.injury_date) },
    { key: 'injury_description', header: t('members.description'), cell: (row) => row.injury_description },
    { key: 'is_active', header: t('common.status'), cell: (row) => (
      <Badge variant={row.is_active ? 'destructive' : 'secondary'}>
        {row.is_active ? t('members.activeInjury') : t('members.recovered')}
      </Badge>
    )},
    { key: 'recovery_date', header: t('members.recoveryDate'), cell: (row) => row.recovery_date ? formatDate(row.recovery_date) : '-' },
    { key: 'actions', header: t('common.actions'), cell: (row) => row.is_active ? (
      <Button variant="outline" size="sm" onClick={() => markRecovered.mutate({ injuryId: row.id, memberId })} disabled={markRecovered.isPending}>
        <Check className="h-3 w-3 mr-1" />{t('members.markRecovered')}
      </Button>
    ) : null },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{t('members.addInjury')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('members.addInjury')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t('members.description')}</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
              <div><Label>{t('members.injuryDate')}</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label>{t('members.notes')}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <Button onClick={handleAdd} disabled={!desc.trim() || createInjury.isPending}>{t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <Skeleton className="h-48" /> : injuries.length === 0 ? <EmptyState message={t('common.noData')} /> : (
        <DataTable columns={columns} data={injuries} rowKey={(row) => row.id} />
      )}
    </>
  );
};
