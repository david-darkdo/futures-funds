
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS main_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS investing_frozen boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_investments
  ADD COLUMN IF NOT EXISTS matures_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.payments
  ALTER COLUMN bundle_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS amount_usd numeric;

ALTER TABLE public.transactions
  ALTER COLUMN type TYPE text USING type::text;

DROP FUNCTION IF EXISTS public.validate_withdrawal_amount() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_withdrawal_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total_avail numeric;
BEGIN
  SELECT COALESCE(main_balance,0) + COALESCE(profit_balance,0)
    INTO total_avail FROM public.profiles WHERE id = NEW.user_id;
  IF NEW.amount <= 0 THEN RAISE EXCEPTION 'Withdrawal amount must be positive'; END IF;
  IF NEW.amount > COALESCE(total_avail,0) THEN
    RAISE EXCEPTION 'Withdrawal amount (%) exceeds available balance (%)', NEW.amount, total_avail;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS validate_withdrawal_balance_trigger ON public.withdrawals;
CREATE TRIGGER validate_withdrawal_balance_trigger
BEFORE INSERT ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_balance();

CREATE OR REPLACE FUNCTION public.handle_payment_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE amt numeric; new_balance numeric;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  amt := COALESCE(NEW.amount_usd, NEW.crypto_amount, 0);
  IF NEW.status = 'approved' THEN
    UPDATE public.profiles SET main_balance = COALESCE(main_balance,0) + amt
      WHERE id = NEW.user_id RETURNING main_balance INTO new_balance;
    INSERT INTO public.transactions(user_id, type, amount, balance_after, description)
    VALUES (NEW.user_id,'deposit_approved',amt,COALESCE(new_balance,0),
            'Deposit of $'||amt::text||' approved and added to balance.');
  ELSIF NEW.status = 'rejected' THEN
    SELECT COALESCE(main_balance,0) INTO new_balance FROM public.profiles WHERE id=NEW.user_id;
    INSERT INTO public.transactions(user_id, type, amount, balance_after, description)
    VALUES (NEW.user_id,'deposit_rejected',amt,COALESCE(new_balance,0),
            'Deposit of $'||amt::text||' was rejected.');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS payment_status_change_trigger ON public.payments;
CREATE TRIGGER payment_status_change_trigger
AFTER UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.handle_payment_status_change();

CREATE OR REPLACE FUNCTION public.handle_payment_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE amt numeric; cur_balance numeric;
BEGIN
  amt := COALESCE(NEW.amount_usd, NEW.crypto_amount, 0);
  SELECT COALESCE(main_balance,0) INTO cur_balance FROM public.profiles WHERE id=NEW.user_id;
  INSERT INTO public.transactions(user_id, type, amount, balance_after, description)
  VALUES (NEW.user_id,'deposit_submitted',amt,COALESCE(cur_balance,0),
          'Deposit of $'||amt::text||' submitted for review.');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS payment_insert_trigger ON public.payments;
CREATE TRIGGER payment_insert_trigger
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.handle_payment_insert();

CREATE OR REPLACE FUNCTION public.handle_withdrawal_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE use_profit numeric; use_main numeric; prof_bal numeric; main_bal numeric; new_total numeric;
BEGIN
  SELECT COALESCE(main_balance,0), COALESCE(profit_balance,0) INTO main_bal, prof_bal
    FROM public.profiles WHERE id=NEW.user_id;
  use_profit := LEAST(NEW.amount, prof_bal);
  use_main := NEW.amount - use_profit;
  UPDATE public.profiles
    SET profit_balance = profit_balance - use_profit,
        main_balance = main_balance - use_main
    WHERE id = NEW.user_id
    RETURNING (main_balance + profit_balance) INTO new_total;
  INSERT INTO public.transactions(user_id, type, amount, balance_after, description)
  VALUES (NEW.user_id,'withdrawal_requested',NEW.amount,COALESCE(new_total,0),
          'Withdrawal request of $'||NEW.amount::text||' submitted.');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS withdrawal_insert_trigger ON public.withdrawals;
CREATE TRIGGER withdrawal_insert_trigger
AFTER INSERT ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.handle_withdrawal_insert();

CREATE OR REPLACE FUNCTION public.handle_withdrawal_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur_total numeric;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NEW.status = 'approved' THEN
    SELECT COALESCE(main_balance,0)+COALESCE(profit_balance,0) INTO cur_total
      FROM public.profiles WHERE id=NEW.user_id;
    INSERT INTO public.transactions(user_id, type, amount, balance_after, description)
    VALUES (NEW.user_id,'withdrawal_approved',NEW.amount,COALESCE(cur_total,0),
            'Withdrawal of $'||NEW.amount::text||' approved.');
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.profiles SET main_balance = COALESCE(main_balance,0)+NEW.amount
      WHERE id=NEW.user_id
      RETURNING (main_balance+profit_balance) INTO cur_total;
    INSERT INTO public.transactions(user_id, type, amount, balance_after, description)
    VALUES (NEW.user_id,'withdrawal_rejected',NEW.amount,COALESCE(cur_total,0),
            'Withdrawal of $'||NEW.amount::text||' rejected. Funds refunded.');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS withdrawal_status_change_trigger ON public.withdrawals;
CREATE TRIGGER withdrawal_status_change_trigger
AFTER UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.handle_withdrawal_status_change();

CREATE OR REPLACE FUNCTION public.invest_from_balance(_bundle_id uuid, _amount numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); cur_balance numeric; is_frozen boolean; rate numeric; inv_id uuid; new_balance numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Investment amount must be positive'; END IF;
  SELECT COALESCE(main_balance,0), COALESCE(investing_frozen,false)
    INTO cur_balance, is_frozen FROM public.profiles WHERE id=uid FOR UPDATE;
  IF is_frozen THEN RAISE EXCEPTION 'Investing is temporarily disabled on your account.'; END IF;
  IF _amount > cur_balance THEN RAISE EXCEPTION 'Insufficient available balance'; END IF;
  SELECT COALESCE(daily_growth_rate,0) INTO rate FROM public.bundles WHERE id=_bundle_id;
  IF rate IS NULL THEN RAISE EXCEPTION 'Bundle not found'; END IF;
  UPDATE public.profiles SET main_balance = main_balance - _amount
    WHERE id=uid RETURNING main_balance INTO new_balance;
  INSERT INTO public.user_investments(user_id, bundle_id, state, initial_amount, current_value, growth_percentage, matures_at)
  VALUES (uid, _bundle_id, 'active', _amount, _amount, rate, now() + interval '24 hours')
  RETURNING id INTO inv_id;
  INSERT INTO public.transactions(user_id, investment_id, type, amount, percentage_change, balance_after, description)
  VALUES (uid, inv_id, 'investment_started', _amount, rate, new_balance,
          'Investment of $'||_amount::text||' started.');
  RETURN inv_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.invest_from_balance(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_matured_investments()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); inv RECORD; profit numeric; new_main numeric; new_profit numeric; count_done integer := 0;
BEGIN
  IF uid IS NULL THEN RETURN 0; END IF;
  FOR inv IN
    SELECT ui.id, ui.initial_amount, ui.bundle_id,
           COALESCE(b.daily_growth_rate,0) AS rate, b.name AS bundle_name
    FROM public.user_investments ui
    JOIN public.bundles b ON b.id = ui.bundle_id
    WHERE ui.user_id = uid AND ui.state='active'
      AND ui.matures_at IS NOT NULL AND ui.matures_at <= now()
  LOOP
    profit := ROUND(inv.initial_amount * inv.rate / 100.0, 2);
    UPDATE public.profiles
      SET main_balance = main_balance + inv.initial_amount,
          profit_balance = profit_balance + profit
      WHERE id = uid RETURNING main_balance, profit_balance INTO new_main, new_profit;
    UPDATE public.user_investments
      SET state='completed', completed_at=now(),
          current_value = inv.initial_amount + profit, growth_percentage = inv.rate
      WHERE id = inv.id;
    INSERT INTO public.transactions(user_id, investment_id, type, amount, balance_after, description)
    VALUES (uid, inv.id, 'investment_completed', inv.initial_amount, new_main,
            inv.bundle_name||' completed. Principal returned.');
    INSERT INTO public.transactions(user_id, investment_id, type, amount, percentage_change, balance_after, description)
    VALUES (uid, inv.id, 'profit_added', profit, inv.rate, new_main + new_profit,
            'Profit of $'||profit::text||' added from '||inv.bundle_name||'.');
    count_done := count_done + 1;
  END LOOP;
  RETURN count_done;
END; $$;
GRANT EXECUTE ON FUNCTION public.complete_matured_investments() TO authenticated;
