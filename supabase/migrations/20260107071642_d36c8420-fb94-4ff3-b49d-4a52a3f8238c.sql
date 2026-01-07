-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'growth', 'drawdown', 'withdrawal');

-- Create transactions table for user transaction history
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    investment_id UUID REFERENCES public.user_investments(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    percentage_change NUMERIC,
    balance_after NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster user queries
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert transactions (when approving payments, applying growth, etc.)
CREATE POLICY "Admins can insert transactions"
ON public.transactions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;