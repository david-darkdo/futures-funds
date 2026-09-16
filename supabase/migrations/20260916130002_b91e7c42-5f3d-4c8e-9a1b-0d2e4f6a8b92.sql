-- 5. UNIFIED ATOMIC SETTLEMENT ENGINE
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

  -- Lock investment row exclusively
  SELECT * INTO inv
    FROM public.user_investments
    WHERE id = _investment_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Investment not found';
  END IF;

  is_admin := public.has_role(caller, 'admin'::public.app_role);

  -- Authorization check: caller must own investment or be an admin
  IF inv.user_id <> caller AND NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized to settle this investment';
  END IF;

  -- DOUBLE-COMPLETION PROTECTION:
  -- If already completed, reject idempotently without adding any funds
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

  -- If non-admin user requests settlement, maturity must have passed
  IF NOT is_admin AND inv.matures_at IS NOT NULL AND inv.matures_at > now() THEN
    RAISE EXCEPTION 'Investment has not reached maturity yet';
  END IF;

  -- Exact financial calculation
  principal := round(COALESCE(inv.initial_amount, 0), 2);
  -- Profit is based on current_value above principal, or growth_percentage if current_value was unadjusted
  IF inv.current_value IS NOT NULL AND inv.current_value > principal THEN
    profit := round(inv.current_value - principal, 2);
  ELSE
    profit := round(principal * (COALESCE(inv.growth_percentage, 0) / 100.0), 2);
  END IF;
  total_settlement := principal + profit;

  -- 1. Atomically credit user profile (principal returned to main_balance, profit to profit_balance)
  UPDATE public.profiles
    SET main_balance = COALESCE(main_balance, 0) + principal,
        profit_balance = COALESCE(profit_balance, 0) + profit,
        updated_at = now()
    WHERE id = inv.user_id
    RETURNING main_balance, profit_balance INTO new_main, new_profit_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for settlement';
  END IF;

  -- 2. Mark investment row completed and freeze values
  UPDATE public.user_investments
    SET state = 'completed'::public.investment_state,
        completed_at = now(),
        completed_by = caller,
        completion_reason = COALESCE(_reason, 'Investment settled successfully'),
        current_value = total_settlement,
        last_updated_by = caller,
        updated_at = now()
    WHERE id = inv.id;

  -- 3. Write immutable ledger records in transactions table
  INSERT INTO public.transactions (user_id, investment_id, type, amount, balance_after, description)
  VALUES (
    inv.user_id,
    inv.id,
    'investment_principal_return',
    principal,
    new_main,
    'Investment principal returned at settlement.'
  );

  INSERT INTO public.transactions (user_id, investment_id, type, amount, percentage_change, balance_after, description)
  VALUES (
    inv.user_id,
    inv.id,
    'profit_added',
    profit,
    inv.growth_percentage,
    new_main + new_profit_balance,
    'Investment profit credited at settlement.'
  );

  -- 4. Write audit log entry
  INSERT INTO public.management_audit_log (
    admin_id,
    action,
    target_user_id,
    target_investment_id,
    previous_value,
    new_value,
    reason
  )
  VALUES (
    caller,
    'investment_settled',
    inv.user_id,
    inv.id,
    jsonb_build_object(
      'state', inv.state::text,
      'current_value', inv.current_value,
      'growth_percentage', inv.growth_percentage
    ),
    jsonb_build_object(
      'state', 'completed',
      'principal', principal,
      'profit', profit,
      'total_settlement', total_settlement,
      'new_main_balance', new_main,
      'new_profit_balance', new_profit_balance
    ),
    COALESCE(_reason, 'Settlement executed')
  );

  -- 5. Send targeted notification to affected user
  INSERT INTO public.user_notifications (
    recipient_user_id,
    type,
    title,
    message,
    created_by,
    related_entity_type,
    related_entity_id
  )
  VALUES (
    inv.user_id,
    'investment',
    'Investment Settled',
    'Your investment has settled. $' || principal::text || ' principal and $' || profit::text || ' profit were credited to your account.',
    caller,
    'investment',
    inv.id
  );

  -- 6. Recalculate rank for the user
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

-- 6. Update complete_matured_investments to delegate to settle_investment
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
    SELECT id
      FROM public.user_investments
      WHERE user_id = uid
        AND state = 'active'::public.investment_state
        AND matures_at IS NOT NULL
        AND matures_at <= now()
  LOOP
    res := public.settle_investment(inv.id, 'Automatic maturity settlement');
    IF (res->>'success')::boolean IS TRUE THEN
      count_done := count_done + 1;
    END IF;
  END LOOP;

  RETURN count_done;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_matured_investments() FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_matured_investments() TO authenticated;

-- 7. Background / Admin Maturity Processor for ALL users
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
    SELECT id
      FROM public.user_investments
      WHERE state = 'active'::public.investment_state
        AND matures_at IS NOT NULL
        AND matures_at <= now()
  LOOP
    res := public.settle_investment(inv.id, 'Global maturity settlement run');
    IF (res->>'success')::boolean IS TRUE THEN
      count_done := count_done + 1;
    END IF;
  END LOOP;

  RETURN count_done;
END;
$$;

REVOKE ALL ON FUNCTION public.process_all_matured_investments() FROM anon;
GRANT EXECUTE ON FUNCTION public.process_all_matured_investments() TO authenticated;
