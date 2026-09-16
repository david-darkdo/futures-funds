DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'investment_state') THEN
    CREATE TYPE public.investment_state AS ENUM ('no_investment', 'pending_payment', 'active', 'paused', 'completed', 'merged');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'account',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_notifications TO authenticated;
GRANT INSERT, UPDATE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own notifications" ON public.user_notifications;
CREATE POLICY "Users read own notifications" ON public.user_notifications FOR SELECT TO authenticated USING (recipient_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Users mark own notifications read" ON public.user_notifications;
CREATE POLICY "Users mark own notifications read" ON public.user_notifications FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid()) WITH CHECK (recipient_user_id = auth.uid());
DROP POLICY IF EXISTS "Management creates notifications" ON public.user_notifications;
CREATE POLICY "Management creates notifications" ON public.user_notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.management_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  target_investment_id uuid REFERENCES public.user_investments(id),
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.management_audit_log TO authenticated;
GRANT ALL ON public.management_audit_log TO service_role;
ALTER TABLE public.management_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Management reads audit log" ON public.management_audit_log;
CREATE POLICY "Management reads audit log" ON public.management_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Management writes audit log" ON public.management_audit_log;
CREATE POLICY "Management writes audit log" ON public.management_audit_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND admin_id = auth.uid());

CREATE OR REPLACE FUNCTION public.require_management()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE caller uuid := auth.uid();
BEGIN
  IF caller IS NULL OR NOT public.has_role(caller, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Management access required';
  END IF;
  RETURN caller;
END;
$$;
REVOKE ALL ON FUNCTION public.require_management() FROM anon;
GRANT EXECUTE ON FUNCTION public.require_management() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_apply_growth(
  _investment_id uuid,
  _percentage_change numeric,
  _change_type text,
  _note text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  caller uuid := public.require_management();
  inv public.user_investments%ROWTYPE;
  old_value numeric;
  new_value numeric;
  delta numeric;
  new_percentage numeric;
BEGIN
  IF _percentage_change IS NULL OR _percentage_change < 0 OR _percentage_change > 100 THEN RAISE EXCEPTION 'Invalid percentage change'; END IF;
  IF _change_type NOT IN ('growth', 'drawdown') THEN RAISE EXCEPTION 'Invalid change type'; END IF;
  SELECT * INTO inv FROM public.user_investments WHERE id = _investment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment not found'; END IF;
  IF inv.state NOT IN ('active'::public.investment_state, 'paused'::public.investment_state) THEN RAISE EXCEPTION 'Only active or paused investments can be adjusted'; END IF;
  old_value := COALESCE(inv.current_value, inv.initial_amount);
  IF _change_type = 'growth' THEN new_value := round(old_value * (1 + (_percentage_change / 100)), 2); ELSE new_value := round(old_value * (1 - (_percentage_change / 100)), 2); END IF;
  IF new_value < 0 THEN RAISE EXCEPTION 'Investment value cannot be negative'; END IF;
  new_percentage := CASE WHEN inv.initial_amount = 0 THEN 0 ELSE round(((new_value - inv.initial_amount) / inv.initial_amount) * 100, 4) END;
  delta := round(new_value - old_value, 2);
  UPDATE public.user_investments SET current_value = new_value, growth_percentage = new_percentage, admin_note = COALESCE(_note, admin_note), last_updated_by = caller, updated_at = now() WHERE id = _investment_id;
  INSERT INTO public.investment_growth_logs (investment_id, admin_id, change_type, percentage_change, balance_before, balance_after, admin_note) VALUES (_investment_id, caller, _change_type, _percentage_change, old_value, new_value, _note);
  INSERT INTO public.transactions (user_id, investment_id, type, amount, percentage_change, balance_after, description) VALUES (inv.user_id, inv.id, _change_type, abs(delta), _percentage_change, new_value, CASE WHEN _change_type = 'growth' THEN 'Management growth adjustment' ELSE 'Management drawdown adjustment' END);
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason) VALUES (caller, 'investment_value_adjusted', inv.user_id, inv.id, jsonb_build_object('current_value', old_value, 'growth_percentage', inv.growth_percentage), jsonb_build_object('current_value', new_value, 'growth_percentage', new_percentage), _note);
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id) VALUES (inv.user_id, 'investment', 'Investment update', 'Your investment value was updated by management.', caller, 'investment', inv.id);
  RETURN jsonb_build_object('investment_id', inv.id, 'current_value', new_value, 'growth_percentage', new_percentage);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_apply_growth(uuid, numeric, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_apply_growth(uuid, numeric, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_investment_state(
  _investment_id uuid,
  _state text,
  _note text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  caller uuid := public.require_management();
  inv public.user_investments%ROWTYPE;
  old_state text;
  principal numeric;
  profit numeric;
  new_main numeric;
  new_profit_balance numeric;
BEGIN
  SELECT * INTO inv FROM public.user_investments WHERE id = _investment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment not found'; END IF;
  old_state := inv.state::text;
  IF _state NOT IN ('active', 'paused', 'completed') THEN RAISE EXCEPTION 'Unsupported investment state'; END IF;
  IF old_state = 'completed' THEN RAISE EXCEPTION 'Completed investments cannot be changed'; END IF;
  IF _state = 'completed' THEN
    IF old_state NOT IN ('active', 'paused') THEN RAISE EXCEPTION 'Only active or paused investments can be completed'; END IF;
    principal := round(COALESCE(inv.initial_amount, 0), 2);
    profit := round(GREATEST(COALESCE(inv.current_value, principal) - principal, 0), 2);
    UPDATE public.profiles SET main_balance = COALESCE(main_balance, 0) + principal, profit_balance = COALESCE(profit_balance, 0) + profit WHERE id = inv.user_id RETURNING main_balance, profit_balance INTO new_main, new_profit_balance;
    IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;
    UPDATE public.user_investments SET state = 'completed', completed_at = now(), last_updated_by = caller, admin_note = COALESCE(_note, admin_note), updated_at = now() WHERE id = inv.id;
    INSERT INTO public.transactions (user_id, investment_id, type, amount, balance_after, description) VALUES (inv.user_id, inv.id, 'investment_principal_return', principal, new_main, 'Investment principal returned at settlement.');
    INSERT INTO public.transactions (user_id, investment_id, type, amount, percentage_change, balance_after, description) VALUES (inv.user_id, inv.id, 'profit_added', profit, inv.growth_percentage, new_main + new_profit_balance, 'Investment profit credited at settlement.');
    INSERT INTO public.management_audit_log (admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason) VALUES (caller, 'investment_completed', inv.user_id, inv.id, jsonb_build_object('state', old_state), jsonb_build_object('state', 'completed', 'principal', principal, 'profit', profit), _note);
    INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id) VALUES (inv.user_id, 'investment', 'Investment completed', 'Your investment has completed. Principal and profit were credited to your balances.', caller, 'investment', inv.id);
    RETURN jsonb_build_object('investment_id', inv.id, 'state', 'completed', 'principal', principal, 'profit', profit);
  END IF;
  IF _state = 'paused' AND old_state <> 'active' THEN RAISE EXCEPTION 'Only active investments can be paused'; END IF;
  IF _state = 'active' AND old_state <> 'paused' THEN RAISE EXCEPTION 'Only paused investments can resume'; END IF;
  UPDATE public.user_investments SET state = _state::public.investment_state, admin_note = COALESCE(_note, admin_note), last_updated_by = caller, updated_at = now() WHERE id = inv.id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason) VALUES (caller, CASE WHEN _state = 'paused' THEN 'investment_paused' ELSE 'investment_resumed' END, inv.user_id, inv.id, jsonb_build_object('state', old_state), jsonb_build_object('state', _state), _note);
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id) VALUES (inv.user_id, 'investment', CASE WHEN _state = 'paused' THEN 'Investment paused' ELSE 'Investment resumed' END, CASE WHEN _state = 'paused' THEN 'Your investment has been paused by management.' ELSE 'Your investment has resumed.' END, caller, 'investment', inv.id);
  RETURN jsonb_build_object('investment_id', inv.id, 'state', _state);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_investment_state(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_investment_state(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(_withdrawal_id uuid, _txid text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE caller uuid := public.require_management(); w public.withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO w FROM public.withdrawals WHERE id = _withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'Withdrawal is no longer pending'; END IF;
  UPDATE public.withdrawals SET status = 'approved', txid = _txid, admin_id = caller, updated_at = now() WHERE id = w.id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value, reason) VALUES (caller, 'withdrawal_approved', w.user_id, jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'approved', 'txid', _txid), 'Withdrawal approved');
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id) VALUES (w.user_id, 'withdrawal', 'Withdrawal approved', 'Your withdrawal request has been approved.', caller, 'withdrawal', w.id);
  RETURN jsonb_build_object('withdrawal_id', w.id, 'status', 'approved');
END;
$$;
REVOKE ALL ON FUNCTION public.admin_approve_withdrawal(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_withdrawal(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(_withdrawal_id uuid, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE caller uuid := public.require_management(); w public.withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO w FROM public.withdrawals WHERE id = _withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'Withdrawal is no longer pending'; END IF;
  UPDATE public.withdrawals SET status = 'rejected', admin_note = COALESCE(_note, 'Withdrawal rejected by management'), admin_id = caller, updated_at = now() WHERE id = w.id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value, reason) VALUES (caller, 'withdrawal_rejected', w.user_id, jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'rejected'), _note);
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id) VALUES (w.user_id, 'withdrawal', 'Withdrawal rejected', COALESCE(_note, 'Your withdrawal request was rejected by management.'), caller, 'withdrawal', w.id);
  RETURN jsonb_build_object('withdrawal_id', w.id, 'status', 'rejected');
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reject_withdrawal(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_withdrawal(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_investing_frozen(_user_id uuid, _frozen boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE caller uuid := public.require_management(); old_value boolean;
BEGIN
  SELECT investing_frozen INTO old_value FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;
  UPDATE public.profiles SET investing_frozen = _frozen, updated_at = now() WHERE id = _user_id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value) VALUES (caller, 'investing_freeze_changed', _user_id, jsonb_build_object('investing_frozen', old_value), jsonb_build_object('investing_frozen', _frozen));
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by) VALUES (_user_id, 'account', CASE WHEN _frozen THEN 'Investing paused' ELSE 'Investing restored' END, CASE WHEN _frozen THEN 'New investments are temporarily disabled on your account.' ELSE 'Investing has been restored on your account.' END, caller);
  RETURN jsonb_build_object('user_id', _user_id, 'investing_frozen', _frozen);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_investing_frozen(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_investing_frozen(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(_user_id uuid, _status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE caller uuid := public.require_management(); old_status text;
BEGIN
  IF _status NOT IN ('pending', 'active', 'frozen') THEN RAISE EXCEPTION 'Invalid user status'; END IF;
  SELECT status INTO old_status FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;
  UPDATE public.profiles SET status = _status, updated_at = now() WHERE id = _user_id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value) VALUES (caller, 'user_status_changed', _user_id, jsonb_build_object('status', old_status), jsonb_build_object('status', _status));
  RETURN jsonb_build_object('user_id', _user_id, 'status', _status);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_user_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND main_balance = (SELECT p.main_balance FROM public.profiles p WHERE p.id = auth.uid()) AND profit_balance = (SELECT p.profit_balance FROM public.profiles p WHERE p.id = auth.uid()) AND investing_frozen = (SELECT p.investing_frozen FROM public.profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE UPDATE (main_balance, profit_balance, investing_frozen) ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, email, status, last_login_at, avatar_url, theme, language) ON public.profiles TO authenticated;

REVOKE UPDATE ON public.user_investments FROM authenticated;
REVOKE INSERT ON public.transactions FROM authenticated;
REVOKE INSERT ON public.investment_growth_logs FROM authenticated;
REVOKE INSERT ON public.management_audit_log FROM authenticated;
REVOKE INSERT ON public.user_notifications FROM authenticated;

ALTER TABLE public.investment_growth_logs ALTER COLUMN admin_id SET DEFAULT auth.uid();
ALTER TABLE public.admin_logs ALTER COLUMN admin_id SET DEFAULT auth.uid();
ALTER TABLE public.user_investments ALTER COLUMN last_updated_by SET DEFAULT auth.uid();
ALTER TABLE public.payments ALTER COLUMN admin_id SET DEFAULT auth.uid();
ALTER TABLE public.withdrawals ALTER COLUMN admin_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Admins can insert growth logs" ON public.investment_growth_logs;
CREATE POLICY "Admins can insert growth logs" ON public.investment_growth_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND admin_id = auth.uid());
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;
CREATE POLICY "Admins can insert logs" ON public.admin_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND admin_id = auth.uid());
