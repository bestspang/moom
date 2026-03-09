-- Expand notification_type enum with gamification-related types
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'badge_earned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'level_up';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'challenge_completed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'reward_fulfilled';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'streak_milestone';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'xp_earned';

-- Enable realtime for gamification tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_gamification_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.badge_earnings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_redemptions;