import { useLanguage } from '@/contexts/LanguageContext';
import { StatusBadge } from '@/components/common';
import { MemberTimeline } from '@/components/members/MemberTimeline';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pencil } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import type { Member, MemberPackage, MemberAttendance, MemberSuspension } from '@/hooks/useMemberDetails';

interface MemberOverviewTabProps {
  member: Member;
  attendance: MemberAttendance[];
  packages: MemberPackage[];
  suspensions: MemberSuspension[];
  getStatusVariant: (status: string | null) => string;
  onEditProfile: () => void;
}

export const MemberOverviewTab = ({
  member,
  attendance,
  packages,
  suspensions,
  getStatusVariant,
  onEditProfile,
}: MemberOverviewTabProps) => {
  const { t } = useLanguage();

  const profileFields: { label: string; value: string | null | undefined }[] = [
    { label: t('members.firstName'), value: member.first_name },
    { label: t('members.lastName'), value: member.last_name },
    { label: t('members.nickname'), value: member.nickname },
    { label: t('members.email'), value: member.email },
    { label: t('members.phone'), value: member.phone },
    { label: t('members.gender'), value: member.gender },
    { label: t('members.dateOfBirth'), value: member.date_of_birth ? formatDate(member.date_of_birth) : null },
    { label: t('members.taxId'), value: member.tax_id },
    { label: t('members.address'), value: member.address },
  ];

  return (
    <div className="space-y-6">
      {/* Account Details */}
      <div>
        <h3 className="font-semibold mb-4">{t('members.accountDetails')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t('members.memberId')}</p>
            <p className="font-medium">{member.member_id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('common.status')}</p>
            <StatusBadge variant={getStatusVariant(member.status) as any}>
              {member.status || 'active'}
            </StatusBadge>
          </div>
          <div>
            <p className="text-muted-foreground">{t('members.joined')}</p>
            <p className="font-medium">{formatDate(member.member_since)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('members.location')}</p>
            <p className="font-medium">{member.register_location?.name || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('members.riskLevel')}</p>
            <StatusBadge variant={`${member.risk_level || 'low'}-risk` as any}>
              {member.risk_level || 'low'}
            </StatusBadge>
          </div>
          <div>
            <p className="text-muted-foreground">{t('members.gender')}</p>
            <p className="font-medium">{member.gender || '-'}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Profile Info (read-only) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t('members.tabs.profile')}</h3>
          <Button variant="outline" size="sm" onClick={onEditProfile}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            {t('common.edit')}
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {profileFields.map((f) => (
            <div key={f.label} className={f.label === t('members.address') ? 'sm:col-span-2' : ''}>
              <p className="text-muted-foreground text-xs">{f.label}</p>
              <p className="font-medium mt-0.5">{f.value || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      <MemberTimeline
        memberSince={member.member_since}
        attendance={attendance}
        packages={packages}
        suspensions={suspensions}
        riskLevel={member.risk_level}
      />
    </div>
  );
};
