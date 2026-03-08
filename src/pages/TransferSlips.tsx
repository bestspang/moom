import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, DateRangePicker, SearchBar, StatusTabs, DataTable, StatusBadge, ManageDropdown, type Column, type StatusTab } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTransferSlipsList, useTransferSlipStats } from '@/hooks/useTransferSlips';
import { formatCurrency, getDateLocale } from '@/lib/formatters';
import { format, subDays } from 'date-fns';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';
import { ImportCenterDialog } from '@/components/import/ImportCenterDialog';
import { SlipDetailDialog } from '@/components/transfer-slips/SlipDetailDialog';
import { Eye } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

const TransferSlips = () => {
  const { t, language } = useLanguage();
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('needs_review');
  const [importOpen, setImportOpen] = useState(false);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: subDays(new Date(), 7),
    end: new Date(),
  });

  const { data: slips, isLoading } = useTransferSlipsList({
    startDate: dateRange.start,
    endDate: dateRange.end,
    search,
    status: activeTab,
  });
  const { data: stats } = useTransferSlipStats();

  const statusTabs: StatusTab[] = [
    { key: 'needs_review', label: t('transferSlips.needsReview'), count: stats?.needs_review || 0, color: 'red' },
    { key: 'approved', label: t('transferSlips.paid'), count: stats?.approved || 0, color: 'teal' },
    { key: 'voided', label: t('transferSlips.voided'), count: (stats?.voided || 0) + (stats?.rejected || 0), color: 'gray' },
  ];

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'approved': return 'paid';
      case 'needs_review': return 'pending';
      case 'rejected': return 'voided';
      case 'voided': return 'voided';
      default: return 'default';
    }
  };

  const openDetail = (id: string) => {
    setSelectedSlipId(id);
    setDetailOpen(true);
  };

  const columns: Column<any>[] = [
    {
      key: 'dateTime',
      header: t('finance.dateTime'),
      cell: (row) => row.slip_datetime
        ? format(new Date(row.slip_datetime), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) })
        : '-',
    },
    {
      key: 'transactionNo',
      header: t('finance.transactionNo'),
      cell: (row) => row.linked_transaction
        ? (row.linked_transaction as any).transaction_id
        : '-',
    },
    {
      key: 'packageName',
      header: t('transferSlips.packageName'),
      cell: (row) => row.package
        ? (language === 'th' && row.package.name_th ? row.package.name_th : row.package.name_en)
        : '-',
    },
    {
      key: 'packageType',
      header: t('transferSlips.packageType'),
      cell: (row) => row.package?.type ? (
        <StatusBadge variant="default">{row.package.type}</StatusBadge>
      ) : '-',
    },
    {
      key: 'soldTo',
      header: t('transferSlips.soldTo'),
      cell: (row) => row.member
        ? `${row.member.first_name} ${row.member.last_name}`
        : row.member_name_text || '-',
    },
    {
      key: 'location',
      header: t('transferSlips.soldAt'),
      cell: (row) => row.location?.name || '-',
    },
    {
      key: 'amount',
      header: t('finance.amount'),
      cell: (row) => formatCurrency(Number(row.amount_thb)),
    },
    {
      key: 'action',
      header: '',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); openDetail(row.id); }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const handleExport = () => {
    if (!slips?.length) { toast.info(t('common.noData')); return; }
    const csvColumns: CsvColumn<any>[] = [
      { key: 'slip_datetime', header: 'Slip DateTime', accessor: (r) => r.slip_datetime ? format(new Date(r.slip_datetime), 'yyyy-MM-dd HH:mm') : '' },
      { key: 'status', header: 'Status', accessor: (r) => r.status || '' },
      { key: 'member_name', header: 'Member Name', accessor: (r) => r.member ? `${r.member.first_name} ${r.member.last_name}` : r.member_name_text || '' },
      { key: 'member_phone', header: 'Member Phone', accessor: (r) => r.member?.phone || r.member_phone_text || '' },
      { key: 'location', header: 'Location', accessor: (r) => r.location?.name || '' },
      { key: 'amount_thb', header: 'Amount THB', accessor: (r) => r.amount_thb },
      { key: 'payment_method', header: 'Payment Method', accessor: (r) => r.payment_method || '' },
      { key: 'bank_reference', header: 'Bank Reference', accessor: (r) => r.bank_reference || '' },
      { key: 'transaction_no', header: 'Linked Transaction No', accessor: (r) => r.linked_transaction ? (r.linked_transaction as any).transaction_id : '' },
    ];
    exportToCsv(slips, csvColumns, 'transfer-slips');
    toast.success(t('common.export'));
  };

  const handleDownloadTemplate = () => {
    const headers = ['slip_datetime', 'amount_thb', 'payment_method', 'member_name', 'member_phone', 'location_name', 'bank_reference', 'note'];
    const csv = headers.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transfer-slips-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  return (
    <div>
      <PageHeader
        title={t('transferSlips.title')}
        breadcrumbs={[{ label: t('nav.business') }, { label: t('transferSlips.title') }]}
        actions={
          <ManageDropdown
            onExport={handleExport}
            onDownloadTemplate={handleDownloadTemplate}
            onImport={() => setImportOpen(true)}
            exportDisabled={!slips?.length}
          />
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={setDateRange}
        />
        <SearchBar
          placeholder={t('transferSlips.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </div>

      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={slips || []}
          rowKey={(row) => row.id}
          onRowClick={(row) => openDetail(row.id)}
          emptyMessage={t('transferSlips.noSlips')}
        />
      )}

      <ImportCenterDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        presetEntity="slips"
      />

      <SlipDetailDialog
        slipId={selectedSlipId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default TransferSlips;
