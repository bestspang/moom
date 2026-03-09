import { Link, useNavigate } from 'react-router-dom';
import { Settings, User, LogOut, Monitor, Dumbbell, Globe, Bell } from 'lucide-react';
import { useRecentNotifications, useUnreadCount, useMarkAsRead } from '@/hooks/useNotifications';
import { useMemberSession } from '../hooks/useMemberSession';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildCrossSurfaceUrl } from '@/apps/shared/hostname';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const ADMIN_ROLES = ['owner', 'admin', 'front_desk'] as const;
const TRAINER_ROLES = ['trainer', 'freelance_trainer'] as const;

export function MemberHeader() {
  const navigate = useNavigate();
  const { firstName, lastName } = useMemberSession();
  const { allRoles, signOut, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const initials = `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase() || '?';

  const hasAdminAccess = allRoles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
  const hasTrainerAccess = allRoles.some((r) => (TRAINER_ROLES as readonly string[]).includes(r));

  const { data: unreadCount } = useUnreadCount();
  const { data: recentNotifications } = useRecentNotifications(5);
  const markAsRead = useMarkAsRead();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background shadow-sm px-4">
      {/* Brand */}
      <Link to="/member" className="text-lg font-bold tracking-tight text-primary">
        MOOM
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notification dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount! > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>
              {(unreadCount ?? 0) > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <DropdownMenuSeparator />
            {(!recentNotifications || recentNotifications.length === 0) ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              recentNotifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={cn(
                    'flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer',
                    !n.is_read && 'bg-primary/5'
                  )}
                  onClick={() => {
                    if (!n.is_read) markAsRead.mutate(n.id);
                  }}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <p className={cn('text-sm leading-tight', !n.is_read && 'font-semibold')}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {n.message && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                  )}
                  {n.created_at && (
                    <p className="text-[11px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  )}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-xs font-medium text-primary"
              onClick={() => navigate('/member')}
            >
              View all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Settings className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-6 pb-4">
              {/* Language */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Language</p>
                <div className="flex gap-2">
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </Button>
                  <Button
                    variant={language === 'th' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('th')}
                  >
                    ไทย
                  </Button>
                </div>
              </div>

              {/* Theme placeholder */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Theme</p>
                <p className="text-sm text-muted-foreground/70">Light mode (coming soon)</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Avatar dropdown */}
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
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/member/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                View Profile
              </Link>
            </DropdownMenuItem>

            {(hasAdminAccess || hasTrainerAccess) && <DropdownMenuSeparator />}

            {hasAdminAccess && (
              <DropdownMenuItem asChild>
                <a href={buildCrossSurfaceUrl('admin', '/')} className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Admin Portal
                </a>
              </DropdownMenuItem>
            )}

            {hasTrainerAccess && (
              <DropdownMenuItem asChild>
                <a href={buildCrossSurfaceUrl('trainer', '/trainer')} className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Trainer App
                </a>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setLanguage(language === 'en' ? 'th' : 'en')} className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {language === 'en' ? 'ไทย' : 'English'}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
