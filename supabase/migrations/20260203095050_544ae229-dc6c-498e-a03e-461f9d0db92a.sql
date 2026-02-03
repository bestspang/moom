-- =====================================================
-- SECURITY REMEDIATION PHASE 2: Tighten RBAC access levels
-- Replace auth.role() = 'authenticated' with proper RBAC checks
-- =====================================================

-- 1. MEMBERS table - Require minimum staff level
DROP POLICY IF EXISTS "Authenticated staff can read members" ON members;
CREATE POLICY "Staff with role can read members" ON members
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

-- 2. STAFF table - Require minimum staff level
DROP POLICY IF EXISTS "Authenticated users can read staff" ON staff;
CREATE POLICY "Staff with role can read staff" ON staff
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

-- 3. LEADS table - Require operator level for sales data
DROP POLICY IF EXISTS "Authenticated staff can read leads" ON leads;
CREATE POLICY "Operators can read leads" ON leads
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 4. MEMBER_BILLING - Restrict to managers only (financial)
DROP POLICY IF EXISTS "Operators can read billing" ON member_billing;
CREATE POLICY "Managers can read billing" ON member_billing
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_3_manager'));

-- 5. TRANSACTIONS - Restrict to managers only (financial)
DROP POLICY IF EXISTS "Operators can read transactions" ON transactions;
CREATE POLICY "Managers can read transactions" ON transactions
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_3_manager'));

-- 6. MEMBER_CONTRACTS - Require operator level
DROP POLICY IF EXISTS "Authenticated staff can read member contracts" ON member_contracts;
CREATE POLICY "Operators can read member contracts" ON member_contracts
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 7. MEMBER_INJURIES - Require operator level (health data)
DROP POLICY IF EXISTS "Authenticated staff can read member injuries" ON member_injuries;
CREATE POLICY "Operators can read member injuries" ON member_injuries
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 8. MEMBER_NOTES - Require minimum staff level
DROP POLICY IF EXISTS "Authenticated staff can read member notes" ON member_notes;
CREATE POLICY "Staff with role can read member notes" ON member_notes
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

-- 9. MEMBER_SUSPENSIONS - Require operator level
DROP POLICY IF EXISTS "Authenticated staff can read member suspensions" ON member_suspensions;
CREATE POLICY "Operators can read member suspensions" ON member_suspensions
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 10. MEMBER_ATTENDANCE - Require minimum staff level
DROP POLICY IF EXISTS "Authenticated staff can read attendance" ON member_attendance;
CREATE POLICY "Staff with role can read attendance" ON member_attendance
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

-- 11. MEMBER_PACKAGES - Require minimum staff level
DROP POLICY IF EXISTS "Authenticated staff can read member packages" ON member_packages;
CREATE POLICY "Staff with role can read member packages" ON member_packages
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

-- Update INSERT policies to use RBAC
DROP POLICY IF EXISTS "Authenticated staff can insert activity log" ON activity_log;
CREATE POLICY "Staff with role can insert activity log" ON activity_log
  FOR INSERT
  WITH CHECK (has_min_access_level(auth.uid(), 'level_1_minimum'));

DROP POLICY IF EXISTS "Authenticated staff can record attendance" ON member_attendance;
CREATE POLICY "Staff with role can record attendance" ON member_attendance
  FOR INSERT
  WITH CHECK (has_min_access_level(auth.uid(), 'level_1_minimum'));

-- Update member_notes ALL policy
DROP POLICY IF EXISTS "Authenticated staff can manage member notes" ON member_notes;
CREATE POLICY "Staff with role can manage member notes" ON member_notes
  FOR ALL
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'))
  WITH CHECK (has_min_access_level(auth.uid(), 'level_1_minimum'));