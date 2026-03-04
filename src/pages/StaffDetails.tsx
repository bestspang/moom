import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStaffMember, useUpdateStaff, useStaffPositions, useInviteStaff, useAddStaffPosition, useRemoveStaffPosition } from '@/hooks/useStaff';
import { useRoles } from '@/hooks/useRoles';
import { useLocations } from '@/hooks/useLocations';
import { PageHeader } from '@/components/common';
import { StatusBadge } from '@/components/common';
import { LineIdentityCard } from '@/components/common/LineIdentityCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Check, X, Send, ArrowLeft, MapPin, Globe, Plus, Trash2 } from 'lucide-react';
import { getInitials } from '@/lib/formatters';
import { toast } from 'sonner';

const StaffDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: staff, isLoading } = useStaffMember(id!);
  const { data: positions, isLoading: positionsLoading } = useStaffPositions(id!);
  const { data: locations } = useLocations();
  const { data: roles } = useRoles();
  const updateStaff = useUpdateStaff();
  const inviteStaff = useInviteStaff();
  const addPosition = useAddStaffPosition();
  const removePosition = useRemoveStaffPosition();

  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Add position form state
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newScopeAll, setNewScopeAll] = useState(true);
  const [newLocationIds, setNewLocationIds] = useState<string[]>([]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!staff) {
    return <div className="text-center py-12 text-muted-foreground">{t('common.noData')}</div>;
  }

  const staffAny = staff as any;

  const startEdit = (field: string, value: string) => {
    setEditField(field);
    setEditValue(value || '');
  };

  const cancelEdit = () => {
    setEditField(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editField) return;
    await updateStaff.mutateAsync({ id: id!, data: { [editField]: editValue.trim() || null } as any });
    setEditField(null);
    setEditValue('');
  };

  const handleResendInvitation = async () => {
    await inviteStaff.mutateAsync({ staff_id: id!, email: staff.email || undefined });
    toast.success(t('staff.invitationSent'));
  };

  const handleAddPosition = async () => {
    if (!newRoleId) {
      toast.error('Please select a role');
      return;
    }
    await addPosition.mutateAsync({
      staff_id: id!,
      role_id: newRoleId,
      scope_all_locations: newScopeAll,
      location_ids: newScopeAll ? [] : newLocationIds,
    });
    setShowAddPosition(false);
    setNewRoleId('');
    setNewScopeAll(true);
    setNewLocationIds([]);
  };

  const handleRemovePosition = async (posId: string) => {
    await removePosition.mutateAsync({ id: posId, staff_id: id! });
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'paid';
      case 'pending': return 'pending';
      case 'terminated': return 'voided';
      default: return 'default';
    }
  };

  const EditableField = ({ field, label, value }: { field: string; label: string; value: string | null }) => (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {editField === field ? (
          <div className="flex items-center gap-2">
            <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="h-8 text-sm" />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={saveEdit} disabled={updateStaff.isPending}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm">{value || '-'}</p>
        )}
      </div>
      {editField !== field && (
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 mt-4" onClick={() => startEdit(field, value || '')}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  const locationMap = new Map(locations?.map(l => [l.id, l.name]) || []);

  return (
    <div>
      <PageHeader
        title={t('staff.staffDetails')}
        breadcrumbs={[
          { label: t('nav.yourGym') },
          { label: t('staff.title'), href: '/admin' },
          { label: `${staff.first_name} ${staff.last_name}` },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('common.back')}
            </Button>
            {staff.status === 'pending' && (
              <Button
                onClick={handleResendInvitation}
                disabled={inviteStaff.isPending}
                className="bg-primary hover:bg-primary-hover"
              >
                <Send className="h-4 w-4 mr-1" />
                {t('staff.resendInvitation')}
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList>
          <TabsTrigger value="profile">{t('staff.profile')}</TabsTrigger>
          <TabsTrigger value="positions">{t('staff.positionsAndAvailability')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main info card */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {getInitials(staff.first_name, staff.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{staff.first_name} {staff.last_name}</CardTitle>
                    {staff.nickname && <p className="text-sm text-muted-foreground">{staff.nickname}</p>}
                    <StatusBadge variant={getStatusVariant(staff.status)} className="mt-1">
                      {staff.status || 'unknown'}
                    </StatusBadge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <EditableField field="first_name" label={t('staff.firstName')} value={staff.first_name} />
                <EditableField field="last_name" label={t('staff.lastName')} value={staff.last_name} />
                <EditableField field="nickname" label={t('staff.nickname')} value={staff.nickname} />
                <EditableField field="date_of_birth" label={t('staff.dateOfBirth')} value={staffAny.date_of_birth} />
                <EditableField field="gender" label={t('staff.gender')} value={staffAny.gender} />
                <EditableField field="phone" label={t('staff.contactNumber')} value={staff.phone} />
                <EditableField field="email" label={t('leads.email')} value={staff.email} />

                {/* Structured address */}
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">{t('staff.address')}</p>
                  <div className="space-y-3">
                    <EditableField field="address_1" label={t('staff.address1')} value={staffAny.address_1} />
                    <EditableField field="address_2" label={t('staff.address2')} value={staffAny.address_2} />
                    <EditableField field="subdistrict" label={t('staff.subdistrict')} value={staffAny.subdistrict} />
                    <EditableField field="district" label={t('staff.district')} value={staffAny.district} />
                    <EditableField field="province" label={t('staff.province')} value={staffAny.province} />
                    <EditableField field="postal_code" label={t('staff.postalCode')} value={staffAny.postal_code} />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">{t('staff.emergencyContact')}</p>
                  <div className="space-y-3">
                    <EditableField field="emergency_first_name" label={t('staff.emergencyFirstName')} value={staffAny.emergency_first_name} />
                    <EditableField field="emergency_last_name" label={t('staff.emergencyLastName')} value={staffAny.emergency_last_name} />
                    <EditableField field="emergency_phone" label={t('staff.emergencyPhone')} value={staffAny.emergency_phone} />
                    <EditableField field="emergency_relationship" label={t('staff.emergencyRelationship')} value={staffAny.emergency_relationship} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LINE Identity */}
            <div className="space-y-4">
              <LineIdentityCard ownerType="staff" ownerId={id!} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('staff.positions')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAddPosition(!showAddPosition)}>
                <Plus className="h-4 w-4 mr-1" />
                {t('common.add')}
              </Button>
            </CardHeader>
            <CardContent>
              {/* Add position form */}
              {showAddPosition && (
                <div className="mb-4 p-4 rounded-lg border bg-muted/20 space-y-4">
                  <div className="space-y-2">
                    <Label>{t('staff.role')}</Label>
                    <Select value={newRoleId} onValueChange={setNewRoleId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('staff.selectRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={newScopeAll} onCheckedChange={setNewScopeAll} />
                    <Label>{t('staff.allLocations')}</Label>
                  </div>

                  {!newScopeAll && (
                    <div className="space-y-2">
                      <Label>{t('staff.specificLocations')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {locations?.map((loc) => (
                          <div key={loc.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={newLocationIds.includes(loc.id)}
                              onCheckedChange={(checked) => {
                                setNewLocationIds(prev =>
                                  checked ? [...prev, loc.id] : prev.filter(id => id !== loc.id)
                                );
                              }}
                            />
                            <span className="text-sm">{loc.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddPosition} disabled={addPosition.isPending}>
                      {t('common.save')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddPosition(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}

              {positionsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : !positions?.length ? (
                <p className="text-sm text-muted-foreground py-4">{t('common.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {positions.map((pos: any) => (
                    <div key={pos.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="space-y-1">
                        <Badge variant="secondary">{pos.role?.name || '-'}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {pos.scope_all_locations ? (
                            <>
                              <Globe className="h-3 w-3" />
                              {t('staff.allLocations')}
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3" />
                              {pos.location_ids?.map((lid: string) => locationMap.get(lid) || lid).join(', ') || t('staff.specificLocations')}
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemovePosition(pos.id)}
                        disabled={removePosition.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffDetails;
