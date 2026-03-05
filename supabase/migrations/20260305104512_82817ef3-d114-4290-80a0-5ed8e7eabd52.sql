ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'cash';
ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'refunded';