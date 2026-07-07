import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface StripeCheckoutParams {
  member_id: string;
  package_id: string;
  location_id?: string;
}

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const createCheckout = async (params: StripeCheckoutParams) => {
    setIsLoading(true);
    try {
      // Per-attempt nonce so the server idempotency key isn't fixed per (member, package)
      // — otherwise a member can never repurchase/renew the same package, and an abandoned
      // pending checkout can never be retried. Double-submit is guarded by isLoading.
      const nonce =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
        body: { ...params, nonce },
      });

      if (error) throw error;

      if (data?.checkout_url) {
        // Open Stripe Checkout in new tab
        window.open(data.checkout_url, '_blank');
        toast.success(t('common.success'), {
          description: `Transaction ${data.transaction_no} created. Redirecting to payment...`,
        });
        return data;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to create checkout session';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createCheckout, isLoading };
};
