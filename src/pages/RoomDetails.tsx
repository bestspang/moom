import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { useRoom, useUpdateRoom } from '@/hooks/useRooms';
import { useLocations } from '@/hooks/useLocations';
import { useClassCategories } from '@/hooks/useClassCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, X, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type EditSection = 'information' | 'access' | 'layout' | null;

const RoomDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: room, isLoading } = useRoom(id!);
  const { data: locations } = useLocations();
  const { data: classCategories } = useClassCategories();
  const updateRoom = useUpdateRoom();

  const [editSection, setEditSection] = useState<EditSection>(null);

  // Edit state
  const [name, setName] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [locationId, setLocationId] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [allCategories, setAllCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [layoutType, setLayoutType] = useState<'open' | 'fixed'>('open');

  // Sync form state when room data loads or edit section changes
  useEffect(() => {
    if (room) {
      setName(room.name || '');
      setNameTh(room.name_th || '');
      setLocationId(room.location_id || '');
      setMaxCapacity(room.max_capacity || 20);
      const cats = room.categories as string[] | null;
      setAllCategories(!cats || cats.length === 0);
      setSelectedCategories(cats || []);
      setLayoutType((room.layout_type as 'open' | 'fixed') || 'open');
    }
  }, [room]);

  const startEdit = (section: EditSection) => {
    // Reset to current values before editing
    if (room) {
      setName(room.name || '');
      setNameTh(room.name_th || '');
      setLocationId(room.location_id || '');
      setMaxCapacity(room.max_capacity || 20);
      const cats = room.categories as string[] | null;
      setAllCategories(!cats || cats.length === 0);
      setSelectedCategories(cats || []);
      setLayoutType((room.layout_type as 'open' | 'fixed') || 'open');
    }
    setEditSection(section);
  };

  const cancelEdit = () => setEditSection(null);

  const saveInformation = async () => {
    if (!id || !name.trim() || !locationId) return;
    await updateRoom.mutateAsync({
      id,
      data: {
        name: name.trim(),
        name_th: nameTh.trim() || null,
        location_id: locationId,
        max_capacity: maxCapacity,
      },
    });
    setEditSection(null);
  };

  const saveAccess = async () => {
    if (!id) return;
    await updateRoom.mutateAsync({
      id,
      data: {
        categories: allCategories ? [] : selectedCategories,
      },
    });
    setEditSection(null);
  };

  const saveLayout = async () => {
    if (!id) return;
    await updateRoom.mutateAsync({
      id,
      data: {
        layout_type: layoutType,
      },
    });
    setEditSection(null);
  };

  const handleCategoryToggle = (categoryName: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories((prev) => [...prev, categoryName]);
    } else {
      setSelectedCategories((prev) => prev.filter((c) => c !== categoryName));
    }
  };

  const locationName = room?.location?.name || '-';
  const categoriesDisplay = (() => {
    const cats = room?.categories as string[] | null;
    if (!cats || cats.length === 0) return t('rooms.create.allCategories');
    return cats.join(', ');
  })();
  const layoutLabel = room?.layout_type === 'fixed' ? t('rooms.fixedPositions') : t('rooms.openSpace');

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title=""
          breadcrumbs={[{ label: t('nav.yourGym') }, { label: t('rooms.title'), href: '/room' }, { label: '...' }]}
        />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div>
        <PageHeader title={t('common.noData')} />
        <Button variant="outline" onClick={() => navigate('/room')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('rooms.detail.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={room.name}
        breadcrumbs={[
          { label: t('nav.class') },
          { label: t('rooms.title'), href: '/room' },
          { label: room.name },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/room')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('rooms.detail.backToList')}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Information Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-primary">
              {t('rooms.create.information')}
            </CardTitle>
            {editSection !== 'information' && (
              <Button variant="ghost" size="icon" onClick={() => startEdit('information')}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editSection === 'information' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('rooms.create.roomNameEn')} <span className="text-destructive">*</span></Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('rooms.create.roomNameTh')}</Label>
                    <Input value={nameTh} onChange={(e) => setNameTh(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('rooms.create.location')} <span className="text-destructive">*</span></Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('rooms.create.maxCapacity')} <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min={1}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-1" />{t('common.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveInformation}
                    disabled={updateRoom.isPending || !name.trim() || !locationId}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">{t('rooms.create.roomNameEn')}</p>
                  <p className="font-medium">{room.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t('rooms.create.roomNameTh')}</p>
                  <p className="font-medium">{room.name_th || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t('rooms.create.location')}</p>
                  <p className="font-medium">{locationName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t('rooms.create.maxCapacity')}</p>
                  <p className="font-medium">{room.max_capacity || 20}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-primary">
              {t('rooms.create.access')}
            </CardTitle>
            {editSection !== 'access' && (
              <Button variant="ghost" size="icon" onClick={() => startEdit('access')}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editSection === 'access' ? (
              <div className="space-y-4">
                <Label>{t('rooms.create.categoriesCanUse')}</Label>
                <RadioGroup
                  value={allCategories ? 'all' : 'specific'}
                  onValueChange={(val) => setAllCategories(val === 'all')}
                  className="grid grid-cols-2 gap-3"
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                      allCategories ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setAllCategories(true)}
                  >
                    <RadioGroupItem value="all" id="edit-all" />
                    <Label htmlFor="edit-all" className="cursor-pointer">{t('rooms.create.allCategories')}</Label>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                      !allCategories ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setAllCategories(false)}
                  >
                    <RadioGroupItem value="specific" id="edit-specific" />
                    <Label htmlFor="edit-specific" className="cursor-pointer">{t('rooms.create.specificCategories')}</Label>
                  </div>
                </RadioGroup>
                {!allCategories && (
                  <div className="grid grid-cols-2 gap-2 p-4 bg-muted/50 rounded-lg">
                    {classCategories?.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-cat-${cat.id}`}
                          checked={selectedCategories.includes(cat.name)}
                          onCheckedChange={(checked) => handleCategoryToggle(cat.name, checked as boolean)}
                        />
                        <Label htmlFor={`edit-cat-${cat.id}`} className="cursor-pointer text-sm">{cat.name}</Label>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-1" />{t('common.cancel')}
                  </Button>
                  <Button size="sm" onClick={saveAccess} disabled={updateRoom.isPending}>
                    {t('common.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">{t('rooms.create.categoriesCanUse')}</p>
                <p className="font-medium">{categoriesDisplay}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Layout Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-primary">
              {t('rooms.create.roomLayout')}
            </CardTitle>
            {editSection !== 'layout' && (
              <Button variant="ghost" size="icon" onClick={() => startEdit('layout')}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editSection === 'layout' ? (
              <div className="space-y-4">
                <Label>{t('rooms.create.roomLayout')}</Label>
                <RadioGroup
                  value={layoutType}
                  onValueChange={(val) => setLayoutType(val as 'open' | 'fixed')}
                  className="grid grid-cols-2 gap-3"
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                      layoutType === 'open' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setLayoutType('open')}
                  >
                    <RadioGroupItem value="open" id="edit-layout-open" />
                    <Label htmlFor="edit-layout-open" className="cursor-pointer">{t('rooms.create.openSpaceDesc')}</Label>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                      layoutType === 'fixed' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setLayoutType('fixed')}
                  >
                    <RadioGroupItem value="fixed" id="edit-layout-fixed" />
                    <Label htmlFor="edit-layout-fixed" className="cursor-pointer">{t('rooms.create.fixedPositionsDesc')}</Label>
                  </div>
                </RadioGroup>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-1" />{t('common.cancel')}
                  </Button>
                  <Button size="sm" onClick={saveLayout} disabled={updateRoom.isPending}>
                    {t('common.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">{t('rooms.layoutType')}</p>
                <Badge variant="secondary" className="font-normal">{layoutLabel}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoomDetails;
