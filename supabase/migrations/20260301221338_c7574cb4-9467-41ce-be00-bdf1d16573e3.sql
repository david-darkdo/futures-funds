
-- Create demo_investments table
CREATE TABLE public.demo_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id),
  initial_amount NUMERIC NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_investments ENABLE ROW LEVEL SECURITY;

-- Users can view their own demo investments
CREATE POLICY "Users can view own demo investments"
ON public.demo_investments
FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own demo investments
CREATE POLICY "Users can create own demo investments"
ON public.demo_investments
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can delete their own demo investments
CREATE POLICY "Users can delete own demo investments"
ON public.demo_investments
FOR DELETE
USING (user_id = auth.uid());
