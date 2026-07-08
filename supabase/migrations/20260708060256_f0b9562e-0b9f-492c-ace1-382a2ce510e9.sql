
-- 1) Alter support_tickets: priority, assigned_to, resolved_at, closed_at
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.support_tickets
    ADD CONSTRAINT support_tickets_priority_check
    CHECK (priority IN ('low','normal','high','urgent'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

-- Auto-stamp resolved_at / closed_at when status flips
CREATE OR REPLACE FUNCTION public.support_tickets_stamp_status_ts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS DISTINCT FROM 'resolved') THEN
    NEW.resolved_at := now();
  END IF;
  IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed') THEN
    NEW.closed_at := now();
  END IF;
  IF NEW.status NOT IN ('resolved','closed') THEN
    NEW.resolved_at := NULL;
    NEW.closed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_tickets_stamp_status_ts ON public.support_tickets;
CREATE TRIGGER support_tickets_stamp_status_ts
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.support_tickets_stamp_status_ts();

-- 2) support_ticket_events
CREATE TABLE IF NOT EXISTS public.support_ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  actor_user_id uuid,
  actor_name text,
  event_type text NOT NULL CHECK (event_type IN ('created','status_changed','priority_changed','assigned','note_added','reopened')),
  from_value text,
  to_value text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_ticket_events_ticket ON public.support_ticket_events(ticket_id, created_at);

GRANT SELECT, INSERT ON public.support_ticket_events TO authenticated;
GRANT ALL ON public.support_ticket_events TO service_role;

ALTER TABLE public.support_ticket_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can read ticket events" ON public.support_ticket_events;
CREATE POLICY "Managers can read ticket events"
  ON public.support_ticket_events FOR SELECT TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

DROP POLICY IF EXISTS "Managers can insert ticket events" ON public.support_ticket_events;
CREATE POLICY "Managers can insert ticket events"
  ON public.support_ticket_events FOR INSERT TO authenticated
  WITH CHECK (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- 3) support_ticket_notes
CREATE TABLE IF NOT EXISTS public.support_ticket_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_user_id uuid,
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_ticket_notes_ticket ON public.support_ticket_notes(ticket_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.support_ticket_notes TO authenticated;
GRANT ALL ON public.support_ticket_notes TO service_role;

ALTER TABLE public.support_ticket_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can read ticket notes" ON public.support_ticket_notes;
CREATE POLICY "Managers can read ticket notes"
  ON public.support_ticket_notes FOR SELECT TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

DROP POLICY IF EXISTS "Managers can insert ticket notes" ON public.support_ticket_notes;
CREATE POLICY "Managers can insert ticket notes"
  ON public.support_ticket_notes FOR INSERT TO authenticated
  WITH CHECK (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

DROP POLICY IF EXISTS "Authors can delete recent notes" ON public.support_ticket_notes;
CREATE POLICY "Authors can delete recent notes"
  ON public.support_ticket_notes FOR DELETE TO authenticated
  USING (
    (author_user_id = auth.uid() AND created_at > now() - interval '15 minutes')
    OR has_min_access_level(auth.uid(), 'level_4_master'::access_level)
  );

-- 4) Trigger: auto-log status/priority/assigned changes into events
CREATE OR REPLACE FUNCTION public.support_tickets_log_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.support_ticket_events(ticket_id, actor_user_id, event_type, from_value, to_value)
    VALUES (NEW.id, v_actor,
      CASE WHEN OLD.status IN ('resolved','closed') AND NEW.status IN ('new','in_progress') THEN 'reopened' ELSE 'status_changed' END,
      OLD.status, NEW.status);
  END IF;
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    INSERT INTO public.support_ticket_events(ticket_id, actor_user_id, event_type, from_value, to_value)
    VALUES (NEW.id, v_actor, 'priority_changed', OLD.priority, NEW.priority);
  END IF;
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO public.support_ticket_events(ticket_id, actor_user_id, event_type, from_value, to_value)
    VALUES (NEW.id, v_actor, 'assigned',
      CASE WHEN OLD.assigned_to IS NULL THEN NULL ELSE OLD.assigned_to::text END,
      CASE WHEN NEW.assigned_to IS NULL THEN NULL ELSE NEW.assigned_to::text END);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_tickets_log_events ON public.support_tickets;
CREATE TRIGGER support_tickets_log_events
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.support_tickets_log_events();

-- 5) Trigger: log note additions
CREATE OR REPLACE FUNCTION public.support_ticket_notes_log_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.support_ticket_events(ticket_id, actor_user_id, actor_name, event_type, to_value, metadata)
  VALUES (NEW.ticket_id, NEW.author_user_id, NEW.author_name, 'note_added', NULL, jsonb_build_object('note_id', NEW.id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_ticket_notes_log_event ON public.support_ticket_notes;
CREATE TRIGGER support_ticket_notes_log_event
  AFTER INSERT ON public.support_ticket_notes
  FOR EACH ROW EXECUTE FUNCTION public.support_ticket_notes_log_event();

-- 6) Realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_notes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
