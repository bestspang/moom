-- =====================================================
-- SECURITY REMEDIATION: Fix overly permissive RLS policies
-- =====================================================

-- Phase 1.1: Fix SELECT policies on sensitive tables
-- Replace "USING (true)" with proper authentication checks

-- 1. MEMBERS table - Customer PII
DROP POLICY IF EXISTS "Staff can read members" ON members;
CREATE POLICY "Authenticated staff can read members" ON members
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2. STAFF table - Employee data
DROP POLICY IF EXISTS "Staff can read staff" ON staff;
CREATE POLICY "Authenticated users can read staff" ON staff
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. LEADS table - Sales pipeline
DROP POLICY IF EXISTS "Operators can read leads" ON leads;
CREATE POLICY "Authenticated staff can read leads" ON leads
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4. MEMBER_CONTRACTS table - Legal documents
DROP POLICY IF EXISTS "All can read member contracts" ON member_contracts;
CREATE POLICY "Authenticated staff can read member contracts" ON member_contracts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5. MEMBER_INJURIES table - Health info (PHI)
DROP POLICY IF EXISTS "All can read member injuries" ON member_injuries;
CREATE POLICY "Authenticated staff can read member injuries" ON member_injuries
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 6. MEMBER_NOTES table - Private notes
DROP POLICY IF EXISTS "All can read member notes" ON member_notes;
CREATE POLICY "Authenticated staff can read member notes" ON member_notes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 7. MEMBER_SUSPENSIONS table - Disciplinary records
DROP POLICY IF EXISTS "All can read member suspensions" ON member_suspensions;
CREATE POLICY "Authenticated staff can read member suspensions" ON member_suspensions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 8. MEMBER_ATTENDANCE table
DROP POLICY IF EXISTS "All can read attendance" ON member_attendance;
CREATE POLICY "Authenticated staff can read attendance" ON member_attendance
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 9. MEMBER_PACKAGES table
DROP POLICY IF EXISTS "All can read member packages" ON member_packages;
CREATE POLICY "Authenticated staff can read member packages" ON member_packages
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Phase 1.2: Fix INSERT policies
-- Replace "WITH CHECK (true)" with proper access checks

-- 1. ACTIVITY_LOG - Restrict to authenticated users with min access
DROP POLICY IF EXISTS "System can insert activity log" ON activity_log;
CREATE POLICY "Authenticated staff can insert activity log" ON activity_log
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 2. MEMBER_ATTENDANCE - Require authentication
DROP POLICY IF EXISTS "Staff can record attendance" ON member_attendance;
CREATE POLICY "Authenticated staff can record attendance" ON member_attendance
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 3. MEMBER_NOTES - Require authentication
DROP POLICY IF EXISTS "All staff can manage member notes" ON member_notes;
CREATE POLICY "Authenticated staff can manage member notes" ON member_notes
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. NOTIFICATIONS - Restrict insert to authenticated or service role
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Phase 2: Server-side user provisioning trigger
-- Create trigger to auto-create staff and user_roles records on signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create staff record for new user
  INSERT INTO public.staff (user_id, email, first_name, last_name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'pending'
  );
  
  -- Assign default role (front_desk - minimum access)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'front_desk');
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Phase 3.3: Fix function search paths for existing functions
-- Update has_min_access_level to include explicit search_path

CREATE OR REPLACE FUNCTION public.has_min_access_level(_user_id uuid, _min_level access_level)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_level access_level;
  level_order jsonb := '{"level_1_minimum": 1, "level_2_operator": 2, "level_3_manager": 3, "level_4_master": 4}'::jsonb;
BEGIN
  SELECT 
    CASE ur.role
      WHEN 'front_desk' THEN 'level_1_minimum'::access_level
      WHEN 'trainer' THEN 'level_2_operator'::access_level
      WHEN 'admin' THEN 'level_3_manager'::access_level
      WHEN 'owner' THEN 'level_4_master'::access_level
    END INTO user_level
  FROM user_roles ur
  WHERE ur.user_id = _user_id
  LIMIT 1;
  
  IF user_level IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN (level_order->>user_level::text)::int >= (level_order->>_min_level::text)::int;
END;
$$;

-- Update has_role function with explicit search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- Update get_user_access_level function with explicit search_path
CREATE OR REPLACE FUNCTION public.get_user_access_level(_user_id uuid)
RETURNS access_level
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_level access_level;
BEGIN
  SELECT 
    CASE ur.role
      WHEN 'front_desk' THEN 'level_1_minimum'::access_level
      WHEN 'trainer' THEN 'level_2_operator'::access_level
      WHEN 'admin' THEN 'level_3_manager'::access_level
      WHEN 'owner' THEN 'level_4_master'::access_level
    END INTO user_level
  FROM user_roles ur
  WHERE ur.user_id = _user_id
  LIMIT 1;
  
  RETURN COALESCE(user_level, 'level_1_minimum'::access_level);
END;
$$;