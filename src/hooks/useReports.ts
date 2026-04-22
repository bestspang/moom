import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format, eachDayOfInterval, startOfWeek, startOfMonth, startOfYear, getDay, getHours, addDays } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';

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
    queryKey: queryKeys.membersAtRiskStats(),
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
    queryKey: queryKeys.activeMembers(dateRange, filters),
    queryFn: async () => {
      let query = supabase
        .from('member_attendance')
        .select('check_in_time, member_id, location_id, members!inner(gender, date_of_birth)')
        .gte('check_in_time', format(dateRange.start!, 'yyyy-MM-dd'))
        .lte('check_in_time', format(dateRange.end!, 'yyyy-MM-dd') + 'T23:59:59');

      if (filters.location !== 'all') {
        query = query.eq('location_id', filters.location);
      }

      const { data: attendanceData, error } = await query;
      if (error) throw error;

      const allDays = dateRange.start && dateRange.end
        ? eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
        : [];

      // Group unique members by date
      const dateMap = new Map<string, Set<string>>();
      allDays.forEach((day) => dateMap.set(format(day, 'd MMM'), new Set()));

      (attendanceData || []).forEach((row: any) => {
        if (!row.check_in_time) return;
        const memberGender = row.members?.gender;
        if (filters.gender !== 'all' && memberGender !== filters.gender) return;
        if (filters.age !== 'all' && row.members?.date_of_birth) {
          const age = differenceInDays(new Date(), new Date(row.members.date_of_birth)) / 365;
          const [minAge, maxAge] = filters.age === '46+' ? [46, 200] : filters.age.split('-').map(Number);
          if (age < minAge || age > maxAge) return;
        }
        const dateKey = format(new Date(row.check_in_time), 'd MMM');
        dateMap.get(dateKey)?.add(row.member_id);
      });

      const chartData = allDays.map((day) => {
        const key = format(day, 'd MMM');
        return { date: key, activeMembers: dateMap.get(key)?.size || 0 };
      });

      const activeCounts = chartData.map((d) => d.activeMembers);
      const maxActive = activeCounts.length > 0 ? Math.max(...activeCounts) : 0;
      const minActive = activeCounts.length > 0 ? Math.min(...activeCounts) : 0;
      const totalActive = activeCounts.reduce((a, b) => a + b, 0);

      const uniqueMembers = new Set<string>();
      (attendanceData || []).forEach((row: any) => {
        if (row.member_id) uniqueMembers.add(row.member_id);
      });

      const stats: ActiveMembersStats = {
        mostActiveDay: maxActive,
        mostActiveDayDate: chartData.find((d) => d.activeMembers === maxActive)?.date || '-',
        leastActiveDay: minActive,
        leastActiveDayDate: chartData.find((d) => d.activeMembers === minActive)?.date || '-',
        avgActivePerDay: chartData.length > 0 ? Math.round(totalActive / chartData.length) : 0,
        newActivePerDay: chartData.length > 0 ? Math.round(uniqueMembers.size / chartData.length) : 0,
      };

      const tableData: ActiveMemberRow[] = chartData.map((d) => ({
        date: d.date,
        activeMembers: d.activeMembers,
        location: filters.location === 'all' ? 'All Locations' : filters.location,
        ageGroup: filters.age === 'all' ? 'All' : filters.age,
        gender: filters.gender === 'all' ? 'All' : filters.gender,
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
    queryKey: queryKeys.classCapacityByHour(dateRange, filters),
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
    queryKey: queryKeys.classCapacityOverTime(dateRange, filters),
    queryFn: async () => {
      let query = supabase
        .from('schedule')
        .select('scheduled_date, capacity, checked_in, trainer_id, location_id')
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

      // Group by date
      const dateMap = new Map<string, { totalCapPct: number; count: number; withBookings: number }>();

      (scheduleData || []).forEach((row: any) => {
        const dateKey = format(new Date(row.scheduled_date), 'd MMM');
        const capPct = row.capacity > 0 ? Math.round((row.checked_in / row.capacity) * 100) : 0;
        const existing = dateMap.get(dateKey) || { totalCapPct: 0, count: 0, withBookings: 0 };
        existing.totalCapPct += capPct;
        existing.count += 1;
        if (row.checked_in > 0) existing.withBookings += 1;
        dateMap.set(dateKey, existing);
      });

      const days = dateRange.start && dateRange.end
        ? eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
        : [];

      const chartData = days.map((day) => {
        const key = format(day, 'd MMM');
        const entry = dateMap.get(key);
        return {
          date: key,
          capacity: entry ? Math.round(entry.totalCapPct / entry.count) : 0,
          classes: entry?.count || 0,
        };
      });

      const totalClasses = chartData.reduce((sum, d) => sum + d.classes, 0);
      const totalCapacity = chartData.reduce((sum, d) => sum + d.capacity * d.classes, 0);
      const totalWithBookings = Array.from(dateMap.values()).reduce((sum, d) => sum + d.withBookings, 0);

      const stats: ClassCapacityOverTimeStats = {
        avgCapacity: totalClasses > 0 ? Math.round(totalCapacity / totalClasses) : 0,
        classesWithBookings: totalWithBookings,
        avgClassesPerDay: days.length > 0 ? Math.round(totalClasses / days.length) : 0,
      };

      const tableData: ClassCapacityRow[] = chartData
        .filter((d) => d.classes > 0)
        .map((d) => ({
          date: d.date,
          trainer: filters.trainer === 'all' ? 'All Trainers' : filters.trainer,
          location: filters.location === 'all' ? 'All Locations' : filters.location,
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
    queryKey: queryKeys.packageSales(dateRange, filters),
    queryFn: async () => {
      // Query paid transactions with package info
      let query = supabase
        .from('transactions')
        .select('amount, package_id, paid_at, packages!inner(name_en, type, categories)')
        .eq('status', 'paid')
        .not('package_id', 'is', null)
        .gte('paid_at', format(dateRange.start!, 'yyyy-MM-dd'))
        .lte('paid_at', format(dateRange.end!, 'yyyy-MM-dd') + 'T23:59:59');

      const { data: txData, error } = await query;
      if (error) throw error;

      // Group by package
      const packageMap = new Map<string, { name: string; type: string; category: string; units: number; revenue: number }>();

      (txData || []).forEach((tx: any) => {
        const pkg = tx.packages;
        if (!pkg) return;

        const pkgType = pkg.type || 'other';
        const pkgCategory = (pkg.categories && pkg.categories.length > 0) ? pkg.categories[0] : 'All';

        // Apply filters
        if (filters.packageType !== 'all' && pkgType !== filters.packageType) return;
        if (filters.category !== 'all' && pkgCategory !== filters.category) return;

        const key = pkg.name_en || tx.package_id;
        const existing = packageMap.get(key) || { name: key, type: pkgType, category: pkgCategory, units: 0, revenue: 0 };
        existing.units += 1;
        existing.revenue += Number(tx.amount) || 0;
        packageMap.set(key, existing);
      });

      const tableData: PackageSaleRow[] = Array.from(packageMap.values()).map((d) => ({
        packageName: d.name,
        packageType: d.type,
        category: d.category,
        unitsSold: d.units,
        revenue: d.revenue,
      }));

      const chartData = tableData.map((d) => ({
        name: d.packageName,
        units: d.unitsSold,
        revenue: Math.round(d.revenue / 1000),
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
    queryKey: queryKeys.packageSalesOverTime(dateRange, filters, timePeriod),
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('amount, package_id, paid_at, packages!inner(name_en, type, categories)')
        .eq('status', 'paid')
        .not('package_id', 'is', null)
        .gte('paid_at', format(dateRange.start!, 'yyyy-MM-dd'))
        .lte('paid_at', format(dateRange.end!, 'yyyy-MM-dd') + 'T23:59:59');

      const { data: txData, error } = await query;
      if (error) throw error;

      // Determine grouping key function
      const getGroupKey = (dateStr: string): string => {
        const d = new Date(dateStr);
        switch (timePeriod) {
          case 'week': return format(startOfWeek(d), 'd MMM');
          case 'month': return format(startOfMonth(d), 'MMM yyyy');
          case 'year': return format(startOfYear(d), 'yyyy');
          default: return format(d, 'd MMM');
        }
      };

      // Filter and group
      const groupMap = new Map<string, { units: number; revenue: number }>();

      (txData || []).forEach((tx: any) => {
        const pkg = tx.packages;
        if (!pkg || !tx.paid_at) return;

        const pkgType = pkg.type || 'other';
        const pkgCategory = (pkg.categories && pkg.categories.length > 0) ? pkg.categories[0] : 'All';

        if (filters.packageType !== 'all' && pkgType !== filters.packageType) return;
        if (filters.category !== 'all' && pkgCategory !== filters.category) return;
        if (filters.package !== 'all' && pkg.name_en !== filters.package) return;

        const key = getGroupKey(tx.paid_at);
        const existing = groupMap.get(key) || { units: 0, revenue: 0 };
        existing.units += 1;
        existing.revenue += Number(tx.amount) || 0;
        groupMap.set(key, existing);
      });

      // Build chart data from all periods
      const days = dateRange.start && dateRange.end
        ? eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
        : [];

      // For day view, show each day; for others, show grouped
      const seenKeys = new Set<string>();
      const chartData: { date: string; units: number; revenue: number }[] = [];

      days.forEach((day) => {
        const key = getGroupKey(format(day, 'yyyy-MM-dd'));
        if (seenKeys.has(key)) return;
        seenKeys.add(key);
        const entry = groupMap.get(key) || { units: 0, revenue: 0 };
        chartData.push({
          date: key,
          units: entry.units,
          revenue: Math.round(entry.revenue / 1000),
        });
      });

      const totalUnits = chartData.reduce((sum, d) => sum + d.units, 0);
      const totalRevenue = (txData || [])
        .filter((tx: any) => {
          const pkg = tx.packages;
          if (!pkg) return false;
          if (filters.packageType !== 'all' && pkg.type !== filters.packageType) return false;
          if (filters.category !== 'all') {
            const cat = (pkg.categories && pkg.categories.length > 0) ? pkg.categories[0] : 'All';
            if (cat !== filters.category) return false;
          }
          if (filters.package !== 'all' && pkg.name_en !== filters.package) return false;
          return true;
        })
        .reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0);

      const numPeriods = chartData.length || 1;

      const stats: PackageSalesOverTimeStats = {
        totalPackagesSold: totalUnits,
        avgPackagesPerDay: Math.round(totalUnits / numPeriods),
        revenue: totalRevenue,
        avgRevenuePerDay: Math.round(totalRevenue / numPeriods),
      };

      const tableData: PackageSaleTimeRow[] = chartData
        .filter((d) => d.units > 0)
        .map((d) => ({
          date: d.date,
          packageName: filters.package === 'all' ? 'Various' : filters.package,
          packageType: filters.packageType === 'all' ? 'Mixed' : filters.packageType,
          category: filters.category === 'all' ? 'All' : filters.category,
          unitsSold: d.units,
          revenue: d.revenue * 1000, // Convert back from chart scale
        }));

      return { stats, chartData, tableData };
    },
    enabled: !!dateRange.start && !!dateRange.end,
  });
}

// ── Member Package Usage ──

export interface PackageUsageRow {
  memberName: string;
  packageName: string;
  packageType: string;
  sessionsUsed: number;
  sessionsTotal: number;
  usagePercent: number;
  expiryDate: string;
  status: string;
}

export interface PackageUsageStats {
  totalActivePackages: number;
  avgUsagePercent: number;
  fullyUsed: number;
  neverUsed: number;
}

export function useMemberPackageUsage(
  filters: { packageType: string; status: string }
) {
  return useQuery({
    queryKey: queryKeys.memberPackageUsage(undefined, filters),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_packages')
        .select(`
          id,
          sessions_used,
          sessions_total,
          expires_at,
          status,
          packages!inner(name_en, type),
          members!inner(first_name, last_name)
        `)
        .not('status', 'eq', 'cancelled');

      if (error) throw error;

      let rows: PackageUsageRow[] = (data || []).map((mp: any) => {
        const sessionsUsed = mp.sessions_used ?? 0;
        const sessionsTotal = mp.sessions_total ?? 0;
        const usagePercent = sessionsTotal > 0 ? Math.round((sessionsUsed / sessionsTotal) * 100) : 0;
        return {
          memberName: `${mp.members?.first_name ?? ''} ${mp.members?.last_name ?? ''}`.trim(),
          packageName: mp.packages?.name_en ?? '',
          packageType: mp.packages?.type ?? '',
          sessionsUsed,
          sessionsTotal,
          usagePercent,
          expiryDate: mp.expires_at ? format(new Date(mp.expires_at), 'd MMM yyyy') : '-',
          status: mp.status ?? '',
        };
      });

      if (filters.packageType !== 'all') {
        rows = rows.filter((r) => r.packageType === filters.packageType);
      }
      if (filters.status !== 'all') {
        rows = rows.filter((r) => r.status === filters.status);
      }

      const stats: PackageUsageStats = {
        totalActivePackages: rows.length,
        avgUsagePercent: rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.usagePercent, 0) / rows.length) : 0,
        fullyUsed: rows.filter((r) => r.usagePercent >= 100).length,
        neverUsed: rows.filter((r) => r.usagePercent === 0).length,
      };

      const chartData = [
        { name: '0–25%', value: rows.filter((r) => r.usagePercent <= 25).length },
        { name: '26–50%', value: rows.filter((r) => r.usagePercent > 25 && r.usagePercent <= 50).length },
        { name: '51–75%', value: rows.filter((r) => r.usagePercent > 50 && r.usagePercent <= 75).length },
        { name: '76–99%', value: rows.filter((r) => r.usagePercent > 75 && r.usagePercent < 100).length },
        { name: '100%', value: rows.filter((r) => r.usagePercent >= 100).length },
      ];

      return { stats, chartData, tableData: rows };
    },
  });
}

// ── Member Package At Risk ──

export interface PackageAtRiskRow {
  memberName: string;
  packageName: string;
  packageType: string;
  sessionsRemaining: number;
  daysUntilExpiry: number;
  riskLevel: 'high' | 'medium' | 'low';
  expiryDate: string;
}

export interface PackageAtRiskStats {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  totalAtRisk: number;
}

export function useMemberPackageAtRisk(filters: { packageType: string; riskLevel: string }) {
  return useQuery({
    queryKey: queryKeys.memberPackageAtRisk(filters),
    queryFn: async () => {
      const cutoffDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('member_packages')
        .select(`
          id,
          sessions_used,
          sessions_total,
          expires_at,
          status,
          packages!inner(name_en, type),
          members!inner(first_name, last_name)
        `)
        .eq('status', 'active')
        .lte('expires_at', cutoffDate);

      if (error) throw error;

      let rows: PackageAtRiskRow[] = (data || []).map((mp: any) => {
        const sessionsTotal = mp.sessions_total ?? 0;
        const sessionsUsed = mp.sessions_used ?? 0;
        const sessionsRemaining = sessionsTotal > 0 ? sessionsTotal - sessionsUsed : 999;
        const expiresAt = mp.expires_at ? new Date(mp.expires_at) : null;
        const daysUntilExpiry = expiresAt
          ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)
          : 999;

        let riskLevel: 'high' | 'medium' | 'low' = 'low';
        if (sessionsRemaining <= 1 || daysUntilExpiry <= 7) riskLevel = 'high';
        else if (sessionsRemaining <= 3 || daysUntilExpiry <= 14) riskLevel = 'medium';

        return {
          memberName: `${mp.members?.first_name ?? ''} ${mp.members?.last_name ?? ''}`.trim(),
          packageName: mp.packages?.name_en ?? '',
          packageType: mp.packages?.type ?? '',
          sessionsRemaining: sessionsRemaining === 999 ? 0 : sessionsRemaining,
          daysUntilExpiry: daysUntilExpiry === 999 ? 0 : daysUntilExpiry,
          riskLevel,
          expiryDate: expiresAt ? format(expiresAt, 'd MMM yyyy') : '-',
        };
      });

      if (filters.packageType !== 'all') {
        rows = rows.filter((r) => r.packageType === filters.packageType);
      }
      if (filters.riskLevel !== 'all') {
        rows = rows.filter((r) => r.riskLevel === filters.riskLevel);
      }

      const stats: PackageAtRiskStats = {
        highRisk: rows.filter((r) => r.riskLevel === 'high').length,
        mediumRisk: rows.filter((r) => r.riskLevel === 'medium').length,
        lowRisk: rows.filter((r) => r.riskLevel === 'low').length,
        totalAtRisk: rows.length,
      };

      return { stats, tableData: rows };
    },
  });
}

// ── Class Category Popularity ──

export interface ClassCategoryRow {
  category: string;
  totalClasses: number;
  totalBookings: number;
  avgCapacityPercent: number;
  totalAttendees: number;
}

export interface ClassCategoryStats {
  topCategory: string;
  totalCategories: number;
  avgFillRate: number;
  totalBookings: number;
}

export function useClassCategoryPopularity(dateRange: { start?: Date; end?: Date }) {
  return useQuery({
    queryKey: queryKeys.classCategoryPopularity(dateRange),
    queryFn: async () => {
      const { data: schedules, error } = await supabase
        .from('schedule')
        .select(`
          id,
          capacity,
          start_time,
          classes!inner(category_id, name),
          class_bookings(id, status)
        `)
        .gte('start_time', format(dateRange.start!, 'yyyy-MM-dd'))
        .lte('start_time', format(dateRange.end!, 'yyyy-MM-dd') + 'T23:59:59');

      if (error) throw error;

      const categoryMap = new Map<string, { totalClasses: number; totalBookings: number; totalCapacity: number; totalAttendees: number }>();

      (schedules || []).forEach((s: any) => {
        const category = s.classes?.category_id ?? 'Uncategorized';
        const confirmedBookings = (s.class_bookings || []).filter((b: any) => b.status === 'confirmed' || b.status === 'attended').length;
        const existing = categoryMap.get(category) || { totalClasses: 0, totalBookings: 0, totalCapacity: 0, totalAttendees: 0 };
        existing.totalClasses += 1;
        existing.totalBookings += confirmedBookings;
        existing.totalCapacity += s.capacity ?? 0;
        existing.totalAttendees += confirmedBookings;
        categoryMap.set(category, existing);
      });

      const tableData: ClassCategoryRow[] = Array.from(categoryMap.entries())
        .map(([category, val]) => ({
          category,
          totalClasses: val.totalClasses,
          totalBookings: val.totalBookings,
          avgCapacityPercent: val.totalCapacity > 0 ? Math.round((val.totalBookings / val.totalCapacity) * 100) : 0,
          totalAttendees: val.totalAttendees,
        }))
        .sort((a, b) => b.totalBookings - a.totalBookings);

      const chartData = tableData.slice(0, 8).map((r) => ({ name: r.category, value: r.totalBookings }));
      const totalBookings = tableData.reduce((s, r) => s + r.totalBookings, 0);

      const stats: ClassCategoryStats = {
        topCategory: tableData[0]?.category ?? '-',
        totalCategories: tableData.length,
        avgFillRate: tableData.length > 0 ? Math.round(tableData.reduce((s, r) => s + r.avgCapacityPercent, 0) / tableData.length) : 0,
        totalBookings,
      };

      return { stats, chartData, tableData };
    },
    enabled: !!dateRange.start && !!dateRange.end,
  });
}

// ── Class Popularity ──

export interface ClassPopularityRow {
  className: string;
  category: string;
  totalSchedules: number;
  totalBookings: number;
  avgCapacityPercent: number;
  totalAttendees: number;
}

export interface ClassPopularityStats {
  topClass: string;
  totalClasses: number;
  avgFillRate: number;
  totalBookings: number;
}

export function useClassPopularity(dateRange: { start?: Date; end?: Date }) {
  return useQuery({
    queryKey: queryKeys.classPopularity(dateRange),
    queryFn: async () => {
      const { data: schedules, error } = await supabase
        .from('schedule')
        .select(`
          id,
          capacity,
          start_time,
          classes!inner(name, category_id),
          class_bookings(id, status)
        `)
        .gte('start_time', format(dateRange.start!, 'yyyy-MM-dd'))
        .lte('start_time', format(dateRange.end!, 'yyyy-MM-dd') + 'T23:59:59');

      if (error) throw error;

      const classMap = new Map<string, { category: string; totalSchedules: number; totalBookings: number; totalCapacity: number; totalAttendees: number }>();

      (schedules || []).forEach((s: any) => {
        const className = s.classes?.name_en ?? 'Unknown';
        const category = s.classes?.category ?? '-';
        const confirmedBookings = (s.class_bookings || []).filter((b: any) => b.status === 'confirmed' || b.status === 'attended').length;
        const existing = classMap.get(className) || { category, totalSchedules: 0, totalBookings: 0, totalCapacity: 0, totalAttendees: 0 };
        existing.totalSchedules += 1;
        existing.totalBookings += confirmedBookings;
        existing.totalCapacity += s.capacity ?? 0;
        existing.totalAttendees += confirmedBookings;
        classMap.set(className, existing);
      });

      const tableData: ClassPopularityRow[] = Array.from(classMap.entries())
        .map(([className, val]) => ({
          className,
          category: val.category,
          totalSchedules: val.totalSchedules,
          totalBookings: val.totalBookings,
          avgCapacityPercent: val.totalCapacity > 0 ? Math.round((val.totalBookings / val.totalCapacity) * 100) : 0,
          totalAttendees: val.totalAttendees,
        }))
        .sort((a, b) => b.totalBookings - a.totalBookings);

      const chartData = tableData.slice(0, 10).map((r) => ({ name: r.className, value: r.totalBookings }));
      const totalBookings = tableData.reduce((s, r) => s + r.totalBookings, 0);

      const stats: ClassPopularityStats = {
        topClass: tableData[0]?.className ?? '-',
        totalClasses: tableData.length,
        avgFillRate: tableData.length > 0 ? Math.round(tableData.reduce((s, r) => s + r.avgCapacityPercent, 0) / tableData.length) : 0,
        totalBookings,
      };

      return { stats, chartData, tableData };
    },
    enabled: !!dateRange.start && !!dateRange.end,
  });
}
