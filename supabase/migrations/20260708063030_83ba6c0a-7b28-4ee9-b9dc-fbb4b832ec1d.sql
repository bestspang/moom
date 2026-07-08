
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_member_id ON public.support_tickets(member_id);

INSERT INTO public.gamification_rules (action_key, label_en, label_th, xp_value, points_value, cooldown_minutes, max_per_day, is_active)
VALUES ('support_ticket_submit', 'Support Feedback', 'ส่งความคิดเห็น/ร้องเรียน', 10, 5, 20160, 1, true)
ON CONFLICT (action_key) DO UPDATE SET
  xp_value = EXCLUDED.xp_value,
  points_value = EXCLUDED.points_value,
  cooldown_minutes = EXCLUDED.cooldown_minutes,
  max_per_day = EXCLUDED.max_per_day,
  is_active = true;
