import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';

// Types based on database schema
type UsageType = 'checkin' | 'booking' | 'pt_session' | 'adjustment';

interface PackageUsageLedger {
  id: string;
  member_package_id: string;
  usage_type: UsageType;
  reference_id: string | null;
  reference_type: string | null;
  delta_sessions: number;
  balance_after: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

// Fetch usage history for a member package
export const usePackageUsageHistory = (memberPackageId: string) => {
  return useQuery({
    queryKey: queryKeys.packageUsage(memberPackageId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('package_usage_ledger')
        .select(`
          *,
          staff:created_by(id, first_name, last_name, nickname)
        `)
        .eq('member_package_id', memberPackageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PackageUsageLedger[];
    },
    enabled: !!memberPackageId,
  });
};

// Fetch all usage history for a member (across all packages)
export const useMemberUsageHistory = (memberId: string) => {
  return useQuery({
    queryKey: queryKeys.memberUsageHistory(memberId),
    queryFn: async () => {
      // First get all member packages
      const { data: packages, error: packagesError } = await supabase
        .from('member_packages')
        .select('id')
        .eq('member_id', memberId);

      if (packagesError) throw packagesError;
      if (!packages || packages.length === 0) return [];

      const packageIds = packages.map((p) => p.id);

      // Then get usage for all packages
      const { data, error } = await supabase
        .from('package_usage_ledger')
        .select(`
          *,
          member_packages(id, package_id, packages(name_en, name_th)),
          staff:created_by(id, first_name, last_name, nickname)
        `)
        .in('member_package_id', packageIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });
};

// Record usage (deduct sessions)
export const useRecordUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberPackageId,
      usageType,
      referenceId,
      referenceType,
      deltaSessions,
      note,
      createdBy,
    }: {
      memberPackageId: string;
      usageType: UsageType;
      referenceId?: string;
      referenceType?: string;
      deltaSessions: number;
      note?: string;
      createdBy?: string;
    }) => {
      // Get current balance
      const { data: pkg, error: pkgError } = await supabase
        .from('member_packages')
        .select('sessions_remaining')
        .eq('id', memberPackageId)
        .single();

      if (pkgError) throw pkgError;
      if (!pkg) throw new Error('Package not found');

      const currentBalance = pkg.sessions_remaining || 0;
      const newBalance = currentBalance + deltaSessions; // deltaSessions is negative for deductions

      if (newBalance < 0) {
        throw new Error('Insufficient sessions remaining');
      }

      // Insert ledger entry
      const { data: ledgerEntry, error: ledgerError } = await supabase
        .from('package_usage_ledger')
        .insert({
          member_package_id: memberPackageId,
          usage_type: usageType,
          reference_id: referenceId || null,
          reference_type: referenceType || null,
          delta_sessions: deltaSessions,
          balance_after: newBalance,
          note: note || null,
          created_by: createdBy || null,
        })
        .select()
        .single();

      if (ledgerError) throw ledgerError;

      // Update package balance
      const { error: updateError } = await supabase
        .from('member_packages')
        .update({
          sessions_remaining: newBalance,
          sessions_used: (pkg.sessions_remaining || 0) - newBalance + (currentBalance - newBalance),
        })
        .eq('id', memberPackageId);

      if (updateError) throw updateError;

      return ledgerEntry;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packageUsage(variables.memberPackageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.memberPackages('') });
      logActivity({
        event_type: 'package_usage_recorded',
        activity: `Package usage recorded: ${variables.usageType} (${variables.deltaSessions} sessions)`,
        entity_type: 'member_package',
        entity_id: variables.memberPackageId,
        new_value: { usageType: variables.usageType, deltaSessions: variables.deltaSessions },
      });
      toast.success(i18n.t('toast.usageRecorded'));
    },
    onError: (error: Error) => {
      if (error.message.includes('Insufficient')) {
        toast.error(i18n.t('toast.insufficientSessions'));
      } else {
        toast.error(i18n.t('toast.usageRecordFailed'));
      }
      console.error('Record usage error:', error);
    },
  });
};

// Refund usage (add sessions back)
export const useRefundUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberPackageId,
      sessions,
      note,
      createdBy,
    }: {
      memberPackageId: string;
      sessions: number;
      note?: string;
      createdBy?: string;
    }) => {
      // Get current balance
      const { data: pkg, error: pkgError } = await supabase
        .from('member_packages')
        .select('sessions_remaining')
        .eq('id', memberPackageId)
        .single();

      if (pkgError) throw pkgError;
      if (!pkg) throw new Error('Package not found');

      const currentBalance = pkg.sessions_remaining || 0;
      const newBalance = currentBalance + sessions;

      // Insert ledger entry (positive delta for refund)
      const { data: ledgerEntry, error: ledgerError } = await supabase
        .from('package_usage_ledger')
        .insert({
          member_package_id: memberPackageId,
          usage_type: 'adjustment',
          delta_sessions: sessions,
          balance_after: newBalance,
          note: note || 'Session refund',
          created_by: createdBy || null,
        })
        .select()
        .single();

      if (ledgerError) throw ledgerError;

      // Update package balance
      const { error: updateError } = await supabase
        .from('member_packages')
        .update({ sessions_remaining: newBalance })
        .eq('id', memberPackageId);

      if (updateError) throw updateError;

      return ledgerEntry;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packageUsage(variables.memberPackageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.memberPackages('') });
      logActivity({
        event_type: 'package_sessions_refunded',
        activity: `Package sessions refunded: ${variables.sessions} sessions`,
        entity_type: 'member_package',
        entity_id: variables.memberPackageId,
        new_value: { sessions: variables.sessions, note: variables.note },
      });
      toast.success(i18n.t('toast.sessionsRefunded'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.sessionsRefundFailed'));
      console.error('Refund usage error:', error);
    },
  });
};

// Adjust balance (manual adjustment)
export const useAdjustBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberPackageId,
      newBalance,
      note,
      createdBy,
    }: {
      memberPackageId: string;
      newBalance: number;
      note: string;
      createdBy?: string;
    }) => {
      // Get current balance
      const { data: pkg, error: pkgError } = await supabase
        .from('member_packages')
        .select('sessions_remaining')
        .eq('id', memberPackageId)
        .single();

      if (pkgError) throw pkgError;
      if (!pkg) throw new Error('Package not found');

      const currentBalance = pkg.sessions_remaining || 0;
      const deltaSessions = newBalance - currentBalance;

      // Insert ledger entry
      const { data: ledgerEntry, error: ledgerError } = await supabase
        .from('package_usage_ledger')
        .insert({
          member_package_id: memberPackageId,
          usage_type: 'adjustment',
          delta_sessions: deltaSessions,
          balance_after: newBalance,
          note: note,
          created_by: createdBy || null,
        })
        .select()
        .single();

      if (ledgerError) throw ledgerError;

      // Update package balance
      const { error: updateError } = await supabase
        .from('member_packages')
        .update({ sessions_remaining: newBalance })
        .eq('id', memberPackageId);

      if (updateError) throw updateError;

      return ledgerEntry;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packageUsage(variables.memberPackageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.memberPackages('') });
      logActivity({
        event_type: 'package_balance_adjusted',
        activity: `Package balance adjusted to ${variables.newBalance} sessions`,
        entity_type: 'member_package',
        entity_id: variables.memberPackageId,
        new_value: { newBalance: variables.newBalance, note: variables.note },
      });
      toast.success(i18n.t('toast.balanceAdjusted'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.balanceAdjustFailed'));
      console.error('Adjust balance error:', error);
    },
  });
};

// Get usage summary for a package
export const usePackageUsageSummary = (memberPackageId: string) => {
  return useQuery({
    queryKey: queryKeys.packageUsageSummary(memberPackageId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('package_usage_ledger')
        .select('usage_type, delta_sessions')
        .eq('member_package_id', memberPackageId);

      if (error) throw error;

      // Calculate summary
      const summary = {
        totalCheckins: 0,
        totalBookings: 0,
        totalPTSessions: 0,
        totalAdjustments: 0,
        totalUsed: 0,
        totalRefunded: 0,
      };

      data?.forEach((entry) => {
        if (entry.delta_sessions < 0) {
          summary.totalUsed += Math.abs(entry.delta_sessions);
          switch (entry.usage_type) {
            case 'checkin':
              summary.totalCheckins += Math.abs(entry.delta_sessions);
              break;
            case 'booking':
              summary.totalBookings += Math.abs(entry.delta_sessions);
              break;
            case 'pt_session':
              summary.totalPTSessions += Math.abs(entry.delta_sessions);
              break;
          }
        } else {
          summary.totalRefunded += entry.delta_sessions;
          if (entry.usage_type === 'adjustment') {
            summary.totalAdjustments += entry.delta_sessions;
          }
        }
      });

      return summary;
    },
    enabled: !!memberPackageId,
  });
};
