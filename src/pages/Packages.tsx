import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';

interface Package {
  id: string;
  name: string;
  type: 'unlimited' | 'session' | 'pt';
  term: number;
  sessions: number | null;
  price: number;
  categories: string;
  access: string;
  isPopular: boolean;
  status: string;
}

const Packages = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('on_sale');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Sample data
  const packages: Package[] = [
    {
      id: '1',
      name: '1 Month Unlimited',
      type: 'unlimited',
      term: 30,
      sessions: null,
      price: 2500,
      categories: 'All',
      access: 'Both',
      isPopular: true,
      status: 'on_sale',
    },
    {
      id: '2',
      name: '10 Sessions',
      type: 'session',
      term: 60,
      sessions: 10,
      price: 3500,
      categories: 'Group Class',
      access: 'Class only',
      isPopular: false,
      status: 'on_sale',
    },
    {
      id: '3',
      name: 'PT 5 Sessions',
      type: 'pt',
      term: 90,
      sessions: 5,
      price: 7500,
      categories: 'Personal Training',
      access: 'Class only',
      isPopular: true,
      status: 'on_sale',
    },
  ];

  const statusTabs: StatusTab[] = [
    { key: 'on_sale', label: t('packages.onSale'), count: 22, color: 'teal' },
    { key: 'scheduled', label: t('packages.scheduled'), count: 0 },
    { key: 'drafts', label: t('packages.drafts'), count: 4, color: 'gray' },
    { key: 'archive', label: t('packages.archive'), count: 1, color: 'gray' },
  ];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'unlimited': return t('packages.unlimited');
      case 'session': return t('packages.session');
      case 'pt': return t('packages.pt');
      default: return type;
    }
  };

  const columns: Column<Package>[] = [
    { key: 'name', header: t('lobby.name'), cell: (row) => row.name },
    {
      key: 'type',
      header: t('packages.type'),
      cell: (row) => (
        <StatusBadge variant={row.type === 'pt' ? 'pending' : 'default'}>
          {getTypeLabel(row.type)}
        </StatusBadge>
      ),
    },
    { key: 'term', header: t('packages.term'), cell: (row) => row.term },
    { key: 'sessions', header: t('packages.sessions'), cell: (row) => row.sessions || '-' },
    {
      key: 'price',
      header: t('packages.priceInclVat'),
      cell: (row) => formatCurrency(row.price),
    },
    { key: 'categories', header: t('packages.categories'), cell: (row) => row.categories },
    { key: 'access', header: t('packages.access'), cell: (row) => row.access },
    {
      key: 'popular',
      header: t('packages.popular'),
      cell: (row) =>
        row.isPopular ? (
          <Star className="h-4 w-4 fill-warning text-warning" />
        ) : null,
    },
  ];

  const filteredPackages = packages.filter((pkg) => {
    if (activeTab !== 'all' && pkg.status !== activeTab) return false;
    if (search) {
      return pkg.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredPackages.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredPackages.map((p) => p.id));
    }
  };

  return (
    <div>
      <PageHeader
        title={t('packages.title')}
        breadcrumbs={[{ label: t('nav.package') }, { label: t('packages.title') }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button
              className="bg-primary hover:bg-primary-hover"
              onClick={() => navigate('/package/create')}
            >
              {t('packages.createPackage')}
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <SearchBar
          placeholder={t('packages.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </div>

      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />

      <DataTable
        columns={columns}
        data={filteredPackages}
        selectable
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        rowKey={(row) => row.id}
      />
    </div>
  );
};

export default Packages;
