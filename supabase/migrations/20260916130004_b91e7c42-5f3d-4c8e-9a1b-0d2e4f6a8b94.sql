-- 11. Controlled Balance Adjustment
CREATE OR REPLACE FUNCTION public.admin_adjust_user_balance(
  _user_id uuid,
  _amount numeric,
  _type text,
  _reason text
)
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

  IF _type = 'add' THEN
    new_balance := old_balance + _amount;
    adjusted_amount := _amount;
  ELSE
    IF old_balance < _amount THEN
      RAISE EXCEPTION 'Cannot deduct more than available balance (Current: $%)', old_balance;
    END IF;
    new_balance := old_balance - _amount;
    adjusted_amount := -_amount;
  END IF;

  UPDATE public.profiles
    SET main_balance = new_balance,
        updated_at = now()
    WHERE id = _user_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
  VALUES (
    _user_id,
    'admin_balance_adjustment',
    abs(_amount),
    new_balance,
    'Management ' || _type || ' adjustment: ' || _reason
  );

  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value, reason)
  VALUES (
    caller,
    'balance_adjusted',
    _user_id,
    jsonb_build_object('main_balance', old_balance),
    jsonb_build_object('main_balance', new_balance, 'adjustment', adjusted_amount),
    _reason
  );

  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by)
  VALUES (
    _user_id,
    'account',
    'Balance Adjusted',
    'Your available balance was adjusted by ' || CASE WHEN _type = 'add' THEN '+$' ELSE '-$' END || _amount::text || '. Reason: ' || _reason,
    caller
  );

  RETURN jsonb_build_object('user_id', _user_id, 'main_balance', new_balance, 'adjustment', adjusted_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_user_balance(uuid, numeric, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_balance(uuid, numeric, text, text) TO authenticated;

-- 12. Controlled Profit Adjustment
CREATE OR REPLACE FUNCTION public.admin_adjust_user_profit(
  _user_id uuid,
  _amount numeric,
  _type text,
  _reason text
)
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

  IF _type = 'add' THEN
    new_profit := old_profit + _amount;
    adjusted_amount := _amount;
  ELSE
    IF old_profit < _amount THEN
      RAISE EXCEPTION 'Cannot deduct more than existing profit balance (Current: $%)', old_profit;
    END IF;
    new_profit := old_profit - _amount;
    adjusted_amount := -_amount;
  END IF;

  UPDATE public.profiles
    SET profit_balance = new_profit,
        updated_at = now()
    WHERE id = _user_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
  VALUES (
    _user_id,
    'admin_profit_adjustment',
    abs(_amount),
    new_profit,
    'Management ' || _type || ' profit adjustment: ' || _reason
  );

  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value, reason)
  VALUES (
    caller,
    'profit_adjusted',
    _user_id,
    jsonb_build_object('profit_balance', old_profit),
    jsonb_build_object('profit_balance', new_profit, 'adjustment', adjusted_amount),
    _reason
  );

  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by)
  VALUES (
    _user_id,
    'account',
    'Profit Balance Adjusted',
    'Your profit balance was adjusted by ' || CASE WHEN _type = 'add' THEN '+$' ELSE '-$' END || _amount::text || '. Reason: ' || _reason,
    caller
  );

  RETURN jsonb_build_object('user_id', _user_id, 'profit_balance', new_profit, 'adjustment', adjusted_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_user_profit(uuid, numeric, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_profit(uuid, numeric, text, text) TO authenticated;

-- 13. Manual Rank Override
CREATE OR REPLACE FUNCTION public.admin_set_user_rank(
  _user_id uuid,
  _manual_rank text,
  _reason text
)
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

  IF _manual_rank IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.rank_tiers WHERE id = _manual_rank) THEN
    RAISE EXCEPTION 'Invalid rank tier: %', _manual_rank;
  END IF;

  old_manual := p.manual_rank;
  old_effective := p.effective_rank;
  new_effective := COALESCE(_manual_rank, p.calculated_rank, 'bronze');

  UPDATE public.profiles
    SET manual_rank = _manual_rank,
        effective_rank = new_effective,
        rank_updated_at = now(),
        updated_at = now()
    WHERE id = _user_id;

  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, previous_value, new_value, reason)
  VALUES (
    caller,
    'rank_changed',
    _user_id,
    jsonb_build_object('manual_rank', old_manual, 'effective_rank', old_effective),
    jsonb_build_object('manual_rank', _manual_rank, 'effective_rank', new_effective),
    _reason
  );

  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by)
  VALUES (
    _user_id,
    'account',
    'Account Tier Updated',
    'Your membership rank was updated to ' || upper(new_effective) || '. Note: ' || _reason,
    caller
  );

  RETURN jsonb_build_object('user_id', _user_id, 'manual_rank', _manual_rank, 'effective_rank', new_effective);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_rank(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_rank(uuid, text, text) TO authenticated;

-- 14. Targeted Management Notification Sender
CREATE OR REPLACE FUNCTION public.send_user_notification(
  _recipient_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'management'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  notif_id uuid;
BEGIN
  IF _title IS NULL OR trim(_title) = '' THEN RAISE EXCEPTION 'Title is required'; END IF;
  IF _message IS NULL OR trim(_message) = '' THEN RAISE EXCEPTION 'Message is required'; END IF;

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
