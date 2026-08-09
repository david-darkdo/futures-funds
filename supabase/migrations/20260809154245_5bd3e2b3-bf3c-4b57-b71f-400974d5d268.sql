CREATE TABLE public.client_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  visitor_name text,
  visitor_email text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.client_feedback TO anon;
GRANT SELECT, INSERT ON public.client_feedback TO authenticated;
GRANT ALL ON public.client_feedback TO service_role;

ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback" ON public.client_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read feedback" ON public.client_feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));