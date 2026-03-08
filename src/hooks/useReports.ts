import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format, eachDayOfInterval, startOfWeek, startOfMonth, startOfYear, getDay, getHours } from 'date-fns';

export type RiskLevel = 'high' | 'medium' | 'low';

export interface MemberAtRisk {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  packageName: string;
  packageType: string;
  usage: string;
  expiresIn: number; // days
  riskLevel: RiskLevel;
}

export interface RiskStats {
  highRisk: { count: number; percent: number };
  mediumRisk: { count: number; percent: number };
  lowRisk: { count: number; percent: number };
  total: number;
}

interface PackageWithMember {
  id: string;
  member_id: string;
  expiry_date: string | null;
  sessions_remaining: number | null;
  sessions_used: number | null;
  status: string | null;
  members: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  packages: {
    id: string;
    name_en: string;
    type: string;
    sessions: number | null;
  } | null;
}

/**
 * Calculate risk level based on spec:
 * - High: ≤30 days OR (≤33% usage AND ≤3 remaining sessions)
 * - Medium: ≤60 days OR (≤60% usage AND ≤15 remaining sessions)
 * - Low: >60 days AND >60% usage AND >15 remaining sessions
 */
function calculateRiskLevel(
  daysLeft: number,
  sessionsRemaining: number | null,
  totalSessions: number | null
): RiskLevel {
  if (totalSessions === null || totalSessions === 0) {
    if (daysLeft <= 30) return 'high';
    if (daysLeft <= 60) return 'medium';
    return 'low';
  }

  const usagePercent = sessionsRemaining !== null 
    ? (sessionsRemaining / totalSessions) * 100 
    : 100;

  if (daysLeft <= 30 || (usagePercent <= 33 && (sessionsRemaining || 0) <= 3)) {
    return 'high';
  }

  if (daysLeft <= 60 || (usagePercent <= 60 && (sessionsRemaining || 0) <= 15)) {
    return 'medium';
  }

  return 'low';
}

export function useMembersAtRiskStats() {
  return useQuery({
    queryKey: ['members-at-risk-stats'],
    queryFn: async (): Promise<{ stats: RiskStats; members: MemberAtRisk[] }> => {
      const { data, error } = await supabase
        .from('member_packages')
        .select(`
          id,
          member_id,
          expiry_date,
          sessions_remaining,
          sessions_used,
          status,
          members!inner (
            id,
            first_name,
            last_name,
            phone,
            avatar_url
          ),
          packages!inner (
            id,
            name_en,
            type,
            sessions
          )
        `)
        .eq('status', 'active')
        .not('expiry_date', 'is', null);

      if (error) throw error;

      const today = new Date();
      const members: MemberAtRisk[] = [];
      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;

      const packages = data as unknown as PackageWithMember[];

      packages.forEach((pkg) => {
        if (!pkg.members || !pkg.packages || !pkg.expiry_date) return;

        const expiryDate = new Date(pkg.expiry_date);
        const daysLeft = differenceInDays(expiryDate, today);

        if (daysLeft < 0) return;

        const totalSessions = pkg.packages.sessions;
        const riskLevel = calculateRiskLevel(
          daysLeft,
          pkg.sessions_remaining,
          totalSessions
        );

        if (riskLevel === 'high') highCount++;
        else if (riskLevel === 'medium') mediumCount++;
        else lowCount++;

        let usage = '-';
        if (totalSessions && totalSessions > 0) {
          const used = pkg.sessions_used || 0;
          usage = `${used}/${totalSessions}`;
        }

        members.push({
          id: pkg.member_id,
          name: `${pkg.members.first_name} ${pkg.members.last_name}`,
          avatar: pkg.members.avatar_url || undefined,
          phone: pkg.members.phone || '-',
          packageName: pkg.packages.name_en,
          packageType: pkg.packages.type,
          usage,
          expiresIn: daysLeft,
          riskLevel,
        });
      });

      const total = highCount + mediumCount + lowCount;

      return {
        stats: {
          highRisk: {
            count: highCount,
            percent: total > 0 ? Math.round((highCount / total) * 100) : 0,
          },
          mediumRisk: {
            count: mediumCount,
            percent: total > 0 ? Math.round((mediumCount / total) * 100) : 0,
          },
          lowRisk: {
            count: lowCount,
            percent: total > 0 ? Math.round((lowCount / total) * 100) : 0,
          },
          total,
        },
        members,
      };
    },
  });
}

// Active Members Hook
interface ActiveMembersFilters {
  location: string;
  age: string;
  gender: string;
}

interface ActiveMemberRow {
  date: string;
  activeMembers: number;
  location: string;
  ageGroup: string;
  gender: string;
}

interface ActiveMembersStats {
  mostActiveDay: number;
  mostActiveDayDate: string;
  leastActiveDay: number;
  leastActiveDayDate: string;
  avgActivePerDay: number;
  newActivePerDay: number;
}

export function useActiveMembers(
  dateRange: { start?: Date; end?: Date },
  filters: ActiveMembersFilters
) {
  return useQuery({
    queryKey: ['active-members', dateRange, filters],
    queryFn: async () => {
      // For demo purposes, generate mock data
      const days = dateRange.start && dateRange.end
        ? eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
        : [];

      const chartData = days.map((day) => ({
        date: format(day, 'd MMM'),
        activeMembers: Math.floor(Math.random() * 50) + 20,
      }));

      const activeCounts = chartData.map((d) => d.activeMembers);
      const maxActive = Math.max(...activeCounts);
      const minActive = Math.min(...activeCounts);

      const stats: ActiveMembersStats = {
        mostActiveDay: maxActive,
        mostActiveDayDate: chartData.find((d) => d.activeMembers === maxActive)?.date || '-',
        leastActiveDay: minActive,
        leastActiveDayDate: chartData.find((d) => d.activeMembers === minActive)?.date || '-',
        avgActivePerDay: Math.round(activeCounts.reduce((a, b) => a + b, 0) / activeCounts.length) || 0,
        newActivePerDay: Math.floor(Math.random() * 5) + 1,
      };

      const tableData: ActiveMemberRow[] = chartData.slice(0, 10).map((d) => ({
        date: d.date,
        activeMembers: d.activeMembers,
        location: 'Main Branch',
        ageGroup: '26-35',
        gender: 'Mixed',
      }));

      return { stats, chartData, tableData };
    },
    enabled: !!dateRange.start && !!dateRange.end,
  });
}

// Class Capacity by Hour Hook
interface ClassCapacityByHourFilters {
  trainer: string;
  location: string;
}

interface HeatmapCell {
  day: number;
  hour: number;
  capacity: number;
}

interface ClassCapacityByHourStats {
  avgCapacity: number;
  classesWithBookings: number;
  avgClassesPerDay: number;
  peakCapacityTime: string;
}

export function useClassCapacityByHour(
  dateRange: { start?: Date; end?: Date },
  filters: ClassCapacityByHourFilters
) {
  return useQuery({
    queryKey: ['class-capacity-by-hour', dateRange, filters],
    queryFn: async () => {
      let query = supabase
        .from('schedule')
        .select('scheduled_date, start_time, capacity, checked_in, trainer_id, location_id')
        .gte('scheduled_date', format(dateRange.start!, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.end!, 'yyyy-MM-dd'))
        .neq('status', 'cancelled');

      if (filters.trainer !== 'all') {
        query = query.eq('trainer_id', filters.trainer);
      }
      if (filters.location !== 'all') {
        query = query.eq('location_id', filters.location);
      }

      const { data: scheduleData, error } = await query;
      if (error) throw error;

      // Aggregate by day-of-week + hour
      const cellMap = new Map<string, { totalCapPct: number; count: number }>();

      let totalCapPct = 0;
      let totalClasses = 0;
      let classesWithBookingsCount = 0;

      (scheduleData || []).forEach((row: any) => {
        const dayOfWeek = getDay(new Date(row.scheduled_date)); // 0=Sun
        const hour = parseInt(row.start_time?.split(':')[0] || '0', 10);
        const key = `${dayOfWeek}-${hour}`;
        const capPct = row.capacity > 0 ? Math.round((row.checked_in / row.capacity) * 100) : 0;

        const existing = cellMap.get(key) || { totalCapPct: 0, count: 0 };
        existing.totalCapPct += capPct;
        existing.count += 1;
        cellMap.set(key, existing);

        totalCapPct += capPct;
        totalClasses++;
        if (row.checked_in > 0) classesWithBookingsCount++;
      });

      // Build heatmap
      const heatmapData: HeatmapCell[] = [];
      let peakCapacity = 0;
      let peakKey = '';
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const key = `${day}-${hour}`;
          const cell = cellMap.get(key);
          const avgCap = cell ? Math.round(cell.totalCapPct / cell.count) : 0;
          heatmapData.push({ day, hour, capacity: avgCap });

          if (avgCap > peakCapacity) {
            peakCapacity = avgCap;
            peakKey = `${dayNames[day]} ${hour.toString().padStart(2, '0')}:00`;
          }
        }
      }

      const numDays = dateRange.start && dateRange.end
        ? differenceInDays(dateRange.end, dateRange.start) + 1
        : 1;

      const stats: ClassCapacityByHourStats = {
        avgCapacity: totalClasses > 0 ? Math.round(totalCapPct / totalClasses) : 0,
        classesWithBookings: classesWithBookingsCount,
        avgClassesPerDay: Math.round(totalClasses / numDays),
        peakCapacityTime: peakKey || '-',
      };

      return { stats, heatmapData };
    },
    enabled: !!dateRange.start && !!dateRange.end,
  });
}

// Class Capacity Over Time Hook
interface ClassCapacityOverTimeFilters {
  trainer: string;
  location: string;
}

interface ClassCapacityRow {
  date: string;
  trainer: string;
  location: string;
  classesBooked: number;
  avgCapacity: number;
}

interface ClassCapacityOverTimeStats {
  avgCapacity: number;
  classesWithBookings: number;
  avgClassesPerDay: number;
}

export function useClassCapacityOverTime(
  dateRange: { start?: Date; end?: Date },
  filters: ClassCapacityOverTimeFilters
) {
  return useQuery({
    queryKey: ['class-capacity-over-time', dateRange, filters],
    queryFn: async () => {
      const days = dateRange.start && dateRange.end
        ? eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
        : [];

      const chartData = days.map((day) => ({
        date: format(day, 'd MMM'),
        capacity: Math.floor(Math.random() * 40) + 50,
        classes: Math.floor(Math.random() * 10) + 5,
      }));

      const stats: ClassCapacityOverTimeStats = {
        avgCapacity: 72,
        classesWithBookings: 189,
        avgClassesPerDay: 8,
      };

      const tableData: ClassCapacityRow[] = chartData.slice(0, 10).map((d) => ({
        date: d.date,
        trainer: 'All Trainers',
        location: 'Main Branch',
        classesBooked: d.classes,
        avgCapacity: d.capacity,
      }));

      return { stats, chartData, tableData };
    },
    enabled: !!dateRange.start && !!dateRange.end,
  });
}

// Package Sales Hook
interface PackageSalesFilters {
  packageType: string;
  category: string;
}

interface PackageSaleRow {
  packageName: string;
  packageType: string;
  category: string;
  unitsSold: number;
  revenue: number;
}

interface PackageSalesStats {
  maxUnitsSold: number;
  maxUnitsSoldPackage: string;
  minUnitsSold: number;
  minUnitsSoldPackage: string;
  maxRevenue: number;
  maxRevenuePackage: string;
  minRevenue: number;
  minRevenuePackage: string;
}

export function usePackageSales(
  dateRange: { start?: Date; end?: Date },
  filters: PackageSalesFilters
) {
  return useQuery({
    queryKey: ['package-sales', dateRange, filters],
    queryFn: async () => {
      // Mock package sales data
      const packageNames = [
        { name: 'Monthly Unlimited', type: 'unlimited', category: 'All Classes' },
        { name: '10 Session Pack', type: 'session', category: 'Group Classes' },
        { name: 'PT 5 Sessions', type: 'pt', category: 'Personal Training' },
        { name: 'Quarterly Pass', type: 'unlimited', category: 'All Classes' },
        { name: '20 Session Pack', type: 'session', category: 'All Classes' },
      ];

      const tableData: PackageSaleRow[] = packageNames.map((pkg) => ({
        packageName: pkg.name,
        packageType: pkg.type,
        category: pkg.category,
        unitsSold: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 100000) + 10000,
      }));

      const chartData = tableData.map((d) => ({
        name: d.packageName,
        units: d.unitsSold,
        revenue: Math.round(d.revenue / 1000), // Scale for chart
      }));

      const sortedByUnits = [...tableData].sort((a, b) => b.unitsSold - a.unitsSold);
      const sortedByRevenue = [...tableData].sort((a, b) => b.revenue - a.revenue);

      const stats: PackageSalesStats = {
        maxUnitsSold: sortedByUnits[0]?.unitsSold || 0,
        maxUnitsSoldPackage: sortedByUnits[0]?.packageName || '-',
        minUnitsSold: sortedByUnits[sortedByUnits.length - 1]?.unitsSold || 0,
        minUnitsSoldPackage: sortedByUnits[sortedByUnits.length - 1]?.packageName || '-',
        maxRevenue: sortedByRevenue[0]?.revenue || 0,
        maxRevenuePackage: sortedByRevenue[0]?.packageName || '-',
        minRevenue: sortedByRevenue[sortedByRevenue.length - 1]?.revenue || 0,
        minRevenuePackage: sortedByRevenue[sortedByRevenue.length - 1]?.packageName || '-',
      };

      return { stats, chartData, tableData };
    },
    enabled: !!dateRange.start && !!dateRange.end,
  });
}

// Package Sales Over Time Hook
interface PackageSalesOverTimeFilters {
  package: string;
  packageType: string;
  category: string;
}

interface PackageSaleTimeRow {
  date: string;
  packageName: string;
  packageType: string;
  category: string;
  unitsSold: number;
  revenue: number;
}

interface PackageSalesOverTimeStats {
  totalPackagesSold: number;
  avgPackagesPerDay: number;
  revenue: number;
  avgRevenuePerDay: number;
}

export function usePackageSalesOverTime(
  dateRange: { start?: Date; end?: Date },
  filters: PackageSalesOverTimeFilters,
  timePeriod: 'day' | 'week' | 'month' | 'year'
) {
  return useQuery({
    queryKey: ['package-sales-over-time', dateRange, filters, timePeriod],
    queryFn: async () => {
      const days = dateRange.start && dateRange.end
        ? eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
        : [];

      const chartData = days.map((day) => {
        const units = Math.floor(Math.random() * 10) + 1;
        return {
          date: format(day, 'd MMM'),
          units,
          revenue: units * (Math.floor(Math.random() * 3000) + 2000),
        };
      });

      const totalUnits = chartData.reduce((sum, d) => sum + d.units, 0);
      const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);

      const stats: PackageSalesOverTimeStats = {
        totalPackagesSold: totalUnits,
        avgPackagesPerDay: Math.round(totalUnits / (chartData.length || 1)),
        revenue: totalRevenue,
        avgRevenuePerDay: Math.round(totalRevenue / (chartData.length || 1)),
      };

      const tableData: PackageSaleTimeRow[] = chartData.slice(0, 10).map((d) => ({
        date: d.date,
        packageName: 'Various',
        packageType: 'Mixed',
        category: 'All',
        unitsSold: d.units,
        revenue: d.revenue,
      }));

      return { stats, chartData, tableData };
    },
    enabled: !!dateRange.start && !!dateRange.end,
  });
}
