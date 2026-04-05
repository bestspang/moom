import React from 'react';
import { DoorOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardWelcomeProps {
  onQuickCheckIn: () => void;
}

const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({ onQuickCheckIn }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? 'dashboard.goodMorning' :
    hour < 17 ? 'dashboard.goodAfternoon' :
    'dashboard.goodEvening';

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || '';

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t(greetingKey)}{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/calendar">
            <Calendar className="h-4 w-4 mr-1.5" />
            {t('dashboard.goToSchedule')}
          </a>
        </Button>
        <Button size="sm" onClick={onQuickCheckIn}>
          <DoorOpen className="h-4 w-4 mr-1.5" />
          {t('lobby.checkIn')}
        </Button>
      </div>
    </div>
  );
};

export default DashboardWelcome;
