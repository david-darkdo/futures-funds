-- Create withdrawals table
CREATE TABLE public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    wallet_address TEXT NOT NULL,
    network TEXT NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_id UUID REFERENCES auth.users(id),
    admin_note TEXT,
    txid TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawals
FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own withdrawals
CREATE POLICY "Users can insert their own withdrawals"
ON public.withdrawals
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can update all withdrawals
CREATE POLICY "Admins can update all withdrawals"
ON public.withdrawals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_withdrawals_updated_at
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();