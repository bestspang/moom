import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { IdentityLinkingCard } from '../features/auth/IdentityLinkingCard';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

export default function MemberSecurityPage() {
  const { user } = useAuth();

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Security & Login" />

      <Section className="mb-6">
        <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Account Security</p>
            <p className="text-xs text-muted-foreground">
              {user?.email ?? 'Manage your login methods'}
            </p>
          </div>
        </div>

        <IdentityLinkingCard />
      </Section>
    </div>
  );
}
