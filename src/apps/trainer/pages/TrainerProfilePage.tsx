import { useAuth } from '@/contexts/AuthContext';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Bell, HelpCircle, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildCrossSurfaceUrl } from '@/apps/shared/hostname';
import { buildSessionTransferUrl } from '@/apps/shared/sessionTransfer';
import { toast } from 'sonner';

export default function TrainerProfilePage() {
  const { user, allRoles, signOut } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.first_name ?? 'Trainer';
  const lastName = user?.user_metadata?.last_name ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const email = user?.email ?? '';

  const hasAdminAccess = allRoles.some(r => ['owner', 'admin'].includes(r));

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
            <p className="font-semibold text-foreground truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <p className="text-xs text-primary mt-0.5">Trainer</p>
          </div>
        </div>
      </Section>

      <Section title="Settings">
        <div className="space-y-1">
          <ListCard
            title="Notifications"
            leading={<Bell className="h-5 w-5 text-muted-foreground" />}
            showChevron
            onClick={() => toast.info('Notifications settings coming soon')}
          />
          <ListCard
            title="Preferences"
            leading={<Settings className="h-5 w-5 text-muted-foreground" />}
            showChevron
            onClick={() => toast.info('Preferences coming soon')}
          />
          <ListCard
            title="Help & Support"
            leading={<HelpCircle className="h-5 w-5 text-muted-foreground" />}
            showChevron
            onClick={() => toast.info('Help center coming soon')}
          />
        </div>
      </Section>

      {/* Surface switcher */}
      <Section title="Switch App" className="mt-4">
        <div className="space-y-1">
          {hasAdminAccess && (
            <a href={buildCrossSurfaceUrl('admin', '/')}>
              <ListCard title="Admin Portal" leading={<ShieldCheck className="h-5 w-5 text-muted-foreground" />} showChevron />
            </a>
          )}
          <a href={buildCrossSurfaceUrl('member', '/member')}>
            <ListCard title="Member App" leading={<Users className="h-5 w-5 text-muted-foreground" />} showChevron />
          </a>
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
