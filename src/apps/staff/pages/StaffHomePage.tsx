import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { SummaryCard } from '@/apps/shared/components/SummaryCard';
import { ListCard } from '@/apps/shared/components/ListCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScanLine, Users, Calendar, FileText, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function StaffHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleSearch = () => {
    if (search.trim()) navigate(`/staff/members?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader title={`Hi, ${firstName}`} subtitle="Operations overview" />

      <Section className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
      </Section>

      <Section className="mb-4">
        <div className="flex gap-2">
          <Button onClick={() => navigate('/staff/checkin')} className="flex-1" size="sm">
            <ScanLine className="h-4 w-4 mr-1.5" />Check-in
          </Button>
          <Button onClick={() => navigate('/staff/members')} variant="outline" className="flex-1" size="sm">
            <Users className="h-4 w-4 mr-1.5" />Members
          </Button>
        </div>
      </Section>

      <Section className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Classes" value={String(todayCount ?? 0)} subtitle="today" icon={<Calendar className="h-4 w-4" />} />
          <SummaryCard label="Pending" value={String(pendingSlips ?? 0)} subtitle="slips" icon={<FileText className="h-4 w-4" />} />
          <SummaryCard label="Leads" value={String(hotLeads ?? 0)} subtitle="hot" icon={<Users className="h-4 w-4" />} />
        </div>
      </Section>
    </div>
  );
}
