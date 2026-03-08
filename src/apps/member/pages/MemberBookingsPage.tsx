import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';

export default function MemberBookingsPage() {
  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Bookings" subtitle="Your upcoming & past bookings" />
      <Section>
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No bookings yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Book a class from the schedule to get started
          </p>
        </div>
      </Section>
    </div>
  );
}
