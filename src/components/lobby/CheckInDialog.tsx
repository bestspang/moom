import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMembersForCheckIn, useMemberPackages, useCreateCheckIn } from '@/hooks/useLobby';
import { useLocations } from '@/hooks/useLocations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const checkInSchema = z.object({
  member_id: z.string().min(1, 'Member is required'),
  member_package_id: z.string().optional(),
  location_id: z.string().optional(),
  check_in_type: z.string().default('gym'),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckInDialog({ open, onOpenChange }: CheckInDialogProps) {
  const { t } = useLanguage();
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  const { data: members = [], isLoading: membersLoading } = useMembersForCheckIn(memberSearch);
  const { data: memberPackages = [], isLoading: packagesLoading } = useMemberPackages(selectedMemberId);
  const { data: locations = [] } = useLocations();
  const createCheckIn = useCreateCheckIn();

  const form = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      member_id: '',
      member_package_id: undefined,
      location_id: undefined,
      check_in_type: 'gym',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset();
      setMemberSearch('');
      setSelectedMemberId(null);
    }
  }, [open, form]);

  const onSubmit = async (data: CheckInFormData) => {
    await createCheckIn.mutateAsync({
      member_id: data.member_id,
      member_package_id: data.member_package_id || null,
      location_id: data.location_id || null,
      check_in_type: data.check_in_type,
      check_in_time: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  const handleMemberSelect = (memberId: string) => {
    form.setValue('member_id', memberId);
    setSelectedMemberId(memberId);
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
            {/* Member Search */}
            <FormField
              control={form.control}
              name="member_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('lobby.name')}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        placeholder={t('lobby.searchName')}
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
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
                              <div>
                                <p className="font-medium text-sm">
                                  {member.first_name} {member.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {member.member_id}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
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
                        {memberPackages.map((mp) => (
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

            {/* Location Selection */}
            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('lobby.location')}</FormLabel>
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

            {/* Check-in Type */}
            <FormField
              control={form.control}
              name="check_in_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gym">{t('dashboard.gymCheckin')}</SelectItem>
                      <SelectItem value="class">{t('schedule.class')}</SelectItem>
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
              <Button type="submit" disabled={createCheckIn.isPending || !selectedMemberId}>
                {createCheckIn.isPending ? t('common.loading') : t('lobby.checkIn')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
