import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { SummaryCard } from '@/apps/shared/components/SummaryCard';
import { ListCard } from '@/apps/shared/components/ListCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScanLine, Users, Calendar, FileText, Search, CreditCard, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function StaffHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const firstName = user?.user_metadata?.first_name ?? 'Staff';
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todayCount } = useQuery({
    queryKey: ['staff-today-classes', today],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('schedule')
        .select('id', { count: 'exact', head: true })
        .eq('scheduled_date', today)
        .neq('status', 'cancelled');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: pendingSlips } = useQuery({
    queryKey: ['staff-pending-slips'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('transfer_slips')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'needs_review');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: hotLeads } = useQuery({
    queryKey: ['staff-hot-leads'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('temperature', 'hot');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: recentCheckins, isLoading: loadingCheckins } = useQuery({
    queryKey: ['staff-recent-checkins', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_attendance')
        .select('id, check_in_time, members!inner(first_name, last_name)')
        .gte('check_in_time', `${today}T00:00:00`)
        .order('check_in_time', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        time: row.check_in_time ? format(new Date(row.check_in_time), 'HH:mm') : '--:--',
        name: `${row.members?.first_name ?? ''} ${row.members?.last_name ?? ''}`.trim() || 'Member',
      }));
    },
    enabled: !!user,
  });

  const handleSearch = () => {
    if (search.trim()) navigate(`/staff/members?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader title={t('staff.greeting', { name: firstName })} subtitle={t('staff.operationsOverview')} />

      <Section className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('staff.searchMembers')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
      </Section>

      <Section className="mb-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => navigate('/staff/checkin')} size="sm">
            <ScanLine className="h-4 w-4 mr-1.5" />{t('staff.nav.checkin')}
          </Button>
          <Button onClick={() => navigate('/staff/members')} variant="outline" size="sm">
            <Users className="h-4 w-4 mr-1.5" />{t('staff.nav.members')}
          </Button>
          <Button onClick={() => navigate('/staff/payments')} variant="outline" size="sm">
            <CreditCard className="h-4 w-4 mr-1.5" />{t('staff.nav.payments')}
          </Button>
          <Button onClick={() => navigate('/schedule')} variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-1.5" />{t('staff.viewSchedule')}
          </Button>
        </div>
      </Section>

      <Section className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label={t('staff.classes')} value={String(todayCount ?? 0)} subtitle={t('staff.today')} icon={<Calendar className="h-4 w-4" />} />
          <SummaryCard label={t('staff.pending')} value={String(pendingSlips ?? 0)} subtitle={t('staff.slips')} icon={<FileText className="h-4 w-4" />} />
          <SummaryCard label={t('staff.leads')} value={String(hotLeads ?? 0)} subtitle={t('staff.hot')} icon={<Users className="h-4 w-4" />} />
        </div>
      </Section>

      {/* Recent Check-ins */}
      <Section title={t('staff.recentCheckins')} className="mb-4">
        {loadingCheckins ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : !recentCheckins?.length ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <UserCheck className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t('staff.noCheckinsToday')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentCheckins.map(ci => (
              <ListCard
                key={ci.id}
                title={ci.name}
                subtitle={ci.time}
                leading={<UserCheck className="h-4 w-4 text-primary" />}
                showChevron={false}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
