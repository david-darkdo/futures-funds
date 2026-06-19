
-- 1) Realtime: enable RLS on realtime.messages and only allow authenticated users to receive postgres_changes events
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive postgres_changes" ON realtime.messages;
CREATE POLICY "Authenticated can receive postgres_changes"
ON realtime.messages
FOR SELECT
TO authenticated
USING (extension = 'postgres_changes');

-- 2) Lock down SECURITY DEFINER functions: revoke from anon/public, keep authenticated only on the RPCs the app calls
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_matured_investments() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.invest_from_balance(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mask_email(text) FROM PUBLIC, anon;

-- Trigger-only functions: nobody should call them directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_withdrawal_balance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_payment_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_payment_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_withdrawal_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_withdrawal_status_change() FROM PUBLIC, anon, authenticated;

-- 3) Public buckets: drop the broad listing SELECT policies. Files remain reachable via their public CDN URLs.
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Email assets are publicly accessible" ON storage.objects;
