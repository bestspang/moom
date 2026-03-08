import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Users } from 'lucide-react';

export default function TrainerRosterPage() {
  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Roster" subtitle="Your assigned members" />
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title="Coming soon"
        description="Member roster management will be available in the next update"
      />
    </div>
  );
}
