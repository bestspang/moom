
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_no_seq;

CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_no text NOT NULL UNIQUE DEFAULT ('SUP-' || lpad(nextval('public.support_ticket_no_seq')::text, 6, '0')),
  name text,
  is_anonymous boolean NOT NULL DEFAULT false,
  phone text,
  email text,
  category text NOT NULL CHECK (category IN ('complaint','facility','trainer','class','billing','membership','cleanliness','suggestion','other')),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved','closed')),
  admin_note text,
  handled_by uuid,
  handled_at timestamptz,
  source text NOT NULL DEFAULT 'web_public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.support_ticket_no_seq OWNED BY public.support_tickets.ticket_no;

CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

GRANT INSERT ON public.support_tickets TO anon, authenticated;
GRANT SELECT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT USAGE ON SEQUENCE public.support_ticket_no_seq TO anon, authenticated, service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a support ticket"
  ON public.support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can view support tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

CREATE POLICY "Managers can update support tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'::access_level))
  WITH CHECK (public.has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
