import { useNavigate } from 'react-router-dom';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { SummaryCard } from '@/apps/shared/components/SummaryCard';
import { Button } from '@/components/ui/button';
import { Calendar, Package, Bell, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function MemberHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.user_metadata?.first_name;

  const greeting = getTimeGreeting();
  const title = firstName ? `${greeting}, ${firstName}` : `${greeting}!`;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader
        title={title}
        subtitle="Ready to train?"
        action={
          <button
            onClick={() => navigate('/member/notifications')}
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
          </button>
        }
      />

      {/* Quick actions */}
      <Section className="mb-4">
        <div className="flex gap-2">
          <Button onClick={() => navigate('/member/schedule')} className="flex-1" size="sm">
            <Calendar className="h-4 w-4 mr-1.5" />
            Book Class
          </Button>
          <Button onClick={() => navigate('/member/packages')} variant="outline" className="flex-1" size="sm">
            <Package className="h-4 w-4 mr-1.5" />
            Buy Package
          </Button>
        </div>
      </Section>

      {/* Welcome card for new experience */}
      <Section className="mb-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-sm font-semibold text-foreground">Welcome to MOOM!</p>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              Browse classes in the schedule
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              Book your first session
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              Check in to earn XP
            </li>
          </ol>
        </div>
      </Section>

      {/* Stats placeholder */}
      <Section title="Your Stats" className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="This Week" value="0" subtitle="classes attended" />
          <SummaryCard label="Streak" value="0" subtitle="days" />
        </div>
      </Section>

      {/* Upcoming bookings placeholder */}
      <Section
        title="Next Up"
        action={
          <button
            onClick={() => navigate('/member/bookings')}
            className="text-xs font-medium text-primary flex items-center gap-0.5"
          >
            View all <ChevronRight className="h-3 w-3" />
          </button>
        }
        className="mb-4"
      >
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">No upcoming bookings</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/member/schedule')}>
            Browse Schedule
          </Button>
        </div>
      </Section>
    </div>
  );
}
