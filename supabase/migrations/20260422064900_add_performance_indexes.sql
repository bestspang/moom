-- Performance indexes for common query patterns
-- S4-1: Add missing indexes identified in audit

-- member_packages.member_id — used in member dashboard, package lookup, gamification
CREATE INDEX IF NOT EXISTS idx_member_packages_member_id
  ON public.member_packages (member_id);

-- activity_logs.created_at — used in time-range queries and recent-activity feeds
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON public.activity_logs (created_at DESC);

-- class_schedules.start_time — used in upcoming-class queries and schedule views
CREATE INDEX IF NOT EXISTS idx_class_schedules_start_time
  ON public.class_schedules (start_time);
