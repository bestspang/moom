import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useCreateMemberContract, type MemberContract } from '@/hooks/useMemberDetails';

interface MemberContractsTabProps {
  memberId: string;
  contracts: MemberContract[];
  isLoading: boolean;
}

export const MemberContractsTab = ({ memberId, contracts, isLoading }: MemberContractsTabProps) => {
  const { t } = useLanguage();
  const createContract = useCreateMemberContract();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    createContract.mutate(
      { memberId, contract_type: type || undefined, document_url: url || undefined },
      { onSuccess: () => { setOpen(false); setType(''); setUrl(''); } }
    );
  };

  const columns: Column<MemberContract>[] = [
    { key: 'contract_type', header: t('members.contractType'), cell: (row) => row.contract_type || '-' },
    { key: 'is_signed', header: t('common.status'), cell: (row) => (
      <Badge variant={row.is_signed ? 'default' : 'secondary'}>
        {row.is_signed ? t('members.signed') : t('members.unsigned')}
      </Badge>
    )},
    { key: 'signed_date', header: t('members.signedDate'), cell: (row) => row.signed_date ? formatDate(row.signed_date) : '-' },
    { key: 'expiry_date', header: t('members.expiryDate'), cell: (row) => row.expiry_date ? formatDate(row.expiry_date) : '-' },
    { key: 'document_url', header: t('members.document'), cell: (row) => row.document_url ? (
      <a href={row.document_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
        {t('members.viewDocument')}
      </a>
    ) : '-' },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{t('members.addContract')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('members.addContract')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t('members.contractType')}</Label><Input value={type} onChange={(e) => setType(e.target.value)} /></div>
              <div><Label>{t('members.documentUrl')}</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></div>
              <Button onClick={handleAdd} disabled={createContract.isPending}>{t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <Skeleton className="h-48" /> : contracts.length === 0 ? <EmptyState message={t('common.noData')} /> : (
        <DataTable columns={columns} data={contracts} rowKey={(row) => row.id} />
      )}
    </>
  );
};
