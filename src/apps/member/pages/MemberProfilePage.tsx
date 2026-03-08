import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MemberProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';

  const profileItems = [
    { label: 'Edit Profile', path: '/member/profile/edit' },
    { label: 'Attendance History', path: '/member/attendance' },
    { label: 'Notifications', path: '/member/notifications' },
    { label: 'Support', path: '/member/support' },
  ];

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Profile" />

      {/* Avatar & name */}
      <Section className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
            {firstName.charAt(0)}{lastName.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {firstName} {lastName}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </Section>

      {/* Menu items */}
      <Section className="mb-6">
        <div className="rounded-lg bg-card overflow-hidden divide-y divide-border">
          {profileItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Section>

      {/* Sign out */}
      <Section>
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </Section>
    </div>
  );
}
