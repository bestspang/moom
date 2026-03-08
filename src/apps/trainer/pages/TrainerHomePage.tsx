import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { SummaryCard } from '@/apps/shared/components/SummaryCard';
import { Calendar, Users } from 'lucide-react';

export default function TrainerHomePage() {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader title="Hi, Trainer" subtitle="Today's overview" />
      <Section className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="Today's Classes" value="0" icon={<Calendar className="h-5 w-5" />} />
          <SummaryCard label="Total Bookings" value="0" subtitle="across today" icon={<Users className="h-5 w-5" />} />
        </div>
      </Section>
      <Section title="Today's Schedule">
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No classes today — enjoy your rest day</p>
        </div>
      </Section>
    </div>
  );
}
