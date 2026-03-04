import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembersForCheckIn, useMemberPackages, useCreateCheckIn, useCheckDuplicate } from '@/hooks/useLobby';
import { useLocations } from '@/hooks/useLocations';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const checkInSchema = z.object({
  member_id: z.string().min(1, 'Member is required'),
  member_package_id: z.string().optional(),
  location_id: z.string().min(1, 'Location is required'),
  check_in_type: z.string().default('gym'),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckInDialog({ open, onOpenChange }: CheckInDialogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  const { data: members = [] } = useMembersForCheckIn(memberSearch);
  const { data: memberPackages = [] } = useMemberPackages(selectedMemberId);
  const { data: locations = [] } = useLocations();
  const createCheckIn = useCreateCheckIn();

  const form = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      member_id: '',
      member_package_id: undefined,
      location_id: '',
      check_in_type: 'gym',
    },
  });

  const locationId = form.watch('location_id');
  const { data: isDuplicate } = useCheckDuplicate(selectedMemberId, locationId || null, new Date());

  React.useEffect(() => {
    if (open) {
      form.reset();
      setMemberSearch('');
      setSelectedMemberId(null);
      setConfirmedDuplicate(false);
    }
  }, [open, form]);

  const onSubmit = async (data: CheckInFormData) => {
    if (isDuplicate && !confirmedDuplicate) {
      setConfirmedDuplicate(false);
      return;
    }

    // Get staff id from user metadata or use user.id
    const staffId = user?.id || null;

    await createCheckIn.mutateAsync({
      member_id: data.member_id,
      member_package_id: data.member_package_id === 'none' ? null : (data.member_package_id || null),
      location_id: data.location_id,
      check_in_type: data.check_in_type,
      check_in_time: new Date().toISOString(),
      checkin_method: 'manual',
      created_by: staffId,
    });
    onOpenChange(false);
  };

  const handleMemberSelect = (memberId: string) => {
    form.setValue('member_id', memberId);
    setSelectedMemberId(memberId);
    setConfirmedDuplicate(false);
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('lobby.checkIn')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Location Selection (Required, First) */}
            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('lobby.location')} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('lobby.location')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Member Search (enabled after location) */}
            <FormField
              control={form.control}
              name="member_id"
              render={() => (
                <FormItem>
                  <FormLabel>{t('lobby.name')} *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {!locationId ? (
                        <p className="text-sm text-muted-foreground">{t('lobby.selectLocationFirst')}</p>
                      ) : (
                        <>
                          <Input
                            placeholder={t('lobby.searchPlaceholder')}
                            value={memberSearch}
                            onChange={(e) => {
                              setMemberSearch(e.target.value);
                              if (selectedMemberId) {
                                setSelectedMemberId(null);
                                form.setValue('member_id', '');
                              }
                            }}
                            disabled={!locationId}
                          />
                          {memberSearch.length >= 2 && members.length > 0 && !selectedMemberId && (
                            <div className="border rounded-md max-h-40 overflow-y-auto">
                              {members.map((member) => (
                                <button
                                  key={member.id}
                                  type="button"
                                  className="w-full flex items-center gap-3 p-2 hover:bg-muted text-left"
                                  onClick={() => handleMemberSelect(member.id)}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {member.first_name[0]}{member.last_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">
                                      {member.first_name} {member.last_name}
                                      {member.nickname && <span className="text-muted-foreground"> ({member.nickname})</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {member.member_id}{member.phone ? ` · ${member.phone}` : ''}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      {selectedMember && (
                        <div className="flex items-center gap-3 p-2 bg-muted rounded-md">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {selectedMember.first_name[0]}{selectedMember.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {selectedMember.first_name} {selectedMember.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedMember.member_id}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMemberId(null);
                              setMemberSearch('');
                              form.setValue('member_id', '');
                              setConfirmedDuplicate(false);
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duplicate warning */}
            {isDuplicate && selectedMemberId && !confirmedDuplicate && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{t('lobby.duplicateWarning')}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmedDuplicate(true)}>
                    {t('lobby.allowDuplicate')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Package Selection */}
            {selectedMemberId && (
              <FormField
                control={form.control}
                name="member_package_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('lobby.packageUsed')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('lobby.packageUsed')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('lobby.noPackage')}</SelectItem>
                        {memberPackages.map((mp: any) => (
                          <SelectItem key={mp.id} value={mp.id}>
                            {mp.package?.name_en || 'Package'}
                            {mp.sessions_remaining !== null && ` (${mp.sessions_remaining} left)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Check-in Type */}
            <FormField
              control={form.control}
              name="check_in_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('lobby.usageType')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gym">{t('lobby.gym')}</SelectItem>
                      <SelectItem value="class">{t('schedule.class')}</SelectItem>
                      <SelectItem value="pt">PT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createCheckIn.isPending || !selectedMemberId || (isDuplicate && !confirmedDuplicate)}
              >
                {createCheckIn.isPending ? t('common.loading') : t('lobby.checkIn')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
