-- Extend investments with lifecycle tracking fields.
ALTER TABLE public.user_investments
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS pause_reason text,
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS completion_reason text,
  ADD COLUMN IF NOT EXISTS last_calculated_at timestamptz DEFAULT now();

-- Store configurable membership tiers.
CREATE TABLE IF NOT EXISTS public.rank_tiers (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  description text,
  badge_color text NOT NULL,
  priority int NOT NULL,
  min_invested numeric NOT NULL DEFAULT 0,
  min_profit numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rank_tiers TO authenticated, anon;
GRANT ALL ON public.rank_tiers TO service_role;
ALTER TABLE public.rank_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rank tiers are viewable by all authenticated" ON public.rank_tiers;
CREATE POLICY "Rank tiers are viewable by all authenticated" ON public.rank_tiers
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.rank_tiers (id, display_name, description, badge_color, priority, min_invested, min_profit, enabled)
VALUES
  ('bronze', 'Bronze Member', 'Standard investor tier', '#CD7F32', 1, 0, 0, true),
  ('silver', 'Silver Member', 'Preferred investor tier with higher volume', '#C0C0C0', 2, 1000, 250, true),
  ('gold', 'Gold Member', 'Elite premium investor tier', '#FFD700', 3, 5000, 1000, true)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  badge_color = EXCLUDED.badge_color,
  priority = EXCLUDED.priority,
  min_invested = EXCLUDED.min_invested,
  min_profit = EXCLUDED.min_profit;

-- Store calculated and manually overridden ranks on profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calculated_rank text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS manual_rank text REFERENCES public.rank_tiers(id),
  ADD COLUMN IF NOT EXISTS effective_rank text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS rank_updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.recalculate_user_rank(_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total_inv numeric := 0;
  new_calc_rank text := 'bronze';
  cur_manual text;
  final_effective text;
BEGIN
  SELECT COALESCE(SUM(initial_amount), 0)
    INTO total_inv
    FROM public.user_investments
    WHERE user_id = _user_id
      AND state IN ('active'::public.investment_state, 'completed'::public.investment_state);

  SELECT manual_rank INTO cur_manual
    FROM public.profiles
    WHERE id = _user_id;

  SELECT id INTO new_calc_rank
    FROM public.rank_tiers
    WHERE enabled = true
      AND min_invested <= total_inv
    ORDER BY priority DESC, min_invested DESC
    LIMIT 1;

  new_calc_rank := COALESCE(new_calc_rank, 'bronze');
  final_effective := COALESCE(cur_manual, new_calc_rank);

  UPDATE public.profiles
    SET calculated_rank = new_calc_rank,
        effective_rank = final_effective,
        rank_updated_at = now()
    WHERE id = _user_id;

  RETURN final_effective;
END;
$$;
REVOKE ALL ON FUNCTION public.recalculate_user_rank(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.recalculate_user_rank(uuid) TO authenticated;

-- One atomic, idempotent settlement path for users and Management.
CREATE OR REPLACE FUNCTION public.settle_investment(
  _investment_id uuid,
  _reason text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := auth.uid();
  inv public.user_investments%ROWTYPE;
  principal numeric;
  profit numeric;
  total_settlement numeric;
  new_main numeric;
  new_profit_balance numeric;
  is_admin boolean := false;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required to settle investment';
  END IF;

  SELECT * INTO inv
    FROM public.user_investments
    WHERE id = _investment_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Investment not found';
  END IF;

  is_admin := public.has_role(caller, 'admin'::public.app_role);

  IF inv.user_id <> caller AND NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized to settle this investment';
  END IF;

  IF inv.state = 'completed'::public.investment_state THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'already_completed',
      'message', 'Investment has already been settled and completed.',
      'investment_id', inv.id,
      'completed_at', inv.completed_at
    );
  END IF;

  IF inv.state NOT IN ('active'::public.investment_state, 'paused'::public.investment_state) THEN
    RAISE EXCEPTION 'Only active or paused investments can be settled';
  END IF;

  IF NOT is_admin AND inv.matures_at IS NOT NULL AND inv.matures_at > now() THEN
    RAISE EXCEPTION 'Investment has not reached maturity yet';
  END IF;

  principal := round(COALESCE(inv.initial_amount, 0), 2);
  IF inv.current_value IS NOT NULL AND inv.current_value > principal THEN
    profit := round(inv.current_value - principal, 2);
  ELSE
    profit := round(principal * (COALESCE(inv.growth_percentage, 0) / 100.0), 2);
  END IF;
  total_settlement := principal + profit;

  UPDATE public.profiles
    SET main_balance = COALESCE(main_balance, 0) + principal,
        profit_balance = COALESCE(profit_balance, 0) + profit,
        updated_at = now()
    WHERE id = inv.user_id
    RETURNING main_balance, profit_balance INTO new_main, new_profit_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for settlement';
  END IF;

  UPDATE public.user_investments
    SET state = 'completed'::public.investment_state,
        completed_at = now(),
        completed_by = caller,
        completion_reason = COALESCE(_reason, 'Investment settled successfully'),
        current_value = total_settlement,
        last_updated_by = caller,
        last_calculated_at = now(),
        updated_at = now()
    WHERE id = inv.id;

  INSERT INTO public.transactions (user_id, investment_id, type, amount, balance_after, description)
  VALUES (inv.user_id, inv.id, 'investment_principal_return', principal, new_main, 'Investment principal returned at settlement.');

  INSERT INTO public.transactions (user_id, investment_id, type, amount, percentage_change, balance_after, description)
  VALUES (inv.user_id, inv.id, 'profit_added', profit, inv.growth_percentage, new_main + new_profit_balance, 'Investment profit credited at settlement.');

  INSERT INTO public.management_audit_log (
    admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason
  ) VALUES (
    caller, 'investment_settled', inv.user_id, inv.id,
    jsonb_build_object('state', inv.state::text, 'current_value', inv.current_value, 'growth_percentage', inv.growth_percentage),
    jsonb_build_object('state', 'completed', 'principal', principal, 'profit', profit, 'total_settlement', total_settlement, 'new_main_balance', new_main, 'new_profit_balance', new_profit_balance),
    COALESCE(_reason, 'Settlement executed')
  );

  INSERT INTO public.user_notifications (
    recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id
  ) VALUES (
    inv.user_id, 'investment', 'Investment Settled',
    'Your investment has settled. $' || principal::text || ' principal and $' || profit::text || ' profit were credited to your account.',
    caller, 'investment', inv.id
  );

  PERFORM public.recalculate_user_rank(inv.user_id);

  RETURN jsonb_build_object(
    'success', true,
    'code', 'settled',
    'investment_id', inv.id,
    'principal', principal,
    'profit', profit,
    'total_settlement', total_settlement,
    'new_main_balance', new_main,
    'new_profit_balance', new_profit_balance
  );
END;
$$;
REVOKE ALL ON FUNCTION public.settle_investment(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.settle_investment(uuid, text) TO authenticated;

-- User-triggered maturity processing delegates to the same settlement engine.
CREATE OR REPLACE FUNCTION public.complete_matured_investments()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  inv RECORD;
  res jsonb;
  count_done integer := 0;
BEGIN
  IF uid IS NULL THEN RETURN 0; END IF;
  FOR inv IN
    SELECT id FROM public.user_investments
    WHERE user_id = uid
      AND state = 'active'::public.investment_state
      AND matures_at IS NOT NULL
      AND matures_at <= now()
  LOOP
    res := public.settle_investment(inv.id, 'Automatic maturity settlement');
    IF COALESCE((res->>'success')::boolean, false) THEN count_done := count_done + 1; END IF;
  END LOOP;
  RETURN count_done;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_matured_investments() FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_matured_investments() TO authenticated;

-- Management can process all matured investments through the same engine.
CREATE OR REPLACE FUNCTION public.process_all_matured_investments()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := auth.uid();
  inv RECORD;
  res jsonb;
  count_done integer := 0;
BEGIN
  IF caller IS NULL OR NOT public.has_role(caller, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Management access required to process all matured investments';
  END IF;
  FOR inv IN
    SELECT id FROM public.user_investments
    WHERE state = 'active'::public.investment_state
      AND matures_at IS NOT NULL
      AND matures_at <= now()
  LOOP
    res := public.settle_investment(inv.id, 'Global maturity settlement run');
    IF COALESCE((res->>'success')::boolean, false) THEN count_done := count_done + 1; END IF;
  END LOOP;
  RETURN count_done;
END;
$$;
REVOKE ALL ON FUNCTION public.process_all_matured_investments() FROM anon;
GRANT EXECUTE ON FUNCTION public.process_all_matured_investments() TO authenticated;

-- Management pause/resume preserves the paused duration by extending maturity.
CREATE OR REPLACE FUNCTION public.admin_pause_investment(_investment_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  inv public.user_investments%ROWTYPE;
BEGIN
  SELECT * INTO inv FROM public.user_investments WHERE id = _investment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment not found'; END IF;
  IF inv.state <> 'active'::public.investment_state THEN RAISE EXCEPTION 'Only active investments can be paused'; END IF;
  UPDATE public.user_investments
    SET state = 'paused'::public.investment_state, paused_at = now(), paused_by = caller,
        pause_reason = _reason, admin_note = COALESCE(_reason, admin_note), last_updated_by = caller, updated_at = now()
    WHERE id = inv.id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason)
  VALUES (caller, 'investment_paused', inv.user_id, inv.id, jsonb_build_object('state', 'active'), jsonb_build_object('state', 'paused', 'paused_at', now()), _reason);
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id)
  VALUES (inv.user_id, 'investment', 'Investment Paused', 'Your investment has been paused by Management. Maturity will be extended upon resumption.', caller, 'investment', inv.id);
  RETURN jsonb_build_object('investment_id', inv.id, 'state', 'paused');
END;
$$;
REVOKE ALL ON FUNCTION public.admin_pause_investment(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_pause_investment(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_resume_investment(_investment_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  inv public.user_investments%ROWTYPE;
  pause_duration interval;
  new_maturity timestamptz;
BEGIN
  SELECT * INTO inv FROM public.user_investments WHERE id = _investment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment not found'; END IF;
  IF inv.state <> 'paused'::public.investment_state THEN RAISE EXCEPTION 'Only paused investments can be resumed'; END IF;
  pause_duration := now() - COALESCE(inv.paused_at, now());
  new_maturity := COALESCE(inv.matures_at, now()) + pause_duration;
  UPDATE public.user_investments
    SET state = 'active'::public.investment_state, paused_at = null, paused_by = null, pause_reason = null,
        matures_at = new_maturity, admin_note = COALESCE(_reason, admin_note), last_updated_by = caller, updated_at = now()
    WHERE id = inv.id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason)
  VALUES (caller, 'investment_resumed', inv.user_id, inv.id, jsonb_build_object('state', 'paused', 'matures_at', inv.matures_at), jsonb_build_object('state', 'active', 'matures_at', new_maturity), _reason);
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id)
  VALUES (inv.user_id, 'investment', 'Investment Resumed', 'Your investment has resumed active growth. Its maturity date was extended.', caller, 'investment', inv.id);
  RETURN jsonb_build_object('investment_id', inv.id, 'state', 'active', 'new_matures_at', new_maturity);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_resume_investment(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_resume_investment(uuid, text) TO authenticated;

-- Management rate adjustment requires a reason and records the change.
CREATE OR REPLACE FUNCTION public.admin_adjust_investment_rate(_investment_id uuid, _new_percentage numeric, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  inv public.user_investments%ROWTYPE;
  old_pct numeric;
  old_val numeric;
  new_val numeric;
BEGIN
  IF _new_percentage IS NULL OR _new_percentage < -100 OR _new_percentage > 1000 THEN RAISE EXCEPTION 'Invalid percentage rate'; END IF;
  IF _reason IS NULL OR trim(_reason) = '' THEN RAISE EXCEPTION 'Reason is required for rate adjustment'; END IF;
  SELECT * INTO inv FROM public.user_investments WHERE id = _investment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment not found'; END IF;
  IF inv.state = 'completed'::public.investment_state THEN RAISE EXCEPTION 'Cannot adjust rate on a completed investment'; END IF;
  old_pct := inv.growth_percentage;
  old_val := inv.current_value;
  new_val := round(inv.initial_amount * (1 + (_new_percentage / 100.0)), 2);
  UPDATE public.user_investments
    SET growth_percentage = _new_percentage, current_value = new_val, admin_note = _reason, last_updated_by = caller, last_calculated_at = now(), updated_at = now()
    WHERE id = inv.id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason)
  VALUES (caller, 'rate_adjusted', inv.user_id, inv.id, jsonb_build_object('growth_percentage', old_pct, 'current_value', old_val), jsonb_build_object('growth_percentage', _new_percentage, 'current_value', new_val), _reason);
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id)
  VALUES (inv.user_id, 'investment', 'Rate Adjustment', 'The effective growth rate on your investment was updated to ' || _new_percentage::text || '%.', caller, 'investment', inv.id);
  RETURN jsonb_build_object('investment_id', inv.id, 'growth_percentage', _new_percentage, 'current_value', new_val);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_adjust_investment_rate(uuid, numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_investment_rate(uuid, numeric, text) TO authenticated;

-- Management-only balance adjustment with ledger, audit, and targeted notification.
CREATE OR REPLACE FUNCTION public.admin_adjust_user_balance(_user_id uuid, _amount numeric, _type text, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  old_balance numeric;
  new_balance numeric;
  adjusted_amount numeric;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Adjustment amount must be positive'; END IF;
  IF _type NOT IN ('add', 'deduct') THEN RAISE EXCEPTION 'Invalid adjustment type'; END IF;
  IF _reason IS NULL OR trim(_reason) = '' THEN RAISE EXCEPTION 'Reason is required for balance adjustment'; END IF;
  SELECT main_balance INTO old_balance FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;
  old_balance := COALESCE(old_balance, 0);
  IF _type = 'add' THEN new_balance := old_balance + _amount; adjusted_amount := _amount;
  ELSE
    IF old_balance < _amount THEN RAISE EXCEPTION 'Cannot deduct more than available balance (Current: $%)', old_balance; END IF;
    new_balance := old_balance - _amount; adjusted_amount := -_amount;
  END IF;
  UPDATE public.profiles SET main_balance = new_balance, updated_at = now() WHERE id = _user_id;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
    VALUES (_user_id, 'admin_balance_adjustment', abs(_amount), new_balance, 'Management ' || _type || ' adjustment: ' || _reason);
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value, reason)
    VALUES (caller, 'balance_adjusted', _user_id, jsonb_build_object('main_balance', old_balance), jsonb_build_object('main_balance', new_balance, 'adjustment', adjusted_amount), _reason);
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by)
    VALUES (_user_id, 'account', 'Balance Adjusted', 'Your available balance was adjusted by ' || CASE WHEN _type = 'add' THEN '+$' ELSE '-$' END || _amount::text || '. Reason: ' || _reason, caller);
  RETURN jsonb_build_object('user_id', _user_id, 'main_balance', new_balance, 'adjustment', adjusted_amount);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_adjust_user_balance(uuid, numeric, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_balance(uuid, numeric, text, text) TO authenticated;

-- Management-only profit adjustment with separate ledger and audit history.
CREATE OR REPLACE FUNCTION public.admin_adjust_user_profit(_user_id uuid, _amount numeric, _type text, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  old_profit numeric;
  new_profit numeric;
  adjusted_amount numeric;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Adjustment amount must be positive'; END IF;
  IF _type NOT IN ('add', 'deduct') THEN RAISE EXCEPTION 'Invalid adjustment type'; END IF;
  IF _reason IS NULL OR trim(_reason) = '' THEN RAISE EXCEPTION 'Reason is required for profit adjustment'; END IF;
  SELECT profit_balance INTO old_profit FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;
  old_profit := COALESCE(old_profit, 0);
  IF _type = 'add' THEN new_profit := old_profit + _amount; adjusted_amount := _amount;
  ELSE
    IF old_profit < _amount THEN RAISE EXCEPTION 'Cannot deduct more than existing profit balance (Current: $%)', old_profit; END IF;
    new_profit := old_profit - _amount; adjusted_amount := -_amount;
  END IF;
  UPDATE public.profiles SET profit_balance = new_profit, updated_at = now() WHERE id = _user_id;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
    VALUES (_user_id, 'admin_profit_adjustment', abs(_amount), new_profit, 'Management ' || _type || ' profit adjustment: ' || _reason);
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value, reason)
    VALUES (caller, 'profit_adjusted', _user_id, jsonb_build_object('profit_balance', old_profit), jsonb_build_object('profit_balance', new_profit, 'adjustment', adjusted_amount), _reason);
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by)
    VALUES (_user_id, 'account', 'Profit Balance Adjusted', 'Your profit balance was adjusted by ' || CASE WHEN _type = 'add' THEN '+$' ELSE '-$' END || _amount::text || '. Reason: ' || _reason, caller);
  RETURN jsonb_build_object('user_id', _user_id, 'profit_balance', new_profit, 'adjustment', adjusted_amount);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_adjust_user_profit(uuid, numeric, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_profit(uuid, numeric, text, text) TO authenticated;

-- Management-only manual rank override; null removes the override.
CREATE OR REPLACE FUNCTION public.admin_set_user_rank(_user_id uuid, _manual_rank text, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  p public.profiles%ROWTYPE;
  old_manual text;
  old_effective text;
  new_effective text;
BEGIN
  IF _reason IS NULL OR trim(_reason) = '' THEN RAISE EXCEPTION 'Reason is required for rank change'; END IF;
  SELECT * INTO p FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;
  IF _manual_rank IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.rank_tiers WHERE id = _manual_rank) THEN RAISE EXCEPTION 'Invalid rank tier: %', _manual_rank; END IF;
  old_manual := p.manual_rank;
  old_effective := p.effective_rank;
  new_effective := COALESCE(_manual_rank, p.calculated_rank, 'bronze');
  UPDATE public.profiles SET manual_rank = _manual_rank, effective_rank = new_effective, rank_updated_at = now(), updated_at = now() WHERE id = _user_id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value, reason)
    VALUES (caller, 'rank_changed', _user_id, jsonb_build_object('manual_rank', old_manual, 'effective_rank', old_effective), jsonb_build_object('manual_rank', _manual_rank, 'effective_rank', new_effective), _reason);
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by)
    VALUES (_user_id, 'account', 'Account Tier Updated', 'Your membership rank was updated to ' || upper(new_effective) || '. Note: ' || _reason, caller);
  RETURN jsonb_build_object('user_id', _user_id, 'manual_rank', _manual_rank, 'effective_rank', new_effective);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_user_rank(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_rank(uuid, text, text) TO authenticated;

-- Management-only targeted user notification.
CREATE OR REPLACE FUNCTION public.send_user_notification(_recipient_id uuid, _title text, _message text, _type text DEFAULT 'management')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  notif_id uuid;
BEGIN
  IF _title IS NULL OR trim(_title) = '' THEN RAISE EXCEPTION 'Title is required'; END IF;
  IF _message IS NULL OR trim(_message) = '' THEN RAISE EXCEPTION 'Message is required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _recipient_id) THEN RAISE EXCEPTION 'User profile not found'; END IF;
  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by)
    VALUES (_recipient_id, COALESCE(_type, 'management'), _title, _message, caller)
    RETURNING id INTO notif_id;
  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, new_value, reason)
    VALUES (caller, 'notification_sent', _recipient_id, jsonb_build_object('title', _title, 'notification_id', notif_id), 'Direct user message');
  RETURN jsonb_build_object('notification_id', notif_id, 'recipient_id', _recipient_id);
END;
$$;
REVOKE ALL ON FUNCTION public.send_user_notification(uuid, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.send_user_notification(uuid, text, text, text) TO authenticated;