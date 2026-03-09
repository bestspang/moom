import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface SuggestedClassCardProps {
  memberId: string;
}

interface Suggestion {
  scheduleId: string;
  className: string;
  reason: string;
  date: string;
  time: string;
}

async function fetchSuggestions(memberId: string): Promise<Suggestion[]> {
  // Fetch recent attendance to derive preferences
  const { data: attendance } = await supabase
    .from('member_attendance' as any)
    .select('schedule:schedule(class:classes(name, category_id))')
    .eq('member_id', memberId)
    .order('check_in_time', { ascending: false })
    .limit(10);

  // Get upcoming schedule
  const today = new Date().toISOString().slice(0, 10);
  const { data: upcoming } = await supabase
    .from('schedule')
    .select('id, scheduled_date, start_time, class:classes(name, category_id)')
    .gte('scheduled_date', today)
    .eq('status', 'scheduled')
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(20);

  if (!upcoming?.length) return [];

  // Find most-attended category
  const catCounts: Record<string, number> = {};
  for (const a of (attendance as any[]) ?? []) {
    const catId = a?.schedule?.class?.category_id;
    if (catId) catCounts[catId] = (catCounts[catId] ?? 0) + 1;
  }

  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Check what member already booked
  const { data: booked } = await supabase
    .from('class_bookings')
    .select('schedule_id')
    .eq('member_id', memberId)
    .eq('status', 'booked');

  const bookedIds = new Set((booked ?? []).map((b: any) => b.schedule_id));

  // Pick suggestions: prefer same category, not already booked
  const suggestions: Suggestion[] = [];
  for (const s of (upcoming as any[])) {
    if (bookedIds.has(s.id)) continue;
    if (suggestions.length >= 2) break;

    const isPreferred = topCat && s.class?.category_id === topCat;
    suggestions.push({
      scheduleId: s.id,
      className: s.class?.name ?? 'Class',
      reason: isPreferred ? 'Based on your favorites' : 'Popular this week',
      date: s.scheduled_date,
      time: s.start_time?.slice(0, 5) ?? '',
    });
  }

  return suggestions;
}

export function SuggestedClassCard({ memberId }: SuggestedClassCardProps) {
  const navigate = useNavigate();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggested-classes', memberId],
    queryFn: () => fetchSuggestions(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  if (isLoading) return <Skeleton className="h-20 rounded-xl" />;
  if (!suggestions?.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Suggested for You</p>
      </div>
      {suggestions.map(s => (
        <button
          key={s.scheduleId}
          onClick={() => navigate(`/member/schedule/${s.scheduleId}`)}
          className="flex w-full items-center gap-3 rounded-xl bg-card p-3 shadow-sm border border-border hover:bg-accent/50 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{s.className}</p>
            <p className="text-xs text-muted-foreground">{s.reason} · {s.date} {s.time}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}
