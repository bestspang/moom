import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

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
  // For unlimited packages, only check days
  if (totalSessions === null || totalSessions === 0) {
    if (daysLeft <= 30) return 'high';
    if (daysLeft <= 60) return 'medium';
    return 'low';
  }

  const usagePercent = sessionsRemaining !== null 
    ? (sessionsRemaining / totalSessions) * 100 
    : 100;

  // High risk: ≤30 days OR (≤33% usage AND ≤3 remaining)
  if (daysLeft <= 30 || (usagePercent <= 33 && (sessionsRemaining || 0) <= 3)) {
    return 'high';
  }

  // Medium risk: ≤60 days OR (≤60% usage AND ≤15 remaining)
  if (daysLeft <= 60 || (usagePercent <= 60 && (sessionsRemaining || 0) <= 15)) {
    return 'medium';
  }

  return 'low';
}

export function useMembersAtRiskStats() {
  return useQuery({
    queryKey: ['members-at-risk-stats'],
    queryFn: async (): Promise<{ stats: RiskStats; members: MemberAtRisk[] }> => {
      // Get all active member packages with member and package info
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

      // Type assertion for the joined data
      const packages = data as unknown as PackageWithMember[];

      packages.forEach((pkg) => {
        if (!pkg.members || !pkg.packages || !pkg.expiry_date) return;

        const expiryDate = new Date(pkg.expiry_date);
        const daysLeft = differenceInDays(expiryDate, today);

        // Skip already expired packages
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

        // Calculate usage string
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
