import React from 'react';
import { Bell, ChevronDown, Menu, LogOut, User, Globe, Users, Dumbbell, Search, Calendar, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { buildCrossSurfaceUrl } from '@/apps/shared/hostname';
import { buildSessionTransferUrl } from '@/apps/shared/sessionTransfer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount, useRecentNotifications, useMarkAsRead } from '@/hooks/useNotifications';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/formatters';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, role, allRoles, signOut } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: recentNotifications = [] } = useRecentNotifications(5);
  const markAsRead = useMarkAsRead();

  const ADMIN_ROLES = ['owner', 'admin', 'front_desk'] as const;
  const TRAINER_ROLES = ['trainer', 'freelance_trainer'] as const;
  const hasAdminAccess = (allRoles ?? []).some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
  const hasTrainerAccess = (allRoles ?? []).some((r) => (TRAINER_ROLES as readonly string[]).includes(r));
  const canCheckin = can('lobby', 'write');

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(t('header.logoutSuccess'));
      navigate('/login');
    } catch (err) {
      console.error('[Header] logout failed', err);
      toast.error(t('header.logoutError'));
    }
  };

  const handleCheckinClick = () => {
    if (!canCheckin) {
      toast.error(t('header.checkinDenied'));
      return;
    }
    navigate('/checkin');
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean | null) => {
    if (!isRead) {
      markAsRead.mutate(notificationId, {
        onError: () => toast.error(t('header.notificationError')),
      });
    }
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('moom:open-command-palette'));
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return 'U';
  };

  const getUserName = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    return user?.email || 'User';
  };

  const getRoleLabel = () => {
    if (!role) return '';
    const roleLabels: Record<string, string> = {
      owner: 'Owner', admin: 'Admin', trainer: 'Trainer', front_desk: 'Front Desk',
    };
    return roleLabels[role] || role;
  };

  const todayLabel = `${t('header.today')}, ${format(
    new Date(),
    language === 'th' ? 'd MMM' : 'EEE, d MMM',
    { locale: getDateLocale(language) }
  )}`;

  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  return (
    <header className="sticky top-0 h-14 bg-card border-b border-border z-30 flex items-center gap-3 px-4">
      {/* Left: mobile menu */}
      <div className="flex items-center shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Center: search trigger */}
      <div className="flex-1 hidden sm:flex justify-center">
        <button
          type="button"
          onClick={openCommandPalette}
          className="group w-full max-w-xl inline-flex items-center gap-2 h-9 px-3 rounded-full bg-muted/60 hover:bg-muted border border-border text-muted-foreground text-sm transition-colors"
          aria-label={t('header.searchPlaceholder')}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left truncate">{t('header.searchPlaceholder')}</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 bg-background border border-border rounded text-[11px] px-1.5 py-0.5 font-mono text-muted-foreground">
            {isMac ? '⌘' : 'Ctrl'}K
          </kbd>
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
        {/* Date pill — desktop only */}
        <div className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card text-sm text-foreground">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="whitespace-nowrap">{todayLabel}</span>
        </div>

        {/* Check-in CTA */}
        <Button
          onClick={() => navigate('/checkin')}
          className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground hover:brightness-110 font-semibold inline-flex items-center gap-1.5"
        >
          <QrCode className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('header.checkin')}</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {t('notifications.title')} ({unreadCount})
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary p-0 h-auto"
                  onClick={() => navigate('/notifications')}
                >
                  {t('common.viewAll')}
                </Button>
              </div>
            </div>
            {recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {t('notifications.noUnread')}
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                {recentNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      'flex flex-col items-start p-3 cursor-pointer',
                      !notification.is_read && 'bg-accent/50'
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                  >
                    <p className={cn('text-sm', !notification.is_read && 'font-semibold')}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.created_at
                        ? formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: getDateLocale(language),
                          })
                        : ''}
                    </p>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language selector — desktop only */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                {language.toUpperCase()}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className={cn(language === 'en' && 'bg-accent')}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('th')}
                className={cn(language === 'th' && 'bg-accent')}
              >
                ไทย
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 px-1.5 rounded-full gap-2 hover:bg-muted/60"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-tight pr-1">
                <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                  {getUserName()}
                </span>
                {role && (
                  <span className="text-[10px] text-muted-foreground">{getRoleLabel()}</span>
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{getUserName()}</p>
                  {role && (
                    <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenuItem
              className="text-primary cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <User className="h-4 w-4 mr-2" />
              {t('profile.editProfile')}
            </DropdownMenuItem>
            {!!user && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={async (e) => {
                  e.preventDefault();
                  window.location.href = await buildSessionTransferUrl(buildCrossSurfaceUrl('member', '/member'));
                }}>
                  <Users className="h-4 w-4 mr-2" />
                  Member App
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={async (e) => {
                  e.preventDefault();
                  window.location.href = await buildSessionTransferUrl(buildCrossSurfaceUrl('trainer', '/trainer'));
                }}>
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Trainer App
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            {/* Theme toggle — inline inside menu */}
            <div className="flex items-center justify-between px-2 py-1.5 text-sm">
              <span className="text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            {/* Language toggle — mobile only */}
            <div className="md:hidden">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
              >
                <Globe className="h-4 w-4 mr-2" />
                {language === 'en' ? 'ไทย' : 'English'}
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-primary cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('profile.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
