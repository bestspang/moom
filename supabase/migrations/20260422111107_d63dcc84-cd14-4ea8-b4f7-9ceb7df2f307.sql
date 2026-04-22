
-- P1-1: Prevent duplicate member_billing rows for the same transaction
-- (Stripe webhook retries / race conditions). Partial index — null transaction_ids allowed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_billing_unique_transaction
  ON public.member_billing (transaction_id)
  WHERE transaction_id IS NOT NULL;
