
-- =====================================================
-- 1. FIX: Recreate all {public} role policies as {authenticated}
-- =====================================================

-- payments table
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
CREATE POLICY "Users can insert their own payments" ON payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update all payments" ON payments;
CREATE POLICY "Admins can update all payments" ON payments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert payments" ON payments;
CREATE POLICY "Admins can insert payments" ON payments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- withdrawals table
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
CREATE POLICY "Users can view their own withdrawals" ON withdrawals FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
CREATE POLICY "Admins can view all withdrawals" ON withdrawals FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON withdrawals;
CREATE POLICY "Users can insert their own withdrawals" ON withdrawals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update all withdrawals" ON withdrawals;
CREATE POLICY "Admins can update all withdrawals" ON withdrawals FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- user_investments table
DROP POLICY IF EXISTS "Users can view their own investments" ON user_investments;
CREATE POLICY "Users can view their own investments" ON user_investments FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all investments" ON user_investments;
CREATE POLICY "Admins can view all investments" ON user_investments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert investments" ON user_investments;
CREATE POLICY "Admins can insert investments" ON user_investments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update investments" ON user_investments;
CREATE POLICY "Admins can update investments" ON user_investments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete investments" ON user_investments;
CREATE POLICY "Admins can delete investments" ON user_investments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- admin_logs table
DROP POLICY IF EXISTS "Admins can view all logs" ON admin_logs;
CREATE POLICY "Admins can view all logs" ON admin_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert logs" ON admin_logs;
CREATE POLICY "Admins can insert logs" ON admin_logs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- investment_growth_logs table
DROP POLICY IF EXISTS "Admins can view all growth logs" ON investment_growth_logs;
CREATE POLICY "Admins can view all growth logs" ON investment_growth_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert growth logs" ON investment_growth_logs;
CREATE POLICY "Admins can insert growth logs" ON investment_growth_logs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own investment logs" ON investment_growth_logs;
CREATE POLICY "Users can view their own investment logs" ON investment_growth_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_investments ui WHERE ui.id = investment_growth_logs.investment_id AND ui.user_id = auth.uid()));

-- transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert transactions" ON transactions;
CREATE POLICY "Admins can insert transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- demo_investments table
DROP POLICY IF EXISTS "Users can view own demo investments" ON demo_investments;
CREATE POLICY "Users can view own demo investments" ON demo_investments FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own demo investments" ON demo_investments;
CREATE POLICY "Users can create own demo investments" ON demo_investments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own demo investments" ON demo_investments;
CREATE POLICY "Users can delete own demo investments" ON demo_investments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- 2. FIX: Add withdrawal amount validation trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_withdrawal_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_balance numeric;
  pending_withdrawals numeric;
BEGIN
  -- Get the user's total active investment balance
  SELECT COALESCE(SUM(current_value), 0) INTO available_balance
  FROM user_investments
  WHERE user_id = NEW.user_id AND state = 'active';

  -- Subtract any pending/processing withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO pending_withdrawals
  FROM withdrawals
  WHERE user_id = NEW.user_id AND status IN ('pending', 'processing');

  available_balance := available_balance - pending_withdrawals;

  IF NEW.amount > available_balance THEN
    RAISE EXCEPTION 'Withdrawal amount (%) exceeds available balance (%)', NEW.amount, available_balance;
  END IF;

  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be positive';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_withdrawal_amount
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_withdrawal_amount();
