
-- Add last_login_at to profiles for login alert logic
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone DEFAULT NULL;
