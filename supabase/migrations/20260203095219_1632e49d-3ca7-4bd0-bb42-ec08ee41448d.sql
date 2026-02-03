-- Fix remaining permissive INSERT policy on notifications
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR has_min_access_level(auth.uid(), 'level_2_operator'));