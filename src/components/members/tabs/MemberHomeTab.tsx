import { StatusBadge } from '@/components/common';
import { MemberTimeline } from '@/components/members/MemberTimeline';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/formatters';
import type { Member, MemberPackage, MemberAttendance, MemberSuspension } from '@/hooks/useMemberDetails';

interface MemberHomeTabProps {
  member: Member;
  attendance: MemberAttendance[];
  packages: MemberPackage[];
  suspensions: MemberSuspension[];
  getStatusVariant: (status: string | null) => string;
}

export const MemberHomeTab = ({ member, attendance, packages, suspensions, getStatusVariant }: MemberHomeTabProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">{t('members.accountDetails')}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t('members.memberId')}</p>
            <p className="font-medium">{member.member_id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('common.status')}</p>
            <StatusBadge variant={getStatusVariant(member.status) as any}>{member.status || 'active'}</StatusBadge>
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
