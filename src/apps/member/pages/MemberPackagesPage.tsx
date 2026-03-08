import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';

export default function MemberPackagesPage() {
  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Packages" subtitle="Active & available packages" />
      <Section>
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No active packages</p>
          <p className="text-xs text-muted-foreground mt-1">
            Browse available packages to start your training
          </p>
        </div>
      </Section>
    </div>
  );
}
