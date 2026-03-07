import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Users, Plus } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MemberCommunicationLogProps {
  memberId: string;
}

const COMM_TYPES = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'line', label: 'LINE', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'in_person', label: 'In Person', icon: Users },
];

export function MemberCommunicationLog({ memberId }: MemberCommunicationLogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [commType, setCommType] = useState('call');

  const { data: logs = [], isLoading } = useQuery({
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
        note_type: commType,
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

  const getTypeConfig = (type: string) => COMM_TYPES.find((c) => c.value === type) || COMM_TYPES[0];

  return (
    <div className="space-y-4">
      {/* Add new communication */}
      <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <Select value={commType} onValueChange={setCommType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMM_TYPES.map((ct) => (
                <SelectItem key={ct.value} value={ct.value}>
                  {ct.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => createComm.mutate()}
            disabled={!newNote.trim() || createComm.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('communication.logEntry')}
          </Button>
        </div>
        <Textarea
          placeholder={t('communication.placeholder')}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={2}
        />
      </div>

      {/* Communication history */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
      ) : logs.length === 0 ? (
        <EmptyState message={t('communication.noLogs')} />
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => {
            const config = getTypeConfig(log.note_type);
            const Icon = config.icon;
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                <div className="mt-0.5 p-1.5 rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </span>
                    {log.created_by_staff && (
                      <span className="text-xs text-muted-foreground">
                        by {log.created_by_staff.first_name} {log.created_by_staff.last_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{log.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
