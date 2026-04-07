import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, MessageSquare, Users, Plus, StickyNote } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import { useCreateMemberNote, type MemberNote } from '@/hooks/useMemberDetails';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MemberRecordsTabProps {
  memberId: string;
  notes: MemberNote[];
  isLoading: boolean;
}

const RECORD_TYPES = [
  { value: 'all', label: 'All', icon: StickyNote },
  { value: 'note', label: 'Note', icon: StickyNote },
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'line', label: 'LINE', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'in_person', label: 'In Person', icon: Users },
];

const getTypeIcon = (type: string) => {
  const found = RECORD_TYPES.find((r) => r.value === type);
  return found?.icon || StickyNote;
};

const getTypeLabel = (type: string) => {
  const found = RECORD_TYPES.find((r) => r.value === type);
  return found?.label || type;
};

export const MemberRecordsTab = ({ memberId, notes, isLoading }: MemberRecordsTabProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createNote = useCreateMemberNote();
  const [newNote, setNewNote] = useState('');
  const [entryType, setEntryType] = useState('note');
  const [filter, setFilter] = useState('all');

  // Fetch communication logs
  const { data: commLogs = [], isLoading: commLoading } = useQuery({
    queryKey: ['member-communications', memberId],
    enabled: !!user && !!memberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_notes')
        .select('*, created_by_staff:staff!member_notes_created_by_fkey(first_name, last_name)')
        .eq('member_id', memberId)
        .neq('note_type', 'note')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createComm = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('member_notes').insert({
        member_id: memberId,
        note: newNote,
        note_type: entryType,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-communications', memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-notes', memberId] });
      setNewNote('');
      toast.success(t('communication.logged'));
    },
    onError: () => {
      toast.error(t('communication.logFailed'));
    },
  });

  const handleAdd = () => {
    if (!newNote.trim()) return;
    if (entryType === 'note') {
      createNote.mutate({ memberId, note: newNote }, { onSuccess: () => setNewNote('') });
    } else {
      createComm.mutate();
    }
  };

  // Combine notes + comm logs into unified feed
  // Filter notes prop to only include type 'note' or untyped to avoid duplicates with commLogs
  const noteOnlyRecords = notes.filter((n: any) => !n.note_type || n.note_type === 'note');

  const allRecords = [
    ...noteOnlyRecords.map((n) => ({
      id: n.id,
      type: 'note' as const,
      text: n.note,
      date: n.created_at,
      staffName: n.staff ? `${n.staff.first_name} ${n.staff.last_name}` : null,
    })),
    ...commLogs.map((l: any) => ({
      id: l.id,
      type: l.note_type as string,
      text: l.note,
      date: l.created_at,
      staffName: l.created_by_staff
        ? `${l.created_by_staff.first_name} ${l.created_by_staff.last_name}`
        : null,
    })),
  ]
    .filter((r) => filter === 'all' || r.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isPending = createNote.isPending || createComm.isPending;
  const loading = isLoading || commLoading;

  return (
    <div className="space-y-4">
      {/* Add new entry */}
      <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <Select value={entryType} onValueChange={setEntryType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECORD_TYPES.filter((r) => r.value !== 'all').map((rt) => (
                <SelectItem key={rt.value} value={rt.value}>
                  {rt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAdd} disabled={!newNote.trim() || isPending}>
            <Plus className="h-4 w-4 mr-1" />
            {t('common.save')}
          </Button>
        </div>
        <Textarea
          placeholder={t('members.addNotePlaceholder')}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={2}
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {RECORD_TYPES.map((rt) => (
          <Button
            key={rt.value}
            variant={filter === rt.value ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilter(rt.value)}
          >
            {rt.label}
          </Button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <Skeleton className="h-48" />
      ) : allRecords.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <div className="space-y-3">
          {allRecords.map((record) => {
            const Icon = getTypeIcon(record.type);
            return (
              <Card key={record.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-full bg-muted shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{record.text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {getTypeLabel(record.type)}
                        </Badge>
                        {record.staffName && (
                          <span className="text-xs text-muted-foreground">{record.staffName}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDateTime(record.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
