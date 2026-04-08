import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Globe, Moon, Sun, ShieldCheck } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { buildCrossSurfaceUrl } from '@/apps/shared/hostname';
import { buildSessionTransferUrl } from '@/apps/shared/sessionTransfer';

const ADMIN_CAPABLE_ROLES = ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'];

export function TrainerHeader() {
  const navigate = useNavigate();
  const { user, allRoles, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();

  const firstName = user?.user_metadata?.first_name ?? 'Trainer';
  const lastName = user?.user_metadata?.last_name ?? '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'T';

  const hasAdminAccess = allRoles.some(r => ADMIN_CAPABLE_ROLES.includes(r));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background shadow-sm px-4">
      <Link to="/trainer" className="text-lg font-bold tracking-tight text-primary">
        MOOM
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setLanguage(language === 'en' ? 'th' : 'en')} className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'ไทย' : 'English'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="flex items-center gap-2">
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </DropdownMenuItem>
          {hasAdminAccess && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  window.location.href = await buildSessionTransferUrl(buildCrossSurfaceUrl('admin', '/'));
                }}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                {t('trainer.adminPortal')}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            {t('trainer.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
