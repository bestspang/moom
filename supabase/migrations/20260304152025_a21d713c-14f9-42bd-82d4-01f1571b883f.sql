
-- Performance indexes on commonly filtered columns
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);
CREATE INDEX IF NOT EXISTS idx_members_register_location_id ON public.members (register_location_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_register_location_id ON public.leads (register_location_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_schedule_scheduled_date ON public.schedule (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff (status);
CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes (status);
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages (status);

-- Add description column to training_templates
ALTER TABLE public.training_templates ADD COLUMN IF NOT EXISTS description text;
