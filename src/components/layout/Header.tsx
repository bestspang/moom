import React, { useCallback } from 'react';
import { Phone, Bell, ChevronDown, Menu, LogOut, User, Globe, Users, Dumbbell } from 'lucide-react';
import { buildCrossSurfaceUrl } from '@/apps/shared/hostname';
import { buildSessionTransferUrl } from '@/apps/shared/sessionTransfer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount, useRecentNotifications, useMarkAsRead } from '@/hooks/useNotifications';
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
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/formatters';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, role, allRoles, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: recentNotifications = [] } = useRecentNotifications(5);
  const markAsRead = useMarkAsRead();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean | null) => {
    if (!isRead) {
      markAsRead.mutate(notificationId);
    }
  };

  // Get user initials from email or metadata
  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
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
      owner: 'Owner',
      admin: 'Admin',
      trainer: 'Trainer',
      front_desk: 'Front Desk',
    };
    return roleLabels[role] || role;
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center justify-between px-4">
      {/* Left side - Logo and menu */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-lg hidden sm:block">MOOM CLUB</span>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />
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
              size="icon" 
              className="rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
            {/* Surface switcher */}
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
