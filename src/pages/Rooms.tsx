import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PageHeader, SearchBar, StatusTabs, DataTable, type Column, type StatusTab } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRooms, useRoomStats } from '@/hooks/useRooms';
import { useClassCategories } from '@/hooks/useClassCategories';
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog';

const Rooms = () => {
  const { t } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('open');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: rooms, isLoading } = useRooms(activeTab, search, categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined);
  const { data: stats } = useRoomStats();
  const { data: categories } = useClassCategories();

  const totalRooms = (stats?.open || 0) + (stats?.closed || 0);

  const statusTabs: StatusTab[] = [
    { key: 'open', label: t('rooms.open'), count: stats?.open || 0, color: 'teal' }, 
    { key: 'closed', label: t('rooms.closed'), count: stats?.closed || 0 }
  ];

  const getLayoutLabel = (layoutType: string | null) => {
    if (layoutType === 'fixed') return t('rooms.fixedPositions');
    return t('rooms.openSpace');
  };

  const columns: Column<any>[] = [
    { key: 'name', header: t('rooms.roomName'), cell: (row) => row.name },
    { key: 'location', header: t('lobby.location'), cell: (row) => row.location?.name || '-' },
    { key: 'categories', header: t('rooms.categoriesAvailability'), cell: (row) => {
      const cats = row.categories;
      if (!cats || cats.length === 0) return t('rooms.create.allCategories');
      return cats.join(', ');
    }},
    { key: 'layoutType', header: t('rooms.layoutType'), cell: (row) => (
      <Badge variant="secondary" className="font-normal">
        {getLayoutLabel(row.layout_type)}
      </Badge>
    )},
    { key: 'maxCapacity', header: t('rooms.maxCapacity'), cell: (row) => row.max_capacity || 20 },
  ];

  return (
    <div>
      <PageHeader 
        title={t('rooms.title')} 
        breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('rooms.title') }]} 
        actions={
          <Button 
            className="bg-primary hover:bg-primary-hover"
            onClick={() => setCreateDialogOpen(true)}
          >
            {t('rooms.createRoom')}
          </Button>
        } 
      />
      
      <div className="flex items-center gap-3 mb-6">
        <SearchBar 
          placeholder={t('rooms.searchPlaceholder')} 
          value={search} 
          onChange={setSearch} 
          className="max-w-md" 
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('rooms.filterByCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Total count header */}
      <div className="flex items-center justify-between mb-4">
        <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
        <span className="text-sm text-muted-foreground">
          {t('rooms.totalRooms').replace('{count}', String(totalRooms))}
        </span>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={rooms || []} 
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/room/${row.id}`)}
          emptyMessage={t('rooms.noRooms')}
        />
      )}

      <CreateRoomDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
};

export default Rooms;
