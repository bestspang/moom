import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/formatters';
import { useUpdateMember, type Member } from '@/hooks/useMemberDetails';

interface MemberProfileTabProps {
  member: Member;
}

export const MemberProfileTab = ({ member }: MemberProfileTabProps) => {
  const { t } = useLanguage();
  const updateMember = useUpdateMember();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const handleStartEdit = () => {
    setDraft({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      nickname: member.nickname || '',
      email: member.email || '',
      phone: member.phone || '',
      gender: member.gender || '',
      date_of_birth: member.date_of_birth || '',
      tax_id: member.tax_id || '',
      address: member.address || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const oldData = {
      first_name: member.first_name,
      last_name: member.last_name,
      nickname: member.nickname,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      date_of_birth: member.date_of_birth,
      tax_id: member.tax_id,
      address: member.address,
    };
    updateMember.mutate({ id: member.id, data: draft, oldData }, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const fields: { key: string; label: string; type?: string; colSpan?: number }[] = [
    { key: 'first_name', label: t('members.firstName') },
    { key: 'last_name', label: t('members.lastName') },
    { key: 'nickname', label: t('members.nickname') },
    { key: 'email', label: t('members.email') },
    { key: 'phone', label: t('members.phone') },
    { key: 'gender', label: t('members.gender') },
    { key: 'date_of_birth', label: t('members.dateOfBirth'), type: 'date' },
    { key: 'tax_id', label: t('members.taxId') },
    { key: 'address', label: t('members.address'), colSpan: 2 },
  ];

  const getValue = (key: string) => {
    if (isEditing) return draft[key] || '';
    const val = (member as any)[key];
    if (key === 'date_of_birth' && val) return formatDate(val);
    return val || '';
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={updateMember.isPending}>
              {t('common.save')}
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={handleStartEdit}>
            {t('common.edit')}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.colSpan === 2 ? 'md:col-span-2' : undefined}>
            <Label>{f.label}</Label>
            <Input
              type={isEditing && f.type === 'date' ? 'date' : 'text'}
              value={getValue(f.key)}
              readOnly={!isEditing}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
    </>
  );
};
