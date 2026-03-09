import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { logActivity } from '@/lib/activityLogger';
import { fireGamificationEvent } from '@/lib/gamificationEvents';
import type { Database } from '@/integrations/supabase/types';

type MemberStatus = Database['public']['Enums']['member_status'];
type RiskLevel = Database['public']['Enums']['risk_level'];
type Gender = Database['public']['Enums']['gender'];

export interface Member {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  status: MemberStatus | null;
  risk_level: RiskLevel | null;
  member_since: string | null;
  total_spent: number | null;
  most_attended_category: string | null;
  avatar_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  tax_id: string | null;
  notes: string | null;
  is_new: boolean | null;
  register_location_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  register_location?: { name: string } | null;
}

export interface MemberPackage {
  id: string;
  member_id: string;
  package_id: string;
  status: string | null;
  purchase_date: string | null;
  activation_date: string | null;
  expiry_date: string | null;
  sessions_used: number | null;
  sessions_remaining: number | null;
  package?: {
    name_en: string;
    name_th: string | null;
    type: string;
    sessions: number | null;
  } | null;
}

export interface MemberAttendance {
  id: string;
  member_id: string;
  check_in_time: string | null;
  check_in_type: string | null;
  location_id: string | null;
  schedule_id: string | null;
  member_package_id: string | null;
  location?: { name: string } | null;
  schedule?: {
    scheduled_date: string;
    start_time: string;
    classes?: { name: string } | null;
  } | null;
}

export interface MemberBilling {
  id: string;
  member_id: string;
  amount: number;
  description: string | null;
  billing_date: string | null;
  transaction_id: string | null;
  transaction?: {
    transaction_id: string;
    order_name: string;
    status: string | null;
  } | null;
}

export interface MemberNote {
  id: string;
  member_id: string;
  note: string;
  created_at: string | null;
  created_by: string | null;
  staff?: { first_name: string; last_name: string } | null;
}

export interface MemberInjury {
  id: string;
  member_id: string;
  injury_description: string;
  injury_date: string | null;
  recovery_date: string | null;
  is_active: boolean | null;
  notes: string | null;
}

export interface MemberSuspension {
  id: string;
  member_id: string;
  reason: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean | null;
}

export interface MemberContract {
  id: string;
  member_id: string;
  contract_type: string | null;
  document_url: string | null;
  is_signed: boolean | null;
  signed_date: string | null;
  expiry_date: string | null;
}

// ─── Queries ───────────────────────────────────────────────

export const useMember = (id: string | undefined) => {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      if (!id) throw new Error('Member ID required');
      const { data, error } = await supabase
        .from('members')
        .select(`*, register_location:locations(name)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Member;
    },
    enabled: !!id,
  });
};

export const useMemberPackages = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-packages', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('member_packages')
        .select(`*, package:packages(name_en, name_th, type, sessions), purchase_transaction:transactions!member_packages_purchase_transaction_id_fkey(transaction_id)`)
        .eq('member_id', memberId)
        .order('purchase_date', { ascending: false });
      if (error) throw error;
      return data as MemberPackage[];
    },
    enabled: !!memberId,
  });
};

export const useMemberAttendance = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-attendance', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('member_attendance')
        .select(`*, location:locations(name), schedule:schedule(scheduled_date, start_time, classes(name))`)
        .eq('member_id', memberId)
        .order('check_in_time', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as MemberAttendance[];
    },
    enabled: !!memberId,
  });
};

export const useMemberBilling = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-billing', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('member_billing')
        .select(`*, transaction:transactions(transaction_id, order_name, status)`)
        .eq('member_id', memberId)
        .order('billing_date', { ascending: false });
      if (error) throw error;
      return data as MemberBilling[];
    },
    enabled: !!memberId,
  });
};

export const useMemberNotes = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-notes', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('member_notes')
        .select(`*, staff:staff(first_name, last_name)`)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MemberNote[];
    },
    enabled: !!memberId,
  });
};

export const useMemberInjuries = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-injuries', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('member_injuries')
        .select('*')
        .eq('member_id', memberId)
        .order('injury_date', { ascending: false });
      if (error) throw error;
      return data as MemberInjury[];
    },
    enabled: !!memberId,
  });
};

export const useMemberSuspensions = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-suspensions', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('member_suspensions')
        .select('*')
        .eq('member_id', memberId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as MemberSuspension[];
    },
    enabled: !!memberId,
  });
};

export const useMemberContracts = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-contracts', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('member_contracts')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MemberContract[];
    },
    enabled: !!memberId,
  });
};

/** Compute summary stats from actual billing data */
export const useMemberSummaryStats = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-summary-stats', memberId],
    queryFn: async () => {
      if (!memberId) return { totalSpent: 0, mostAttendedCategory: null as string | null };

      // Total spent from billing
      const { data: billingData } = await supabase
        .from('member_billing')
        .select('amount')
        .eq('member_id', memberId);
      const totalSpent = (billingData || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

      // Most attended category from attendance → schedule → classes → class_categories
      const { data: attendanceData } = await supabase
        .from('member_attendance')
        .select('schedule:schedule(classes(category_id))')
        .eq('member_id', memberId);

      const categoryCounts: Record<string, number> = {};
      for (const att of attendanceData || []) {
        const categoryId = (att.schedule as any)?.classes?.category_id;
        if (categoryId) {
          categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
        }
      }

      let mostAttendedCategory: string | null = null;
      const topCategoryId = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topCategoryId) {
        const { data: cat } = await supabase
          .from('class_categories')
          .select('name')
          .eq('id', topCategoryId)
          .single();
        mostAttendedCategory = cat?.name || null;
      }

      return { totalSpent, mostAttendedCategory };
    },
    enabled: !!memberId,
  });
};

// ─── Mutations ─────────────────────────────────────────────

export const useCreateMemberNote = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ memberId, note }: { memberId: string; note: string }) => {
      const { error } = await supabase
        .from('member_notes')
        .insert({ member_id: memberId, note });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-notes', variables.memberId] });
      logActivity({
        event_type: 'member_note_added',
        activity: `Note added for member ${variables.memberId}`,
        entity_type: 'member',
        entity_id: variables.memberId,
        new_value: { note: variables.note },
      });
      toast.success(t('common.created'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, data, oldData }: { id: string; data: Partial<Member>; oldData?: Partial<Member> }) => {
      const { error } = await supabase
        .from('members')
        .update(data)
        .eq('id', id);
      if (error) throw error;
      return { oldData };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      logActivity({
        event_type: 'member_profile_updated',
        activity: `Profile updated for member ${variables.id}`,
        entity_type: 'member',
        entity_id: variables.id,
        old_value: result?.oldData as Record<string, unknown> | undefined,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success(t('common.saved'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateMemberInjury = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (params: { memberId: string; injury_description: string; injury_date?: string; notes?: string }) => {
      const { error } = await supabase
        .from('member_injuries')
        .insert({
          member_id: params.memberId,
          injury_description: params.injury_description,
          injury_date: params.injury_date || new Date().toISOString().split('T')[0],
          notes: params.notes || null,
        });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-injuries', variables.memberId] });
      logActivity({
        event_type: 'member_injury_added',
        activity: `Injury added: ${variables.injury_description}`,
        entity_type: 'member',
        entity_id: variables.memberId,
        new_value: { injury_description: variables.injury_description, injury_date: variables.injury_date },
      });
      toast.success(t('common.created'));
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useMarkInjuryRecovered = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ injuryId, memberId }: { injuryId: string; memberId: string }) => {
      const { error } = await supabase
        .from('member_injuries')
        .update({ is_active: false, recovery_date: new Date().toISOString().split('T')[0] })
        .eq('id', injuryId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-injuries', variables.memberId] });
      logActivity({
        event_type: 'member_injury_recovered',
        activity: `Injury marked recovered`,
        entity_type: 'member',
        entity_id: variables.memberId,
        new_value: { injuryId: variables.injuryId, recovered: true },
      });
      toast.success(t('common.saved'));
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useCreateMemberSuspension = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (params: { memberId: string; reason?: string; start_date: string; end_date?: string }) => {
      const { error: suspError } = await supabase
        .from('member_suspensions')
        .insert({
          member_id: params.memberId,
          reason: params.reason || null,
          start_date: params.start_date,
          end_date: params.end_date || null,
          is_active: true,
        });
      if (suspError) throw suspError;

      // Also update member status to suspended
      const { error: memError } = await supabase
        .from('members')
        .update({ status: 'suspended' })
        .eq('id', params.memberId);
      if (memError) throw memError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-suspensions', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      logActivity({
        event_type: 'member_suspended',
        activity: `Member suspended: ${variables.reason || 'No reason'}`,
        entity_type: 'member',
        entity_id: variables.memberId,
        new_value: { reason: variables.reason, start_date: variables.start_date, end_date: variables.end_date },
      });
      toast.success(t('common.created'));
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useEndMemberSuspension = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ suspensionId, memberId }: { suspensionId: string; memberId: string }) => {
      const { error: suspError } = await supabase
        .from('member_suspensions')
        .update({ is_active: false, end_date: new Date().toISOString() })
        .eq('id', suspensionId);
      if (suspError) throw suspError;

      // Check if there are other active suspensions
      const { data: remaining } = await supabase
        .from('member_suspensions')
        .select('id')
        .eq('member_id', memberId)
        .eq('is_active', true);

      if (!remaining || remaining.length === 0) {
        await supabase
          .from('members')
          .update({ status: 'active' })
          .eq('id', memberId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-suspensions', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      logActivity({
        event_type: 'member_suspension_lifted',
        activity: `Suspension ended for member`,
        entity_type: 'member',
        entity_id: variables.memberId,
        new_value: { suspensionId: variables.suspensionId },
      });
      toast.success(t('common.saved'));
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useCreateMemberContract = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (params: {
      memberId: string;
      contract_type?: string;
      document_url?: string;
      signed_date?: string;
      is_signed?: boolean;
    }) => {
      const { error } = await supabase
        .from('member_contracts')
        .insert({
          member_id: params.memberId,
          contract_type: params.contract_type || null,
          document_url: params.document_url || null,
          signed_date: params.signed_date || null,
          is_signed: params.is_signed ?? false,
        });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-contracts', variables.memberId] });
      logActivity({
        event_type: 'member_contract_added',
        activity: `Contract added: ${variables.contract_type || 'Unknown'}`,
        entity_type: 'member',
        entity_id: variables.memberId,
        new_value: { contract_type: variables.contract_type, document_url: variables.document_url },
      });
      toast.success(t('common.created'));
    },
    onError: (error) => toast.error(error.message),
  });
};

export interface PurchasePackageParams {
  memberId: string;
  memberName: string;
  pkg: { id: string; name_en: string; price: number; sessions: number | null; type: string; term_days: number };
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'qr_promptpay' | 'other';
  locationId?: string;
  locationName?: string;
  notes?: string;
}

export const useAssignPackageToMember = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (params: PurchasePackageParams) => {
      const { memberId, memberName, pkg, paymentMethod, locationId, locationName, notes } = params;

      // 1. Generate transaction number
      const { data: txNo, error: txNoErr } = await supabase.rpc('next_transaction_number');
      if (txNoErr) throw txNoErr;

      // 2. Calculate VAT
      const vatRate = 0.07;
      const amountGross = pkg.price;
      const amountExVat = Math.round((amountGross / (1 + vatRate)) * 100) / 100;
      const amountVat = Math.round((amountGross - amountExVat) * 100) / 100;

      // 3. Insert transaction
      const { data: txn, error: txnErr } = await supabase
        .from('transactions')
        .insert({
          transaction_id: txNo,
          order_name: `Purchase: ${pkg.name_en}`,
          member_id: memberId,
          package_id: pkg.id,
          type: pkg.type as any,
          amount: amountGross,
          amount_gross: amountGross,
          amount_ex_vat: amountExVat,
          amount_vat: amountVat,
          vat_rate: vatRate,
          discount_amount: 0,
          payment_method: paymentMethod as any,
          status: 'paid' as any,
          location_id: locationId || null,
          source_type: 'pos',
          package_name_snapshot: pkg.name_en,
          sold_to_name: memberName,
          notes: notes || null,
          paid_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (txnErr) throw txnErr;

      // 4. Insert member_packages linked to transaction
      const { error: mpErr } = await supabase
        .from('member_packages')
        .insert({
          member_id: memberId,
          package_id: pkg.id,
          package_name_snapshot: pkg.name_en,
          sessions_total: pkg.sessions,
          sessions_remaining: pkg.sessions,
          sessions_used: 0,
          status: 'ready_to_use',
          purchase_date: new Date().toISOString(),
          purchase_transaction_id: txn.id,
        });
      if (mpErr) throw mpErr;

      // 5. Insert member_billing record (same pattern as approve-slip)
      await supabase.from('member_billing').insert({
        member_id: memberId,
        transaction_id: txn.id,
        amount: amountGross,
        description: `Purchase: ${pkg.name_en}`,
      });

      return { transactionNo: txNo, transactionId: txn.id };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-packages', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['package-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['member-billing', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-summary-stats', variables.memberId] });
      logActivity({
        event_type: 'package_purchased',
        activity: `Package "${variables.pkg.name_en}" purchased for member (${result.transactionNo})`,
        entity_type: 'member',
        entity_id: variables.memberId,
        new_value: {
          package_id: variables.pkg.id,
          package_name: variables.pkg.name_en,
          transaction_no: result.transactionNo,
          payment_method: variables.paymentMethod,
          amount: variables.pkg.price,
        },
      });
      fireGamificationEvent({
        event_type: 'package_purchased',
        member_id: variables.memberId,
        idempotency_key: `purchase:${result.transactionNo}`,
        metadata: { package_id: variables.pkg.id, package_name: variables.pkg.name_en },
      });
      toast.success(t('toast.packageAssigned'));
    },
    onError: (error) => toast.error(error.message),
  });
};

// ─── Utilities ─────────────────────────────────────────────

export const calculateDaysUntilExpiry = (packages: MemberPackage[]): number => {
  const activePackages = packages.filter(
    (p) => p.status === 'active' && p.expiry_date
  );
  if (activePackages.length === 0) return 0;
  const nearestExpiry = activePackages.reduce((nearest, pkg) => {
    const expiryDate = new Date(pkg.expiry_date!);
    return expiryDate < nearest ? expiryDate : nearest;
  }, new Date(activePackages[0].expiry_date!));
  const today = new Date();
  const diffTime = nearestExpiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const calculateDaysSinceJoin = (memberSince: string | null): number => {
  if (!memberSince) return 0;
  const joinDate = new Date(memberSince);
  const today = new Date();
  const diffTime = today.getTime() - joinDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
