import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { ScanLine } from 'lucide-react';

export default function StaffCheckinPage() {
  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Check-in" subtitle="Scan member QR codes" />
      <EmptyState
        icon={<ScanLine className="h-10 w-10" />}
        title="QR Scanner coming soon"
        description="You'll be able to scan member check-in QR codes here"
      />
    </div>
  );
}
