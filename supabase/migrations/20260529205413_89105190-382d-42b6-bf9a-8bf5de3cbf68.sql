
REVOKE EXECUTE ON FUNCTION public.invest_from_balance(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_matured_investments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invest_from_balance(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_matured_investments() TO authenticated;
