-- 8. Pause Investment with timestamp tracking
CREATE OR REPLACE FUNCTION public.admin_pause_investment(
  _investment_id uuid,
  _reason text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  inv public.user_investments%ROWTYPE;
BEGIN
  SELECT * INTO inv FROM public.user_investments WHERE id = _investment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment not found'; END IF;
  IF inv.state <> 'active'::public.investment_state THEN
    RAISE EXCEPTION 'Only active investments can be paused';
  END IF;

  UPDATE public.user_investments
    SET state = 'paused'::public.investment_state,
        paused_at = now(),
        paused_by = caller,
        pause_reason = _reason,
        admin_note = COALESCE(_reason, admin_note),
        last_updated_by = caller,
        updated_at = now()
    WHERE id = inv.id;

  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason)
  VALUES (caller, 'investment_paused', inv.user_id, inv.id,
          jsonb_build_object('state', 'active'),
          jsonb_build_object('state', 'paused', 'paused_at', now()),
          _reason);

  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id)
  VALUES (inv.user_id, 'investment', 'Investment Paused',
          'Your investment has been paused by management. Elapsed duration is preserved and maturity will be extended upon resumption.',
          caller, 'investment', inv.id);

  RETURN jsonb_build_object('investment_id', inv.id, 'state', 'paused');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_pause_investment(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_pause_investment(uuid, text) TO authenticated;

-- 9. Resume Investment with maturity extension
CREATE OR REPLACE FUNCTION public.admin_resume_investment(
  _investment_id uuid,
  _reason text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  inv public.user_investments%ROWTYPE;
  pause_duration interval;
  new_maturity timestamptz;
BEGIN
  SELECT * INTO inv FROM public.user_investments WHERE id = _investment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment not found'; END IF;
  IF inv.state <> 'paused'::public.investment_state THEN
    RAISE EXCEPTION 'Only paused investments can be resumed';
  END IF;

  -- Calculate how long the investment was paused and extend maturity
  pause_duration := now() - COALESCE(inv.paused_at, now());
  new_maturity := COALESCE(inv.matures_at, now()) + pause_duration;

  UPDATE public.user_investments
    SET state = 'active'::public.investment_state,
        paused_at = null,
        paused_by = null,
        pause_reason = null,
        matures_at = new_maturity,
        admin_note = COALESCE(_reason, admin_note),
        last_updated_by = caller,
        updated_at = now()
    WHERE id = inv.id;

  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason)
  VALUES (caller, 'investment_resumed', inv.user_id, inv.id,
          jsonb_build_object('state', 'paused', 'matures_at', inv.matures_at),
          jsonb_build_object('state', 'active', 'matures_at', new_maturity, 'extended_by_seconds', extract(epoch from pause_duration)),
          _reason);

  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id)
  VALUES (inv.user_id, 'investment', 'Investment Resumed',
          'Your investment has resumed active growth. Its maturity date was extended to maintain the full investment period.',
          caller, 'investment', inv.id);

  RETURN jsonb_build_object('investment_id', inv.id, 'state', 'active', 'new_matures_at', new_maturity);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_resume_investment(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_resume_investment(uuid, text) TO authenticated;

-- 10. Adjust Effective Rate on Investment
CREATE OR REPLACE FUNCTION public.admin_adjust_investment_rate(
  _investment_id uuid,
  _new_percentage numeric,
  _reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := public.require_management();
  inv public.user_investments%ROWTYPE;
  old_pct numeric;
  old_val numeric;
  new_val numeric;
BEGIN
  IF _new_percentage IS NULL OR _new_percentage < -100 OR _new_percentage > 1000 THEN
    RAISE EXCEPTION 'Invalid percentage rate';
  END IF;
  IF _reason IS NULL OR trim(_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required for rate adjustment';
  END IF;

  SELECT * INTO inv FROM public.user_investments WHERE id = _investment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment not found'; END IF;
  IF inv.state = 'completed'::public.investment_state THEN
    RAISE EXCEPTION 'Cannot adjust rate on a completed investment';
  END IF;

  old_pct := inv.growth_percentage;
  old_val := inv.current_value;
  new_val := round(inv.initial_amount * (1 + (_new_percentage / 100.0)), 2);

  UPDATE public.user_investments
    SET growth_percentage = _new_percentage,
        current_value = new_val,
        admin_note = _reason,
        last_updated_by = caller,
        updated_at = now()
    WHERE id = inv.id;

  INSERT INTO public.management_audit_log (admin_id, action, target_user_id, target_investment_id, previous_value, new_value, reason)
  VALUES (caller, 'rate_adjusted', inv.user_id, inv.id,
          jsonb_build_object('growth_percentage', old_pct, 'current_value', old_val),
          jsonb_build_object('growth_percentage', _new_percentage, 'current_value', new_val),
          _reason);

  INSERT INTO public.user_notifications (recipient_user_id, type, title, message, created_by, related_entity_type, related_entity_id)
  VALUES (inv.user_id, 'investment', 'Rate Adjustment',
          'The effective growth rate on your investment was updated to ' || _new_percentage::text || '%.',
          caller, 'investment', inv.id);

  RETURN jsonb_build_object('investment_id', inv.id, 'growth_percentage', _new_percentage, 'current_value', new_val);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_investment_rate(uuid, numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_investment_rate(uuid, numeric, text) TO authenticated;
