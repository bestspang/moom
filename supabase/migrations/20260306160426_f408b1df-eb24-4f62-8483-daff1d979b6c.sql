-- Phase 1: Extend transactions table for Stripe readiness + VAT
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source_ref text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency text DEFAULT 'THB';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_gross numeric;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_ex_vat numeric;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_vat numeric;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 0.07;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS package_name_snapshot text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sold_to_name text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sold_to_contact text;

-- Unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency_key ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Index for source_ref lookups (Stripe payment_intent, slip_id, etc.)
CREATE INDEX IF NOT EXISTS idx_transactions_source_ref ON transactions(source_ref) WHERE source_ref IS NOT NULL;

-- Extend payment_method enum
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'card_stripe';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'qr_promptpay_stripe';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'other';

-- Extend transaction_status enum
ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'failed';

-- Phase 2: Extend member_packages for purchase traceability
ALTER TABLE member_packages ADD COLUMN IF NOT EXISTS purchase_transaction_id uuid REFERENCES transactions(id);
ALTER TABLE member_packages ADD COLUMN IF NOT EXISTS package_name_snapshot text;
ALTER TABLE member_packages ADD COLUMN IF NOT EXISTS sessions_total integer;