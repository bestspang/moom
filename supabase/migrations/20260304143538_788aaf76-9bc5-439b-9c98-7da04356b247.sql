
-- Phase 1: Add missing columns to promotions table
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_th text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_th text,
  ADD COLUMN IF NOT EXISTS discount_mode text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS percentage_discount numeric,
  ADD COLUMN IF NOT EXISTS flat_rate_discount numeric,
  ADD COLUMN IF NOT EXISTS same_discount_all_packages boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_max_redemption boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_redemption_value numeric,
  ADD COLUMN IF NOT EXISTS has_min_price boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_price_requirement numeric,
  ADD COLUMN IF NOT EXISTS units_mode text DEFAULT 'infinite',
  ADD COLUMN IF NOT EXISTS available_units integer,
  ADD COLUMN IF NOT EXISTS per_user_mode text DEFAULT 'unlimited',
  ADD COLUMN IF NOT EXISTS per_user_limit integer,
  ADD COLUMN IF NOT EXISTS usage_time_mode text DEFAULT 'any_day_any_time',
  ADD COLUMN IF NOT EXISTS usage_time_rules jsonb,
  ADD COLUMN IF NOT EXISTS start_mode text DEFAULT 'start_now',
  ADD COLUMN IF NOT EXISTS has_end_date boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Migrate existing data
UPDATE promotions SET name_en = name WHERE name_en IS NULL;
UPDATE promotions SET discount_mode = COALESCE(discount_type, 'percentage') WHERE discount_mode IS NULL OR discount_mode = 'percentage';
UPDATE promotions SET percentage_discount = discount_value WHERE discount_type = 'percentage' AND percentage_discount IS NULL;
UPDATE promotions SET flat_rate_discount = discount_value WHERE discount_type = 'flat_rate' AND flat_rate_discount IS NULL;
UPDATE promotions SET has_end_date = (end_date IS NOT NULL);
UPDATE promotions SET units_mode = CASE WHEN usage_limit IS NOT NULL THEN 'specific' ELSE 'infinite' END WHERE units_mode = 'infinite';
UPDATE promotions SET available_units = usage_limit WHERE usage_limit IS NOT NULL AND available_units IS NULL;

-- Create promotion_packages join table
CREATE TABLE IF NOT EXISTS promotion_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  discount_override numeric,
  max_sale_amount numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(promotion_id, package_id)
);

-- Enable RLS
ALTER TABLE promotion_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotion_packages
CREATE POLICY "All can read promotion packages" ON promotion_packages FOR SELECT USING (true);
CREATE POLICY "Managers can manage promotion packages" ON promotion_packages FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotion_packages_promotion_id ON promotion_packages(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_packages_package_id ON promotion_packages(package_id);

-- Migrate existing applicable_packages arrays into promotion_packages
INSERT INTO promotion_packages (promotion_id, package_id)
SELECT p.id, unnest(p.applicable_packages)
FROM promotions p
WHERE p.applicable_packages IS NOT NULL AND array_length(p.applicable_packages, 1) > 0
ON CONFLICT (promotion_id, package_id) DO NOTHING;

-- Create promotion_redemptions table
CREATE TABLE IF NOT EXISTS promotion_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES promotions(id),
  member_id uuid REFERENCES members(id),
  transaction_id uuid REFERENCES transactions(id),
  redeemed_at timestamptz DEFAULT now(),
  discount_amount numeric NOT NULL,
  gross_amount numeric NOT NULL,
  net_amount numeric NOT NULL,
  promo_code_used text
);

-- Enable RLS
ALTER TABLE promotion_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotion_redemptions
CREATE POLICY "Staff can read redemptions" ON promotion_redemptions FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));
CREATE POLICY "Managers can manage redemptions" ON promotion_redemptions FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_promotion_id ON promotion_redemptions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_member_id ON promotion_redemptions(promotion_id, member_id);
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_redeemed_at ON promotion_redemptions(promotion_id, redeemed_at);

-- Indexes on promotions
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE promotion_packages;
ALTER PUBLICATION supabase_realtime ADD TABLE promotion_redemptions;

-- updated_at trigger for promotions
CREATE TRIGGER handle_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
