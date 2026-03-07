import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/formatters';
import { UserPlus, Calendar, Package, RefreshCw, PauseCircle, AlertTriangle } from 'lucide-react';

interface TimelineEvent {
  date: string;
  type: 'joined' | 'first_class' | 'purchase' | 'renewal' | 'suspension' | 'risk';
  label: string;
  detail?: string;
}

interface MemberTimelineProps {
  memberSince: string | null;
  attendance: Array<{ check_in_time: string | null }>;
  packages: Array<{
    purchase_date: string | null;
    status: string | null;
    package_name_snapshot?: string | null;
    package?: { name_en: string; name_th?: string | null } | null;
  }>;
  suspensions: Array<{ start_date: string; reason?: string | null; is_active?: boolean | null }>;
  riskLevel?: string | null;
}

const ICON_MAP = {
  joined: UserPlus,
  first_class: Calendar,
  purchase: Package,
  renewal: RefreshCw,
  suspension: PauseCircle,
  risk: AlertTriangle,
};

const COLOR_MAP: Record<string, string> = {
  joined: 'bg-primary text-primary-foreground',
  first_class: 'bg-accent text-accent-foreground',
  purchase: 'bg-primary text-primary-foreground',
  renewal: 'bg-primary text-primary-foreground',
  suspension: 'bg-destructive text-destructive-foreground',
  risk: 'bg-destructive text-destructive-foreground',
};

export const MemberTimeline: React.FC<MemberTimelineProps> = ({
  memberSince,
  attendance,
  packages,
  suspensions,
  riskLevel,
}) => {
  const { t, language } = useLanguage();

  const events: TimelineEvent[] = [];

  // Joined
  if (memberSince) {
    events.push({
      date: memberSince,
      type: 'joined',
      label: t('timeline.joined'),
    });
  }

  // First class
  const sorted = [...attendance].filter(a => a.check_in_time).sort((a, b) =>
    new Date(a.check_in_time!).getTime() - new Date(b.check_in_time!).getTime()
  );
  if (sorted.length > 0) {
    events.push({
      date: sorted[0].check_in_time!,
      type: 'first_class',
      label: t('timeline.firstClass'),
    });
  }

  // Package purchases
  for (const pkg of packages) {
    if (pkg.purchase_date) {
      const name = pkg.package_name_snapshot ||
        (language === 'th' ? pkg.package?.name_th : null) ||
        pkg.package?.name_en || '';
      events.push({
        date: pkg.purchase_date,
        type: pkg.status === 'active' ? 'renewal' : 'purchase',
        label: t('timeline.purchased'),
        detail: name,
      });
    }
  }

  // Suspensions
  for (const s of suspensions) {
    events.push({
      date: s.start_date,
      type: 'suspension',
      label: t('timeline.suspended'),
      detail: s.reason || undefined,
    });
  }

  // Current risk
  if (riskLevel === 'high' || riskLevel === 'critical') {
    events.push({
      date: new Date().toISOString(),
      type: 'risk',
      label: t('timeline.atRisk'),
    });
  }

  // Sort by date descending (newest first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (events.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-sm mb-3">{t('timeline.title')}</h3>
      <div className="relative ml-3">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

        {events.map((event, i) => {
          const Icon = ICON_MAP[event.type];
          return (
            <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
              <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${COLOR_MAP[event.type]}`}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium">{event.label}</p>
                {event.detail && (
                  <p className="text-xs text-muted-foreground truncate">{event.detail}</p>
                )}
                <p className="text-[11px] text-muted-foreground">{formatDate(event.date)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
