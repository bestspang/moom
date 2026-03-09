import { Link, useLocation } from 'react-router-dom';
import {
  Home, Calendar, User, ScanLine, Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  center?: boolean;
}

const MEMBER_NAV: NavItem[] = [
  { label: 'Home', path: '/member', icon: Home },
  { label: 'Schedule', path: '/member/schedule', icon: Calendar },
  { label: 'Check In', path: '/member/check-in', icon: ScanLine, center: true },
  { label: 'Coupons', path: '/member/coupons', icon: Ticket },
  { label: 'Profile', path: '/member/profile', icon: User },
];

export function MemberBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5">
        {MEMBER_NAV.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/member' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          if (item.center) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 -mt-4"
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/90 text-primary-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn('text-[10px] font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
              <span className={cn('font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
