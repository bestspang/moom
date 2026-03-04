import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMembers } from '@/hooks/useMembers';
import { useCreateBooking } from '@/hooks/useClassBookings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';

interface AddBookingFormProps {
  scheduleId: string;
  existingMemberIds: string[];
  onSuccess: () => void;
}

export const AddBookingForm = ({ scheduleId, existingMemberIds, onSuccess }: AddBookingFormProps) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const createBooking = useCreateBooking();

  const { data: membersData } = useMembers({ search, perPage: 10 });
  const members = membersData?.members || [];

  // Filter out already-booked members
  const availableMembers = members.filter(m => !existingMemberIds.includes(m.id));

  const handleSelect = (memberId: string) => {
    createBooking.mutate(
      { scheduleId, memberId },
      { onSuccess: () => onSuccess() }
    );
  };

  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('schedule.searchMember')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9"
          autoFocus
        />
      </div>

      {search.length >= 2 && (
        <ScrollArea className="max-h-40">
          <div className="space-y-1">
            {availableMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">{t('common.noData')}</p>
            ) : (
              availableMembers.map((member) => (
                <Button
                  key={member.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-2"
                  onClick={() => handleSelect(member.id)}
                  disabled={createBooking.isPending}
                >
                  <Avatar className="h-7 w-7 mr-2">
                    <AvatarFallback className="text-xs">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm">{member.first_name} {member.last_name}</p>
                    <p className="text-xs text-muted-foreground">{member.member_id}</p>
                  </div>
                  {createBooking.isPending && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
