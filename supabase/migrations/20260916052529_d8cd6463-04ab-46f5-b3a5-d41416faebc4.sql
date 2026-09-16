DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.signature);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.invest_from_balance(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_matured_investments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_apply_growth(uuid, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_investment_state(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_withdrawal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_withdrawal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_investing_frozen(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
