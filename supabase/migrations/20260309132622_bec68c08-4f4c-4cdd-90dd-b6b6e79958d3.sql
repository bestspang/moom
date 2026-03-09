
-- 1. Add 'referral_completed' to notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'referral_completed';

-- 2. Add freeze_until column to streak_snapshots for streak freeze feature
ALTER TABLE public.streak_snapshots ADD COLUMN IF NOT EXISTS freeze_until date DEFAULT NULL;
