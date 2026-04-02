import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const RANK_ICONS = [Crown, Medal, Award] as const;
const RANK_COLORS = [
  'text-yellow-500',
  'text-muted-foreground',
  'text-amber-600',
] as const;

interface LeaderboardEntryRowProps {
  rank: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isMe: boolean;
  badge: string;
  subtitle?: string;
  youLabel: string;
}

export function LeaderboardEntryRow({
  rank,
  firstName,
  lastName,
  avatarUrl,
  isMe,
  badge,
  subtitle,
  youLabel,
}: LeaderboardEntryRowProps) {
  const RankIcon = rank <= 3 ? RANK_ICONS[rank - 1] : null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm',
        isMe && 'ring-2 ring-primary'
      )}
    >
      <div className="w-8 text-center flex-shrink-0">
        {RankIcon ? (
          <RankIcon className={cn('h-5 w-5 mx-auto', RANK_COLORS[rank - 1])} />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
        )}
      </div>
      <Avatar className="h-9 w-9">
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs bg-muted">
          {firstName?.[0]}{lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">
          {firstName} {lastName}
          {isMe && <span className="text-primary ml-1">{youLabel}</span>}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <Badge variant="secondary" className="text-xs font-bold">
        {badge}
      </Badge>
    </div>
  );
}
