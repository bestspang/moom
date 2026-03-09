
-- ============================================
-- Migration 1: Quest system tables
-- ============================================

-- quest_templates: pool of quests that rotate daily/weekly
CREATE TABLE public.quest_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_type text NOT NULL DEFAULT 'member',
  quest_period text NOT NULL DEFAULT 'daily',
  name_en text NOT NULL,
  name_th text,
  description_en text,
  description_th text,
  goal_type text NOT NULL DEFAULT 'action_count',
  goal_action_key text,
  goal_value integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 0,
  coin_reward integer NOT NULL DEFAULT 0,
  badge_reward_id uuid REFERENCES public.gamification_badges(id),
  coupon_reward_template_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- quest_instances: assigned quests per member per period
CREATE TABLE public.quest_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  quest_template_id uuid NOT NULL REFERENCES public.quest_templates(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  progress_value integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_quest_instances_member ON public.quest_instances(member_id, status);
CREATE INDEX idx_quest_instances_template ON public.quest_instances(quest_template_id);

-- ============================================
-- Migration 2: Coupon system
-- ============================================

CREATE TABLE public.coupon_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_th text,
  discount_type text NOT NULL DEFAULT 'fixed',
  discount_value numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  min_spend numeric DEFAULT 0,
  valid_days integer NOT NULL DEFAULT 14,
  applies_to text NOT NULL DEFAULT 'all',
  stackable boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.coupon_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  coupon_template_id uuid NOT NULL REFERENCES public.coupon_templates(id),
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  source_type text,
  source_id uuid
);
CREATE INDEX idx_coupon_wallet_member ON public.coupon_wallet(member_id, status);

-- Add FK from quest_templates to coupon_templates
ALTER TABLE public.quest_templates
  ADD CONSTRAINT quest_templates_coupon_reward_fk
  FOREIGN KEY (coupon_reward_template_id) REFERENCES public.coupon_templates(id);

-- ============================================
-- Migration 3: Badge enhancements + reward enhancements + shop rules
-- ============================================

-- Enhance badges with effect system
ALTER TABLE public.gamification_badges
  ADD COLUMN IF NOT EXISTS badge_type text DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS effect_type text,
  ADD COLUMN IF NOT EXISTS effect_value jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duration_days integer;

-- Enhance rewards with hybrid pricing
ALTER TABLE public.gamification_rewards
  ADD COLUMN IF NOT EXISTS cash_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS required_badge_id uuid REFERENCES public.gamification_badges(id),
  ADD COLUMN IF NOT EXISTS daily_limit integer,
  ADD COLUMN IF NOT EXISTS monthly_limit integer,
  ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'digital';

-- Shop reward rules
CREATE TABLE public.shop_reward_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type text NOT NULL DEFAULT 'merch',
  min_spend numeric DEFAULT 0,
  xp_per_order integer DEFAULT 0,
  xp_per_spend_unit numeric DEFAULT 0,
  spend_unit numeric DEFAULT 100,
  xp_cap integer,
  coin_per_spend_unit numeric DEFAULT 0,
  coin_spend_unit numeric DEFAULT 100,
  coin_cap integer,
  required_level integer DEFAULT 0,
  required_badge_id uuid REFERENCES public.gamification_badges(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- Migration 4: RLS policies for all new tables
-- ============================================

-- Quest templates
ALTER TABLE public.quest_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read quest_templates" ON public.quest_templates FOR SELECT USING (public.has_min_access_level(auth.uid(), 'level_1_minimum'));
CREATE POLICY "Managers can manage quest_templates" ON public.quest_templates FOR ALL USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Quest instances
ALTER TABLE public.quest_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own quests" ON public.quest_instances FOR SELECT USING (member_id = public.get_my_member_id(auth.uid()));
CREATE POLICY "Staff read all quest_instances" ON public.quest_instances FOR SELECT USING (public.has_min_access_level(auth.uid(), 'level_1_minimum'));

-- Coupon templates
ALTER TABLE public.coupon_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read coupon_templates" ON public.coupon_templates FOR SELECT USING (public.has_min_access_level(auth.uid(), 'level_1_minimum'));
CREATE POLICY "Managers can manage coupon_templates" ON public.coupon_templates FOR ALL USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Coupon wallet
ALTER TABLE public.coupon_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own coupons" ON public.coupon_wallet FOR SELECT USING (member_id = public.get_my_member_id(auth.uid()));
CREATE POLICY "Staff manage coupon_wallet" ON public.coupon_wallet FOR ALL USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

-- Shop reward rules
ALTER TABLE public.shop_reward_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read shop_reward_rules" ON public.shop_reward_rules FOR SELECT USING (public.has_min_access_level(auth.uid(), 'level_1_minimum'));
CREATE POLICY "Managers can manage shop_reward_rules" ON public.shop_reward_rules FOR ALL USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));
