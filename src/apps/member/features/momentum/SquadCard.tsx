import { useQuery } from '@tanstack/react-query';
import { fetchMySquad } from './api';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

interface SquadCardProps {
  memberId: string;
}

function getInitials(first?: string, last?: string): string {
  return `${(first ?? '?').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase();
}

export function SquadCard({ memberId }: SquadCardProps) {
  const navigate = useNavigate();
  const { data: squad, isLoading } = useQuery({
    queryKey: ['my-squad', memberId],
    queryFn: () => fetchMySquad(memberId),
    enabled: !!memberId,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4 animate-pulse">
        <div className="h-16 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!squad) {
    return (
      <button
        onClick={() => navigate('/member/squad')}
        className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center transition-colors hover:border-primary/50 hover:bg-primary/10"
      >
        <Users className="h-8 w-8 mx-auto text-primary/60 mb-2" />
        <p className="text-sm font-semibold text-foreground">Join a Squad</p>
        <p className="text-xs text-muted-foreground mt-1">Team up with friends to train together</p>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/member/squad')}
      className="w-full rounded-xl border bg-card shadow-sm p-4 text-left transition-all hover:shadow-md group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{squad.name}</p>
            {squad.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{squad.description}</p>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>

      {/* Members */}
      <div className="flex items-center gap-1">
        {squad.members.slice(0, 5).map((m, i) => (
          <div
            key={m.id}
            className="h-7 w-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold"
            style={{
              backgroundColor: `hsl(${(i * 60) % 360}, 60%, 85%)`,
              color: `hsl(${(i * 60) % 360}, 60%, 30%)`,
              marginLeft: i > 0 ? '-4px' : 0,
              zIndex: 10 - i,
              position: 'relative',
            }}
          >
            {getInitials(m.firstName, m.lastName)}
          </div>
        ))}
        <span className="text-[11px] text-muted-foreground ml-1.5">
          {squad.members.length}/{squad.maxMembers}
        </span>
      </div>

      {/* Total XP */}
      <div className="mt-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{squad.totalXp.toLocaleString()}</span> total XP
      </div>
    </button>
  );
}
