import { supabase } from '@/integrations/supabase/client';

export interface ReferralInfo {
  id: string;
  referralCode: string;
  referredMemberId: string | null;
  status: string;
  rewardGranted: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface ReferralStats {
  referralCode: string;
  totalInvited: number;
  totalCompleted: number;
  totalPointsEarned: number;
  referrals: ReferralInfo[];
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MOOM-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function fetchOrCreateReferralCode(memberId: string): Promise<string> {
  // Check existing
  const { data: existing } = await supabase
    .from('member_referrals')
    .select('referral_code')
    .eq('referrer_member_id', memberId)
    .limit(1);

  const rows = existing as any[];
  if (rows?.length > 0) {
    return rows[0].referral_code;
  }

  // Create new
  const code = generateReferralCode();
  const { error } = await supabase
    .from('member_referrals')
    .insert({
      referrer_member_id: memberId,
      referral_code: code,
      status: 'pending',
    });

  if (error) {
    // Retry with different code if unique violation
    if (error.code === '23505') {
      const retryCode = generateReferralCode();
      await supabase
        .from('member_referrals')
        .insert({
          referrer_member_id: memberId,
          referral_code: retryCode,
          status: 'pending',
        });
      return retryCode;
    }
    throw error;
  }

  return code;
}

export async function fetchReferralStats(memberId: string): Promise<ReferralStats> {
  const { data, error } = await supabase
    .from('member_referrals')
    .select('*')
    .eq('referrer_member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const referrals: ReferralInfo[] = ((data as any[]) ?? []).map((r: any) => ({
    id: r.id,
    referralCode: r.referral_code,
    referredMemberId: r.referred_member_id,
    status: r.status,
    rewardGranted: r.reward_granted,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));

  const code = referrals[0]?.referralCode ?? '';
  const totalCompleted = referrals.filter(r => r.status === 'completed').length;

  return {
    referralCode: code,
    totalInvited: referrals.filter(r => r.referredMemberId).length,
    totalCompleted,
    totalPointsEarned: totalCompleted * 200,
    referrals,
  };
}

export async function lookupReferralByCode(code: string): Promise<{ referrerMemberId: string } | null> {
  const { data, error } = await supabase
    .from('member_referrals')
    .select('referrer_member_id')
    .eq('referral_code', code.toUpperCase().trim())
    .limit(1);

  if (error) throw error;
  const rows = data as any[];
  if (!rows?.length) return null;
  return { referrerMemberId: rows[0].referrer_member_id };
}
