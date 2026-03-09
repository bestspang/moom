import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMemberSession } from '@/apps/member/hooks/useMemberSession';

/**
 * Subscribes to xp_ledger INSERTs for the current member and shows a toast.
 * Renders nothing — mount once in MemberLayout.
 */
export function XPToast() {
  const { memberId } = useMemberSession();

  useEffect(() => {
    if (!memberId) return;

    const channel = supabase
      .channel('xp-toast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'xp_ledger',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          const row = payload.new as { delta?: number; event_type?: string };
          const delta = row.delta ?? 0;
          if (delta <= 0) return;

          toast(`+${delta} XP`, {
            description: row.event_type
              ? row.event_type.replace(/_/g, ' ')
              : 'Keep up the momentum!',
            duration: 3000,
            position: 'top-center',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId]);

  return null;
}
