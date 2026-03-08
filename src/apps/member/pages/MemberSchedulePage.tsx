import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';

export default function MemberSchedulePage() {
  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Schedule" subtitle="Browse & book classes" />
      <Section>
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Class schedule coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">
            This will show available classes you can book
          </p>
        </div>
      </Section>
    </div>
  );
}
