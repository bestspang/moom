import { Link } from 'react-router-dom';
import { NotificationBell } from '../features/momentum/NotificationBell';
import { useMemberSession } from '../hooks/useMemberSession';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function MemberHeader() {
  const { firstName, lastName } = useMemberSession();
  const initials = `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase() || '?';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-card px-4">
      {/* Brand */}
      <Link to="/member" className="text-lg font-bold tracking-tight text-primary">
        MOOM
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Link to="/member/profile">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
