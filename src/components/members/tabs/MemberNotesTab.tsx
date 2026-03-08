import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/formatters';
import { useCreateMemberNote, type MemberNote } from '@/hooks/useMemberDetails';

interface MemberNotesTabProps {
  memberId: string;
  notes: MemberNote[];
  isLoading: boolean;
}

export const MemberNotesTab = ({ memberId, notes, isLoading }: MemberNotesTabProps) => {
  const { t } = useLanguage();
  const createNote = useCreateMemberNote();
  const [newNote, setNewNote] = useState('');

  const handleAdd = () => {
    if (!newNote.trim()) return;
    createNote.mutate({ memberId, note: newNote }, { onSuccess: () => setNewNote('') });
  };

  return (
    <>
      <div className="mb-4 space-y-2">
        <Textarea
          placeholder={t('members.addNotePlaceholder')}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[80px]"
        />
        <Button onClick={handleAdd} disabled={!newNote.trim() || createNote.isPending}>
          {t('members.addNote')}
        </Button>
      </div>
      {isLoading ? <Skeleton className="h-48" /> : notes.length === 0 ? <EmptyState message={t('common.noData')} /> : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="py-3">
                <p className="text-sm">{note.note}</p>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{note.staff ? `${note.staff.first_name} ${note.staff.last_name}` : '-'}</span>
                  <span>{formatDateTime(note.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};
