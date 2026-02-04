-- =============================================
-- Phase 2: Database Foundation for LINE Integration
-- =============================================

-- 1. Create Enums
CREATE TYPE booking_status AS ENUM ('booked', 'cancelled', 'attended', 'no_show');
CREATE TYPE waitlist_status AS ENUM ('waiting', 'promoted', 'expired', 'cancelled');
CREATE TYPE usage_type_ledger AS ENUM ('checkin', 'booking', 'pt_session', 'adjustment');
CREATE TYPE event_status AS ENUM ('pending', 'processing', 'done', 'failed');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE flag_scope AS ENUM ('global', 'location', 'user');

-- =============================================
-- 2. LINE Integration Tables
-- =============================================

-- 2.1 line_users - LINE identity mapping
CREATE TABLE line_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  line_user_id TEXT UNIQUE NOT NULL,
  line_display_name TEXT,
  line_picture_url TEXT,
  line_id_token TEXT,
  linked_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 line_message_log - LINE push message tracking
CREATE TABLE line_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL,
  template_key TEXT,
  payload JSONB DEFAULT '{}',
  status message_status DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_line_message_log_user ON line_message_log(line_user_id, created_at);
CREATE INDEX idx_line_message_log_status ON line_message_log(status, created_at);

-- =============================================
-- 3. Booking & Attendance Tables
-- =============================================

-- 3.1 class_bookings - Member class reservations
CREATE TABLE class_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_package_id UUID REFERENCES member_packages(id) ON DELETE SET NULL,
  status booking_status DEFAULT 'booked',
  booked_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, member_id)
);

CREATE INDEX idx_class_bookings_schedule ON class_bookings(schedule_id, status);
CREATE INDEX idx_class_bookings_member ON class_bookings(member_id, booked_at);

-- 3.2 class_waitlist - Waitlist queue management
CREATE TABLE class_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position INT NOT NULL,
  status waitlist_status DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT now(),
  promoted_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  UNIQUE(schedule_id, member_id)
);

CREATE INDEX idx_class_waitlist_schedule ON class_waitlist(schedule_id, status, position);

-- 3.3 package_usage_ledger - Usage tracking (anti-fraud, audit)
CREATE TABLE package_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_package_id UUID NOT NULL REFERENCES member_packages(id) ON DELETE CASCADE,
  usage_type usage_type_ledger NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  delta_sessions INT NOT NULL,
  balance_after INT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_package_usage_ledger_package ON package_usage_ledger(member_package_id, created_at);

-- 3.4 checkin_qr_tokens - QR code tokens for check-in
CREATE TABLE checkin_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  token_type TEXT DEFAULT 'checkin',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_staff_id UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_qr_tokens_member ON checkin_qr_tokens(member_id, expires_at);
CREATE INDEX idx_qr_tokens_token ON checkin_qr_tokens(token) WHERE used_at IS NULL;

-- =============================================
-- 4. Event & Feature System
-- =============================================

-- 4.1 event_outbox - Event-driven notifications
CREATE TABLE event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status event_status DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_event_outbox_status ON event_outbox(status, scheduled_for);
CREATE INDEX idx_event_outbox_type ON event_outbox(event_type, status);

-- 4.2 feature_flags - Feature toggle configuration
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scope flag_scope DEFAULT 'global',
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3 feature_flag_assignments - Per-location/user overrides
CREATE TABLE feature_flag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (location_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX idx_flag_assignments_lookup ON feature_flag_assignments(flag_id, location_id, user_id);

-- =============================================
-- 5. Enable RLS on all tables
-- =============================================

ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. RLS Policies
-- =============================================

-- 6.1 line_users policies
CREATE POLICY "Users can view own LINE link" ON line_users
  FOR SELECT USING (user_id = auth.uid() OR has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Users can insert own LINE link" ON line_users
  FOR INSERT WITH CHECK (user_id = auth.uid() OR has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Users can update own LINE link" ON line_users
  FOR UPDATE USING (user_id = auth.uid() OR has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Operators can delete LINE users" ON line_users
  FOR DELETE USING (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 6.2 line_message_log policies
CREATE POLICY "Operators can read message log" ON line_message_log
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "System can insert message log" ON line_message_log
  FOR INSERT WITH CHECK (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 6.3 class_bookings policies
CREATE POLICY "Staff can read all bookings" ON class_bookings
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

CREATE POLICY "Operators can insert bookings" ON class_bookings
  FOR INSERT WITH CHECK (has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Operators can update bookings" ON class_bookings
  FOR UPDATE USING (has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Operators can delete bookings" ON class_bookings
  FOR DELETE USING (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 6.4 class_waitlist policies
CREATE POLICY "Staff can read waitlist" ON class_waitlist
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

CREATE POLICY "Operators can manage waitlist" ON class_waitlist
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 6.5 package_usage_ledger policies (append-only for security)
CREATE POLICY "Staff can read usage ledger" ON package_usage_ledger
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

CREATE POLICY "Operators can insert usage" ON package_usage_ledger
  FOR INSERT WITH CHECK (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 6.6 checkin_qr_tokens policies
CREATE POLICY "Staff can read QR tokens" ON checkin_qr_tokens
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

CREATE POLICY "Operators can manage QR tokens" ON checkin_qr_tokens
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_2_operator'));

-- 6.7 event_outbox policies
CREATE POLICY "Operators can read events" ON event_outbox
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Managers can manage events" ON event_outbox
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'));

-- 6.8 feature_flags policies
CREATE POLICY "All can read feature flags" ON feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Managers can manage feature flags" ON feature_flags
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'));

-- 6.9 feature_flag_assignments policies
CREATE POLICY "All can read flag assignments" ON feature_flag_assignments
  FOR SELECT USING (true);

CREATE POLICY "Managers can manage flag assignments" ON feature_flag_assignments
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'));

-- =============================================
-- 7. Triggers for updated_at
-- =============================================

CREATE TRIGGER update_line_users_updated_at
  BEFORE UPDATE ON line_users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_class_bookings_updated_at
  BEFORE UPDATE ON class_bookings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- 8. Seed Data for Feature Flags
-- =============================================

INSERT INTO feature_flags (key, name, description, scope, enabled) VALUES
  ('line_login', 'LINE Login', 'Enable LINE LIFF login for members', 'global', false),
  ('class_booking', 'Class Booking', 'Allow members to book classes via app', 'global', false),
  ('qr_checkin', 'QR Check-in', 'Enable QR code check-in', 'global', false),
  ('waitlist', 'Waitlist', 'Enable class waitlist feature', 'global', false),
  ('member_app', 'Member App', 'Enable Member LIFF App', 'global', false),
  ('trainer_app', 'Trainer App', 'Enable Trainer LIFF App', 'global', false),
  ('line_notifications', 'LINE Notifications', 'Send notifications via LINE', 'global', false),
  ('contract_esign', 'Contract E-Sign', 'Enable digital contract signing', 'global', false),
  ('payment_slip_upload', 'Payment Slip Upload', 'Allow slip upload for payment', 'global', false);