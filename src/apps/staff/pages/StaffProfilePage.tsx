import { useAuth } from '@/contexts/AuthContext';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Bell, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StaffProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.first_name ?? 'Staff';
  const email = user?.email ?? '';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Profile" />

      <Section className="mb-4">
        <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{firstName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <p className="text-xs text-primary mt-0.5">Staff</p>
          </div>
        </div>
      </Section>

      <Section title="Settings">
        <div className="space-y-1">
          <ListCard title="Notifications" leading={<Bell className="h-5 w-5 text-muted-foreground" />} showChevron />
          <ListCard title="Preferences" leading={<Settings className="h-5 w-5 text-muted-foreground" />} showChevron />
          <ListCard title="Help & Support" leading={<HelpCircle className="h-5 w-5 text-muted-foreground" />} showChevron />
        </div>
      </Section>

      <Section className="mt-6">
        <Button variant="outline" className="w-full text-destructive border-destructive/30" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </Section>
    </div>
  );
}
