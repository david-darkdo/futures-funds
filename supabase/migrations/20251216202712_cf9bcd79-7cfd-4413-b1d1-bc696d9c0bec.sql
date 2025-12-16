-- Create email masking function for privacy
CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
    at_pos integer;
    local_part text;
    domain_part text;
    masked_local text;
BEGIN
    IF email IS NULL THEN
        RETURN NULL;
    END IF;
    
    at_pos := position('@' in email);
    IF at_pos = 0 THEN
        RETURN '***';
    END IF;
    
    local_part := substring(email from 1 for at_pos - 1);
    domain_part := substring(email from at_pos);
    
    IF length(local_part) <= 2 THEN
        masked_local := local_part || '***';
    ELSE
        masked_local := substring(local_part from 1 for 2) || '***';
    END IF;
    
    RETURN masked_local || domain_part;
END;
$$;

-- Drop existing RESTRICTIVE policies on payments and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

-- Recreate as PERMISSIVE policies (default) so OR logic applies
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own payments"
ON public.payments
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all payments"
ON public.payments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to insert payments (for manual adjustments)
CREATE POLICY "Admins can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));