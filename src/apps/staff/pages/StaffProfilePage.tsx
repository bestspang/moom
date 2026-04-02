import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Bell, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StaffProfilePage() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.first_name ?? 'Staff';
  const email = user?.email ?? '';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('staff.profile')} />

      <Section className="mb-4">
        <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {(firstName || 'S').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{firstName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <p className="text-xs text-primary mt-0.5">{t('staff.staffRole')}</p>
          </div>
        </div>
      </Section>

      <Section title={t('staff.settingsTitle')}>
        <div className="space-y-1">
          <ListCard title={t('staff.notifications')} leading={<Bell className="h-5 w-5 text-muted-foreground" />} showChevron />
          <ListCard title={t('staff.preferences')} leading={<Settings className="h-5 w-5 text-muted-foreground" />} showChevron />
          <ListCard title={t('staff.helpAndSupport')} leading={<HelpCircle className="h-5 w-5 text-muted-foreground" />} showChevron />
        </div>
      </Section>

      <Section className="mt-6">
        <Button variant="outline" className="w-full text-destructive border-destructive/30" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {t('staff.signOut')}
        </Button>
      </Section>
    </div>
  );
}
