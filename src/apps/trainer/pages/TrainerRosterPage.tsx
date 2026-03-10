import { useTranslation } from 'react-i18next';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Users } from 'lucide-react';

export default function TrainerRosterPage() {
  const { t } = useTranslation();

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('trainer.nav.roster')} subtitle={t('trainer.yourAssignedMembers')} />
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title={t('trainer.comingSoon')}
        description={t('trainer.rosterComingSoonDesc')}
      />
    </div>
  );
}
