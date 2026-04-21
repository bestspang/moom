import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Bell, HelpCircle, ShieldCheck, Users, Globe, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildCrossSurfaceUrl } from '@/apps/shared/hostname';
import { buildSessionTransferUrl } from '@/apps/shared/sessionTransfer';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';


export default function TrainerProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, allRoles, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const firstName = user?.user_metadata?.first_name ?? t('trainer.trainerRole');
  const lastName = user?.user_metadata?.last_name ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const email = user?.email ?? '';

  const hasAdminAccess = allRoles.some(r => ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'].includes(r));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('trainer.nav.profile')} />

      <Section className="mb-4">
        <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <p className="text-xs text-primary mt-0.5">{t('trainer.trainerRole')}</p>
          </div>
        </div>
      </Section>

      <Section title={t('trainer.settings')}>
        <div className="space-y-1">
          <ListCard
            title={t('staff.language')}
            leading={<Globe className="h-5 w-5 text-muted-foreground" />}
            trailing={
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'th' ? 'en' : 'th')}
                className="text-xs font-medium text-primary px-2 py-1 rounded-md bg-primary/10"
              >
                {i18n.language === 'th' ? 'TH → EN' : 'EN → TH'}
              </button>
            }
          />
          <ListCard
            title={t('staff.theme')}
            leading={theme === 'dark' ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
            trailing={
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-xs font-medium text-primary px-2 py-1 rounded-md bg-primary/10"
              >
                {theme === 'dark' ? t('staff.lightMode') : t('staff.darkMode')}
              </button>
            }
          />
          <ListCard
            title={t('trainer.notifications')}
            leading={<Bell className="h-5 w-5 text-muted-foreground" />}
            trailing={<Badge variant="secondary" className="text-[10px] px-1 py-0">{t('trainer.comingSoonLabel')}</Badge>}
            showChevron={false}
          />
          <ListCard
            title={t('trainer.helpAndSupport')}
            leading={<HelpCircle className="h-5 w-5 text-muted-foreground" />}
            trailing={<Badge variant="secondary" className="text-[10px] px-1 py-0">{t('trainer.comingSoonLabel')}</Badge>}
            showChevron={false}
          />
        </div>
      </Section>

      {/* Surface switcher */}
      <Section title={t('trainer.switchApp')} className="mt-4">
        <div className="space-y-1">
          {hasAdminAccess && (
            <ListCard
              title={t('trainer.adminPortal')}
              leading={<ShieldCheck className="h-5 w-5 text-muted-foreground" />}
              showChevron
              onClick={async () => {
                window.location.href = await buildSessionTransferUrl(buildCrossSurfaceUrl('admin', '/'));
              }}
            />
          )}
          <ListCard
            title={t('trainer.memberApp')}
            leading={<Users className="h-5 w-5 text-muted-foreground" />}
            showChevron
            onClick={async () => {
              window.location.href = await buildSessionTransferUrl(buildCrossSurfaceUrl('member', '/member'));
            }}
          />
        </div>
      </Section>

      <Section className="mt-6">
        <Button variant="outline" className="w-full text-destructive border-destructive/30" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {t('trainer.signOut')}
        </Button>
      </Section>
    </div>
  );
}
