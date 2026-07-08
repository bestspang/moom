INSERT INTO public.feature_flags (key, name, description, scope, enabled)
VALUES (
  'maintenance_mode',
  'Maintenance Mode',
  'When enabled, non-admin visitors see a Coming Soon / Maintenance page instead of the login and app. Admins can still sign in via /admin.',
  'global',
  false
)
ON CONFLICT (key) DO NOTHING;