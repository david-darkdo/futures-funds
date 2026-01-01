-- Create investment_growth_logs table to track admin growth applications
CREATE TABLE public.investment_growth_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    investment_id UUID NOT NULL REFERENCES public.user_investments(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('growth', 'drawdown', 'manual_adjustment')),
    percentage_change NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_growth_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view and insert logs
CREATE POLICY "Admins can view all growth logs"
ON public.investment_growth_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert growth logs"
ON public.investment_growth_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own investment logs
CREATE POLICY "Users can view their own investment logs"
ON public.investment_growth_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_investments ui
        WHERE ui.id = investment_id
        AND ui.user_id = auth.uid()
    )
);

-- Add index for performance
CREATE INDEX idx_growth_logs_investment ON public.investment_growth_logs(investment_id);
CREATE INDEX idx_growth_logs_created ON public.investment_growth_logs(created_at DESC);

-- Enable realtime for user_investments for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_investments;