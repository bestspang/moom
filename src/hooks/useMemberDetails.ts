import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
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

// Fetch single member by ID
export const useMember = (id: string | undefined) => {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      if (!id) throw new Error('Member ID required');
      
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          register_location:locations(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Member;
    },
    enabled: !!id,
  });
};

// Fetch member packages
export const useMemberPackages = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-packages', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      
      const { data, error } = await supabase
        .from('member_packages')
        .select(`
          *,
          package:packages(name_en, name_th, type, sessions)
        `)
        .eq('member_id', memberId)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      return data as MemberPackage[];
    },
    enabled: !!memberId,
  });
};

// Fetch member attendance history
export const useMemberAttendance = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-attendance', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      
      const { data, error } = await supabase
        .from('member_attendance')
        .select(`
          *,
          location:locations(name),
          schedule:schedule(
            scheduled_date,
            start_time,
            classes(name)
          )
        `)
        .eq('member_id', memberId)
        .order('check_in_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as MemberAttendance[];
    },
    enabled: !!memberId,
  });
};

// Fetch member billing
export const useMemberBilling = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-billing', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      
      const { data, error } = await supabase
        .from('member_billing')
        .select(`
          *,
          transaction:transactions(transaction_id, order_name, status)
        `)
        .eq('member_id', memberId)
        .order('billing_date', { ascending: false });

      if (error) throw error;
      return data as MemberBilling[];
    },
    enabled: !!memberId,
  });
};

// Fetch member notes
export const useMemberNotes = (memberId: string | undefined) => {
  return useQuery({
    queryKey: ['member-notes', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      
      const { data, error } = await supabase
        .from('member_notes')
        .select(`
          *,
          staff:staff(first_name, last_name)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MemberNote[];
    },
    enabled: !!memberId,
  });
};

// Fetch member injuries
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

// Fetch member suspensions
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

// Fetch member contracts
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

// Create note mutation
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
      toast.success(t('common.created'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Update member mutation
export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Member> }) => {
      const { error } = await supabase
        .from('members')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(t('common.saved'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Calculate days until package expiry
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

// Calculate days since member joined
export const calculateDaysSinceJoin = (memberSince: string | null): number => {
  if (!memberSince) return 0;
  
  const joinDate = new Date(memberSince);
  const today = new Date();
  const diffTime = today.getTime() - joinDate.getTime();
  
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
