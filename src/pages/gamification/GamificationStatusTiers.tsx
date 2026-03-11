import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable } from '@/components/common/DataTable';
import { StatCard } from '@/components/common/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Award, TrendingUp, Users } from 'lucide-react';

export default function GamificationStatusTiers() {
  const { t } = useLanguage();

  const { data: rules, isLoading: loadingRules } = useQuery({
    queryKey: ['status-tier-rules'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('status_tier_rules')
        .select('*')
        .order('tier_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: spRules, isLoading: loadingSp } = useQuery({
    queryKey: ['status-tier-sp-rules'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('status_tier_sp_rules')
        .select('*')
        .order('action_key');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: benefits } = useQuery({
    queryKey: ['status-tier-benefits'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('status_tier_benefits')
        .select('*')
        .order('tier_code, sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: distribution } = useQuery({
    queryKey: ['status-tier-distribution'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('member_status_tiers')
        .select('current_tier');
      if (error) return [];
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        counts[r.current_tier] = (counts[r.current_tier] || 0) + 1;
      });
      return counts;
    },
  });

  if (loadingRules || loadingSp) {
    return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  }

  const totalMembers = Object.values(distribution ?? {}).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Tiers" value={rules?.length ?? 0} icon={Shield} />
        <StatCard title="SP Rules" value={spRules?.length ?? 0} icon={TrendingUp} />
        <StatCard title="Benefits" value={benefits?.length ?? 0} icon={Award} />
        <StatCard title="Evaluated Members" value={totalMembers} icon={Users} />
      </div>

      {/* Tier Qualification Rules */}
      <div>
        <h3 className="text-sm font-bold mb-3">Tier Qualification Rules</h3>
        <DataTable
          columns={[
            { header: 'Tier', accessorKey: 'tier_code', cell: ({ row }: any) => (
              <span className="flex items-center gap-2 font-bold capitalize">
                <span>{row.original.icon_emoji}</span>
                {row.original.display_name_en}
              </span>
            )},
            { header: 'Min Level', accessorKey: 'min_level' },
            { header: 'Min SP (90d)', accessorKey: 'min_sp_90d' },
            { header: 'Active Days', accessorKey: 'min_active_days_period', cell: ({ row }: any) => (
              <span>{row.original.min_active_days_period} in {row.original.active_days_window}d</span>
            )},
            { header: 'Req. Package', accessorKey: 'requires_active_package', cell: ({ row }: any) => (
              row.original.requires_active_package ? '✅' : '—'
            )},
            { header: 'Members', accessorKey: 'tier_code', id: 'members', cell: ({ row }: any) => (
              <span className="font-mono">{(distribution as any)?.[row.original.tier_code] ?? 0}</span>
            )},
          ]}
          data={rules ?? []}
        />
      </div>

      {/* SP Earning Rules */}
      <div>
        <h3 className="text-sm font-bold mb-3">Status Point Earning Rules</h3>
        <DataTable
          columns={[
            { header: 'Action Key', accessorKey: 'action_key' },
            { header: 'SP Value', accessorKey: 'sp_value' },
            { header: 'Daily Cap', accessorKey: 'daily_cap', cell: ({ row }: any) => row.original.daily_cap ?? '∞' },
            { header: 'Active', accessorKey: 'is_active', cell: ({ row }: any) => row.original.is_active ? '✅' : '❌' },
          ]}
          data={spRules ?? []}
        />
      </div>

      {/* Benefits */}
      <div>
        <h3 className="text-sm font-bold mb-3">Tier Benefits</h3>
        <DataTable
          columns={[
            { header: 'Tier', accessorKey: 'tier_code', cell: ({ row }: any) => (
              <span className="capitalize font-medium">{row.original.tier_code}</span>
            )},
            { header: 'Benefit', accessorKey: 'description_en' },
            { header: 'Frequency', accessorKey: 'frequency' },
            { header: 'Max/Month', accessorKey: 'max_per_month', cell: ({ row }: any) => row.original.max_per_month ?? '∞' },
          ]}
          data={benefits ?? []}
        />
      </div>
    </div>
  );
}
