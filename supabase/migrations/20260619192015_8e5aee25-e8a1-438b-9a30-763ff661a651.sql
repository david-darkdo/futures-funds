GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.mask_email(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.invest_from_balance(uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_matured_investments() TO authenticated, service_role;