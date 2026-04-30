import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, Calendar, UserPlus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDateLocale } from '@/lib/formatters';
import { format } from 'date-fns';

interface DashboardWelcomeProps {
  onQuickCheckIn: () => void;
  stats?: { classesToday: number; checkinsToday: number };
  pendingSlips?: number;
}

const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({ onQuickCheckIn, stats, pendingSlips = 0 }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const locale = getDateLocale(language);

  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? 'dashboard.goodMorning' :
    hour < 17 ? 'dashboard.goodAfternoon' :
    'dashboard.goodEvening';

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || '';

  const dateStr = format(new Date(), 'EEEE, d MMMM yyyy', { locale });

  const summaryParts: string[] = [];
  if (stats) {
    if (stats.classesToday > 0) summaryParts.push(`${stats.classesToday} ${t('dashboard.classes')}`);
    if (stats.checkinsToday > 0) summaryParts.push(`${stats.checkinsToday} ${t('dashboard.gymCheckin')}`);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight leading-tight">
          {t(greetingKey)}{firstName ? `, ${firstName}` : ''} <span className="text-[22px]">👋</span>
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {dateStr}
          {summaryParts.length > 0 && (
            <span className="ml-2 text-foreground/70">· {summaryParts.join(' · ')}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => navigate('/members')} className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('dashboardExtra.addMember')}</span>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/calendar">
            <Calendar className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('dashboard.goToSchedule')}</span>
          </a>
        </Button>
        {pendingSlips > 0 && (
          <Button variant="outline" size="sm" onClick={() => navigate('/finance?tab=slips')} className="gap-1.5">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">{t('dashboardExtra.reviewSlips')}</span>
            <Badge variant="destructive" className="ml-0.5 h-5 min-w-5 px-1 text-[10px]">
              {pendingSlips}
            </Badge>
          </Button>
        )}
        <Button size="sm" onClick={onQuickCheckIn}>
          <DoorOpen className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">{t('lobby.checkIn')}</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardWelcome;
