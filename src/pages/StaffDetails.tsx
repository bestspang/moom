import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStaffMember, useUpdateStaff, useStaffPositions, useInviteStaff } from '@/hooks/useStaff';
import { useLocations } from '@/hooks/useLocations';
import { PageHeader } from '@/components/common';
import { StatusBadge } from '@/components/common';
import { LineIdentityCard } from '@/components/common/LineIdentityCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pencil, Check, X, Send, ArrowLeft, MapPin, Globe } from 'lucide-react';
import { getInitials } from '@/lib/formatters';
import { toast } from 'sonner';

const StaffDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: staff, isLoading } = useStaffMember(id!);
  const { data: positions, isLoading: positionsLoading } = useStaffPositions(id!);
  const { data: locations } = useLocations();
  const updateStaff = useUpdateStaff();
  const inviteStaff = useInviteStaff();

  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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
    await updateStaff.mutateAsync({ id: id!, data: { [editField]: editValue.trim() || null } });
    setEditField(null);
    setEditValue('');
  };

  const handleResendInvitation = async () => {
    await inviteStaff.mutateAsync({ staff_id: id!, email: staff.email || undefined });
    toast.success(t('staff.invitationSent'));
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'paid';
      case 'pending': return 'pending';
      case 'terminated': return 'voided';
      default: return 'default';
    }
  };

  const EditableField = ({ field, label, value, multiline = false }: { field: string; label: string; value: string | null; multiline?: boolean }) => (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {editField === field ? (
          <div className="flex items-center gap-2">
            {multiline ? (
              <Textarea value={editValue} onChange={e => setEditValue(e.target.value)} rows={2} className="text-sm" />
            ) : (
              <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="h-8 text-sm" />
            )}
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
                <EditableField field="first_name" label="First name" value={staff.first_name} />
                <EditableField field="last_name" label="Last name" value={staff.last_name} />
                <EditableField field="nickname" label="Nickname" value={staff.nickname} />
                <EditableField field="phone" label={t('staff.contactNumber')} value={staff.phone} />
                <EditableField field="email" label={t('leads.email')} value={staff.email} />
                <EditableField field="address" label={t('staff.address')} value={(staff as any).address} multiline />
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
            <CardHeader>
              <CardTitle className="text-base">{t('staff.positions')}</CardTitle>
            </CardHeader>
            <CardContent>
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
