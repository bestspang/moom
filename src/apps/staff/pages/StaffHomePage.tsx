import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { SummaryCard } from '@/apps/shared/components/SummaryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanLine, Users, Calendar, FileText, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function StaffHomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader title="Hi, Staff" subtitle="Operations overview" />

      {/* Quick member search */}
      <Section className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Section>

      {/* Quick actions */}
      <Section className="mb-4">
        <div className="flex gap-2">
          <Button onClick={() => navigate('/staff/checkin')} className="flex-1" size="sm">
            <ScanLine className="h-4 w-4 mr-1.5" />
            Check-in
          </Button>
          <Button onClick={() => navigate('/staff/members')} variant="outline" className="flex-1" size="sm">
            <Users className="h-4 w-4 mr-1.5" />
            Members
          </Button>
        </div>
      </Section>

      {/* Stats */}
      <Section className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Classes" value="0" subtitle="today" icon={<Calendar className="h-4 w-4" />} />
          <SummaryCard label="Pending" value="0" subtitle="slips" icon={<FileText className="h-4 w-4" />} />
          <SummaryCard label="Leads" value="0" subtitle="hot" icon={<Users className="h-4 w-4" />} />
        </div>
      </Section>
    </div>
  );
}
