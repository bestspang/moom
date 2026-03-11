
-- ================================================
-- Status Tier System — 5 new tables
-- ================================================

CREATE TABLE public.status_tier_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code text NOT NULL UNIQUE,
  tier_order integer NOT NULL,
  display_name_en text NOT NULL,
  display_name_th text,
  color_hsl text NOT NULL DEFAULT '0 0% 50%',
  icon_emoji text NOT NULL DEFAULT '🏅',
  min_level integer NOT NULL DEFAULT 0,
  min_sp_90d integer NOT NULL DEFAULT 0,
  min_active_days_period integer NOT NULL DEFAULT 0,
  active_days_window integer NOT NULL DEFAULT 90,
  requires_active_package boolean NOT NULL DEFAULT false,
  extra_criteria jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.status_tier_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code text NOT NULL REFERENCES public.status_tier_rules(tier_code) ON DELETE CASCADE,
  benefit_code text NOT NULL,
  description_en text NOT NULL,
  description_th text,
  frequency text NOT NULL DEFAULT 'monthly',
  max_per_month integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  delta integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sp_ledger_member_created ON public.sp_ledger(member_id, created_at DESC);

CREATE TABLE public.member_status_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE UNIQUE,
  current_tier text NOT NULL DEFAULT 'bronze' REFERENCES public.status_tier_rules(tier_code),
  sp_90d integer NOT NULL DEFAULT 0,
  active_days_30d integer NOT NULL DEFAULT 0,
  active_days_60d integer NOT NULL DEFAULT 0,
  active_days_90d integer NOT NULL DEFAULT 0,
  last_evaluated_at timestamptz,
  grace_until timestamptz,
  tier_changed_at timestamptz DEFAULT now(),
  previous_tier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.status_tier_sp_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text NOT NULL UNIQUE,
  sp_value integer NOT NULL DEFAULT 0,
  daily_cap integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.status_tier_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_tier_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_status_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_tier_sp_rules ENABLE ROW LEVEL SECURITY;

-- Tier rules: public read
CREATE POLICY "Anyone can read tier rules" ON public.status_tier_rules FOR SELECT USING (true);
CREATE POLICY "Admin manage tier rules" ON public.status_tier_rules FOR INSERT TO authenticated WITH CHECK (public.has_min_access_level(auth.uid(), 'level_3_manager'));
CREATE POLICY "Admin update tier rules" ON public.status_tier_rules FOR UPDATE TO authenticated USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));
CREATE POLICY "Admin delete tier rules" ON public.status_tier_rules FOR DELETE TO authenticated USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Tier benefits: public read
CREATE POLICY "Anyone can read tier benefits" ON public.status_tier_benefits FOR SELECT USING (true);
CREATE POLICY "Admin insert tier benefits" ON public.status_tier_benefits FOR INSERT TO authenticated WITH CHECK (public.has_min_access_level(auth.uid(), 'level_3_manager'));
CREATE POLICY "Admin update tier benefits" ON public.status_tier_benefits FOR UPDATE TO authenticated USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));
CREATE POLICY "Admin delete tier benefits" ON public.status_tier_benefits FOR DELETE TO authenticated USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- SP ledger: members own, staff all
CREATE POLICY "Members read own SP" ON public.sp_ledger FOR SELECT TO authenticated
  USING (member_id IN (SELECT public.get_my_member_id(auth.uid())));
CREATE POLICY "Staff read all SP" ON public.sp_ledger FOR SELECT TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));
CREATE POLICY "Service insert SP" ON public.sp_ledger FOR INSERT TO authenticated
  WITH CHECK (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Member status tiers: members own, staff all
CREATE POLICY "Members read own tier" ON public.member_status_tiers FOR SELECT TO authenticated
  USING (member_id IN (SELECT public.get_my_member_id(auth.uid())));
CREATE POLICY "Staff read all tiers" ON public.member_status_tiers FOR SELECT TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

-- SP rules: public read, admin write
CREATE POLICY "Anyone can read SP rules" ON public.status_tier_sp_rules FOR SELECT USING (true);
CREATE POLICY "Admin insert SP rules" ON public.status_tier_sp_rules FOR INSERT TO authenticated WITH CHECK (public.has_min_access_level(auth.uid(), 'level_3_manager'));
CREATE POLICY "Admin update SP rules" ON public.status_tier_sp_rules FOR UPDATE TO authenticated USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));
CREATE POLICY "Admin delete SP rules" ON public.status_tier_sp_rules FOR DELETE TO authenticated USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Triggers
CREATE TRIGGER handle_updated_at_status_tier_rules BEFORE UPDATE ON public.status_tier_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_member_status_tiers BEFORE UPDATE ON public.member_status_tiers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_status_tier_sp_rules BEFORE UPDATE ON public.status_tier_sp_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
