
-- ===========================================
-- MOOM CLUB v0.0.1 - Complete Database Schema
-- ===========================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'trainer', 'front_desk');
CREATE TYPE public.access_level AS ENUM ('level_1_minimum', 'level_2_operator', 'level_3_manager', 'level_4_master');
CREATE TYPE public.member_status AS ENUM ('active', 'suspended', 'on_hold', 'inactive');
CREATE TYPE public.risk_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.package_type AS ENUM ('unlimited', 'session', 'pt');
CREATE TYPE public.package_status AS ENUM ('on_sale', 'scheduled', 'drafts', 'archive');
CREATE TYPE public.usage_type AS ENUM ('class_only', 'gym_checkin_only', 'both');
CREATE TYPE public.class_type AS ENUM ('class', 'pt');
CREATE TYPE public.class_level AS ENUM ('all_levels', 'beginner', 'intermediate', 'advanced');
CREATE TYPE public.schedule_status AS ENUM ('scheduled', 'cancelled', 'completed');
CREATE TYPE public.transaction_status AS ENUM ('paid', 'pending', 'voided', 'needs_review');
CREATE TYPE public.payment_method AS ENUM ('credit_card', 'bank_transfer', 'qr_promptpay');
CREATE TYPE public.staff_status AS ENUM ('active', 'pending', 'terminated');
CREATE TYPE public.location_status AS ENUM ('open', 'closed');
CREATE TYPE public.room_status AS ENUM ('open', 'closed');
CREATE TYPE public.promotion_type AS ENUM ('discount', 'promo_code');
CREATE TYPE public.promotion_status AS ENUM ('active', 'scheduled', 'drafts', 'archive');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'interested', 'not_interested', 'converted');
CREATE TYPE public.announcement_status AS ENUM ('active', 'scheduled', 'completed');
CREATE TYPE public.notification_type AS ENUM ('booking_confirmed', 'class_cancellation', 'payment_received', 'member_registration', 'package_expiring');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');

-- 2. LOCATIONS (must be first - referenced by many tables)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_number TEXT,
  categories TEXT[] DEFAULT '{}',
  status public.location_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ROLES DEFINITION TABLE
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  access_level public.access_level NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. USER ROLES (RBAC - separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  role_id UUID REFERENCES public.roles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 5. STAFF
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  role_id UUID REFERENCES public.roles(id),
  status public.staff_status DEFAULT 'pending',
  location_id UUID REFERENCES public.locations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. MEMBERS
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender public.gender,
  tax_id TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status public.member_status DEFAULT 'active',
  risk_level public.risk_level DEFAULT 'low',
  register_location_id UUID REFERENCES public.locations(id),
  member_since TIMESTAMPTZ DEFAULT now(),
  total_spent DECIMAL(12,2) DEFAULT 0,
  most_attended_category TEXT,
  is_new BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CLASS CATEGORIES
CREATE TABLE public.class_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  class_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ROOMS
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  max_capacity INTEGER DEFAULT 20,
  categories TEXT[] DEFAULT '{}',
  status public.room_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CLASSES
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.class_type DEFAULT 'class',
  category_id UUID REFERENCES public.class_categories(id),
  level public.class_level DEFAULT 'all_levels',
  duration INTEGER DEFAULT 60,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. PACKAGES
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_th TEXT,
  type public.package_type NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  term_days INTEGER NOT NULL,
  expiration_days INTEGER NOT NULL,
  sessions INTEGER,
  categories TEXT[] DEFAULT '{}',
  all_categories BOOLEAN DEFAULT true,
  usage_type public.usage_type DEFAULT 'both',
  access_days JSONB DEFAULT '[]',
  any_day_any_time BOOLEAN DEFAULT true,
  quantity INTEGER,
  infinite_quantity BOOLEAN DEFAULT true,
  user_purchase_limit INTEGER,
  infinite_purchase_limit BOOLEAN DEFAULT true,
  status public.package_status DEFAULT 'drafts',
  is_popular BOOLEAN DEFAULT false,
  recurring_payment BOOLEAN DEFAULT false,
  description_en TEXT,
  description_th TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. MEMBER PACKAGES (Junction)
CREATE TABLE public.member_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
  purchase_date TIMESTAMPTZ DEFAULT now(),
  activation_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  sessions_remaining INTEGER,
  sessions_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ready_to_use',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. SCHEDULE
CREATE TABLE public.schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES public.staff(id),
  room_id UUID REFERENCES public.rooms(id),
  location_id UUID REFERENCES public.locations(id),
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER DEFAULT 20,
  checked_in INTEGER DEFAULT 0,
  status public.schedule_status DEFAULT 'scheduled',
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. MEMBER ATTENDANCE
CREATE TABLE public.member_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES public.schedule(id) ON DELETE SET NULL,
  member_package_id UUID REFERENCES public.member_packages(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id),
  check_in_time TIMESTAMPTZ DEFAULT now(),
  check_in_type TEXT DEFAULT 'class',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  order_name TEXT NOT NULL,
  type public.package_type,
  amount DECIMAL(12,2) NOT NULL,
  payment_method public.payment_method,
  status public.transaction_status DEFAULT 'pending',
  location_id UUID REFERENCES public.locations(id),
  staff_id UUID REFERENCES public.staff(id),
  tax_invoice_url TEXT,
  transfer_slip_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. MEMBER BILLING
CREATE TABLE public.member_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  billing_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. PROMOTIONS
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.promotion_type DEFAULT 'promo_code',
  promo_code TEXT UNIQUE,
  discount_type TEXT DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status public.promotion_status DEFAULT 'drafts',
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  applicable_packages UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 17. LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  status public.lead_status DEFAULT 'new',
  times_contacted INTEGER DEFAULT 0,
  last_contacted TIMESTAMPTZ,
  last_attended TIMESTAMPTZ,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. ACTIVITY LOG
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  activity TEXT NOT NULL,
  staff_id UUID REFERENCES public.staff(id),
  member_id UUID REFERENCES public.members(id),
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  status public.announcement_status DEFAULT 'scheduled',
  publish_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.staff(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 20. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 21. WORKOUTS (CrossFit tracking)
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  training_category TEXT DEFAULT 'CrossFit',
  track_metric TEXT DEFAULT 'time',
  unit TEXT DEFAULT 'mins',
  description TEXT,
  is_minimize BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 22. MEMBER INJURIES
CREATE TABLE public.member_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  injury_description TEXT NOT NULL,
  injury_date DATE,
  recovery_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 23. MEMBER SUSPENSIONS
CREATE TABLE public.member_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 24. MEMBER CONTRACTS
CREATE TABLE public.member_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  contract_type TEXT,
  signed_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  document_url TEXT,
  is_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 25. MEMBER NOTES
CREATE TABLE public.member_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_by UUID REFERENCES public.staff(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 26. SETTINGS
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section, key)
);

-- ===========================================
-- SECURITY DEFINER FUNCTIONS
-- ===========================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's access level
CREATE OR REPLACE FUNCTION public.get_user_access_level(_user_id UUID)
RETURNS public.access_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.access_level
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  ORDER BY 
    CASE r.access_level 
      WHEN 'level_4_master' THEN 4
      WHEN 'level_3_manager' THEN 3
      WHEN 'level_2_operator' THEN 2
      WHEN 'level_1_minimum' THEN 1
    END DESC
  LIMIT 1
$$;

-- Function to check minimum access level
CREATE OR REPLACE FUNCTION public.has_min_access_level(_user_id UUID, _min_level public.access_level)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND CASE r.access_level 
            WHEN 'level_4_master' THEN 4
            WHEN 'level_3_manager' THEN 3
            WHEN 'level_2_operator' THEN 2
            WHEN 'level_1_minimum' THEN 1
          END >= CASE _min_level 
                   WHEN 'level_4_master' THEN 4
                   WHEN 'level_3_manager' THEN 3
                   WHEN 'level_2_operator' THEN 2
                   WHEN 'level_1_minimum' THEN 1
                 END
  )
$$;

-- ===========================================
-- ENABLE RLS ON ALL TABLES
-- ===========================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Locations: All authenticated users can read
CREATE POLICY "Authenticated users can read locations" ON public.locations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage locations" ON public.locations
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Roles: All authenticated can read
CREATE POLICY "Authenticated users can read roles" ON public.roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Masters can manage roles" ON public.roles
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_4_master'));

-- User Roles: Only masters can manage
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Masters can manage user roles" ON public.user_roles
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_4_master'));

-- Staff: Operators and above can read, managers can manage
CREATE POLICY "Staff can read staff" ON public.staff
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage staff" ON public.staff
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Members: All authenticated staff can read, operators can manage
CREATE POLICY "Staff can read members" ON public.members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can manage members" ON public.members
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

-- Class Categories: All can read, managers manage
CREATE POLICY "All can read class categories" ON public.class_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage class categories" ON public.class_categories
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Rooms: All can read
CREATE POLICY "All can read rooms" ON public.rooms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage rooms" ON public.rooms
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Classes: All can read
CREATE POLICY "All can read classes" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can manage classes" ON public.classes
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

-- Packages: All can read
CREATE POLICY "All can read packages" ON public.packages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage packages" ON public.packages
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Member Packages: Operators can manage
CREATE POLICY "All can read member packages" ON public.member_packages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can manage member packages" ON public.member_packages
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

-- Schedule: All can read, operators manage
CREATE POLICY "All can read schedule" ON public.schedule
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can manage schedule" ON public.schedule
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

-- Attendance: All can read, minimum can insert
CREATE POLICY "All can read attendance" ON public.member_attendance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can record attendance" ON public.member_attendance
  FOR INSERT TO authenticated WITH CHECK (true);

-- Transactions: Operators can read, managers can manage
CREATE POLICY "Operators can read transactions" ON public.transactions
  FOR SELECT TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Managers can manage transactions" ON public.transactions
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Billing: Operators can manage
CREATE POLICY "Operators can read billing" ON public.member_billing
  FOR SELECT TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Managers can manage billing" ON public.member_billing
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Promotions: All can read active
CREATE POLICY "All can read active promotions" ON public.promotions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage promotions" ON public.promotions
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Leads: Operators can manage
CREATE POLICY "Operators can read leads" ON public.leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can manage leads" ON public.leads
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

-- Activity Log: Operators can read
CREATE POLICY "Operators can read activity log" ON public.activity_log
  FOR SELECT TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "System can insert activity log" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Announcements: All can read, managers manage
CREATE POLICY "All can read announcements" ON public.announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage announcements" ON public.announcements
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- Notifications: Users can read own
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Workouts: All can read
CREATE POLICY "All can read workouts" ON public.workouts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can manage workouts" ON public.workouts
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

-- Member Injuries, Suspensions, Contracts, Notes: Operators manage
CREATE POLICY "All can read member injuries" ON public.member_injuries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can manage member injuries" ON public.member_injuries
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "All can read member suspensions" ON public.member_suspensions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can manage member suspensions" ON public.member_suspensions
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "All can read member contracts" ON public.member_contracts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can manage member contracts" ON public.member_contracts
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "All can read member notes" ON public.member_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "All staff can manage member notes" ON public.member_notes
  FOR ALL TO authenticated WITH CHECK (true);

-- Settings: Managers can manage
CREATE POLICY "All can read settings" ON public.settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage settings" ON public.settings
  FOR ALL TO authenticated 
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- ===========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.class_categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.member_packages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.schedule FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.member_injuries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.member_notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================
-- SEED DATA
-- ===========================================

-- Insert default roles
INSERT INTO public.roles (name, access_level, description, permissions) VALUES
  ('Owner', 'level_4_master', 'Full access to all features', '["all"]'),
  ('Admin', 'level_3_manager', 'Management access', '["manage_staff", "manage_members", "manage_packages", "manage_classes", "view_finance", "manage_settings"]'),
  ('Finance officer', 'level_2_operator', 'Finance operations', '["view_members", "manage_transactions", "view_finance"]'),
  ('Senior Trainer', 'level_2_operator', 'Senior training duties', '["view_members", "manage_classes", "manage_schedule", "view_attendance"]'),
  ('Trainer', 'level_1_minimum', 'Basic training access', '["view_members", "view_classes", "view_schedule", "record_attendance"]'),
  ('Housekeeper', 'level_1_minimum', 'Basic cleaning duties', '["view_schedule"]');

-- Insert default location
INSERT INTO public.locations (location_id, name, contact_number, categories, status) VALUES
  ('BR-0001', 'MOOM CLUB Main', '099-616-3666', ARRAY['Standard', 'Premium'], 'open');

-- Insert class categories
INSERT INTO public.class_categories (name, description) VALUES
  ('Standard', 'Standard membership classes'),
  ('12 days pass', '12 days pass classes'),
  ('12/6/3/1 month member', 'Monthly membership classes'),
  ('Boxing/Combat', 'Boxing and combat training'),
  ('Personal Training A', 'Premium personal training'),
  ('Pilates Studio', 'Pilates classes'),
  ('Group Class', 'Group fitness classes'),
  ('X member', 'X membership tier'),
  ('Tip', 'Tip classes');

-- Insert sample workouts (CrossFit)
INSERT INTO public.workouts (name, training_category, track_metric, unit, description, is_minimize) VALUES
  ('Fran', 'CrossFit', 'time', 'mins', 'Thrusters, Pull-up', true),
  ('Grace', 'CrossFit', 'time', 'mins', '30 Clean & Jerks (135/95 lbs)', true),
  ('Isabel', 'CrossFit', 'time', 'mins', '30 Snatches (135/95 lbs)', true),
  ('Helen', 'CrossFit', 'time', 'mins', '3 Rounds: 400m run, 21 KB swings, 12 Pull-ups', true),
  ('Annie', 'CrossFit', 'time', 'mins', '50-40-30-20-10 Double-ups, Sit-ups', true),
  ('Cindy', 'CrossFit', 'rounds_reps', 'rounds', 'AMRAP 20 min: 5 Pull-ups, 10 Push-ups, 15 Air Squats', false);

-- Insert default settings
INSERT INTO public.settings (section, key, value) VALUES
  ('general', 'payment_methods', '{"bank_transfer": true, "credit_card": false, "qr_promptpay": false}'),
  ('general', 'appearance', '{"theme": "purple"}'),
  ('general', 'timezone', '"Asia/Bangkok"'),
  ('general', 'workout_enabled', 'true'),
  ('general', 'gym_checkin_enabled', 'true'),
  ('class', 'booking_advance_days', '3'),
  ('class', 'booking_before_mins', '5'),
  ('class', 'max_spots_per_booking', '1'),
  ('client', 'allow_injured_bookings', 'false'),
  ('client', 'allow_injured_mobile', 'false'),
  ('client', 'allow_injured_console', 'false'),
  ('package', 'expiration_trigger', '"booking"'),
  ('contracts', 'member_app_signing', 'false');
