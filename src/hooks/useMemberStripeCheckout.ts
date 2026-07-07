import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useMemberSession } from '@/apps/member/hooks/useMemberSession';
import { logActivity } from '@/lib/activityLogger';

export type MemberCheckoutMethod = 'card' | 'promptpay';

/**
 * Member-surface Stripe checkout initiator. Calls the shared `stripe-create-checkout`
 * edge function with `surface: 'member'` and redirects the current tab to the Stripe
 * hosted checkout URL. Fulfillment happens in the `stripe-webhook` handler.
 */
export function useMemberStripeCheckout() {
  const { memberId } = useMemberSession();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const start = async (packageId: string, method: MemberCheckoutMethod) => {
    if (!memberId) {
      toast.error(t('member.paymentFailed'));
      return;
    }
    setIsLoading(true);
    try {
      const nonce =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // PromptPay checkout sessions still allow card as fallback per Stripe docs.
      const payment_method_types =
        method === 'promptpay' ? ['promptpay', 'card'] : ['card'];

      const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
        body: {
          member_id: memberId,
          package_id: packageId,
          surface: 'member',
          payment_method_types,
          nonce,
        },
      });

      if (error) throw error;
      if (!data?.checkout_url) throw new Error('No checkout URL returned');

      logActivity({
        event_type: 'member.stripe_checkout_initiated',
        activity: `Member initiated Stripe checkout (${method}) for package ${packageId}.`,
        entity_type: 'finance_transaction',
        entity_id: data.transaction_id,
        member_id: memberId,
        new_value: { package_id: packageId, method, transaction_no: data.transaction_no },
      });

      toast.success(t('member.redirectingToStripe'));
      window.location.href = data.checkout_url;
    } catch (err: any) {
      console.error('[useMemberStripeCheckout] failed', err);
      toast.error(err?.message || t('member.paymentFailed'));
      setIsLoading(false);
    }
  };

  return { start, isLoading };
}
