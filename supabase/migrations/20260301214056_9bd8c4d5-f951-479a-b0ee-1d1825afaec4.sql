
-- Drop the restrictive policy that blocks non-admin users
DROP POLICY "Anyone can view active bundles" ON public.bundles;

-- Recreate as PERMISSIVE so non-admin users can see active bundles
CREATE POLICY "Anyone can view active bundles"
ON public.bundles
FOR SELECT
USING (active = true);
