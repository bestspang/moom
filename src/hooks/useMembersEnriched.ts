import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Member = Database['public']['Tables']['members']['Row'];

export interface EnrichedMember extends Member {
  recent_package: string | null;
  last_attended: string | null;
  has_contract: boolean;
}

/**
 * Fetches enriched member data: recent package name, last attendance, contract status.
 * Takes an array of member IDs and returns a map of enrichments.
 */
export const useMembersEnrichment = (memberIds: string[]) => {
  return useQuery({
    queryKey: ['members-enrichment', memberIds],
    queryFn: async () => {
      if (memberIds.length === 0) return {};

      // Fetch latest active member_packages with package names
      const { data: packages } = await supabase
        .from('member_packages')
        .select('member_id, package_id, status, created_at, packages(name_en)')
        .in('member_id', memberIds)
        .in('status', ['active', 'ready_to_use'])
        .order('created_at', { ascending: false });

      // Fetch latest attendance per member
      const { data: attendance } = await supabase
        .from('member_attendance')
        .select('member_id, check_in_time')
        .in('member_id', memberIds)
        .order('check_in_time', { ascending: false });

      // Fetch contract existence
      const { data: contracts } = await supabase
        .from('member_contracts')
        .select('member_id')
        .in('member_id', memberIds)
        .eq('is_signed', true);

      // Build enrichment map
      const enrichment: Record<string, { recent_package: string | null; last_attended: string | null; has_contract: boolean }> = {};

      // Initialize all members
      for (const id of memberIds) {
        enrichment[id] = { recent_package: null, last_attended: null, has_contract: false };
      }

      // Latest package per member (first occurrence since ordered desc)
      const seenPkg = new Set<string>();
      for (const pkg of packages || []) {
        if (!seenPkg.has(pkg.member_id)) {
          seenPkg.add(pkg.member_id);
          const pkgData = pkg.packages as any;
          enrichment[pkg.member_id].recent_package = pkgData?.name_en || null;
        }
      }

      // Latest attendance per member
      const seenAtt = new Set<string>();
      for (const att of attendance || []) {
        if (!seenAtt.has(att.member_id)) {
          seenAtt.add(att.member_id);
          enrichment[att.member_id].last_attended = att.check_in_time;
        }
      }

      // Contract existence
      for (const contract of contracts || []) {
        enrichment[contract.member_id].has_contract = true;
      }

      return enrichment;
    },
    enabled: memberIds.length > 0,
    staleTime: 30_000,
  });
};
