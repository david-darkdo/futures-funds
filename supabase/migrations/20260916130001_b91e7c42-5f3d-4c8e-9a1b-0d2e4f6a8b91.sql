-- Migration: 20260916120000_investment_lifecycle_and_user_state.sql
-- Description: Server-authoritative investment lifecycle, unified settlement engine, double-completion protection,
--              pause/resume with maturity extension, controlled balance/profit adjustments, 3-tier ranking, and targeted notifications.

-- 1. Extend user_investments table with deterministic lifecycle columns
ALTER TABLE public.user_investments
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS pause_reason text,
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS completion_reason text,
  ADD COLUMN IF NOT EXISTS last_calculated_at timestamptz DEFAULT now();

-- 2. Create rank_tiers table
CREATE TABLE IF NOT EXISTS public.rank_tiers (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  description text,
  badge_color text NOT NULL,
  priority int NOT NULL,
  min_invested numeric NOT NULL DEFAULT 0,
  min_profit numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rank_tiers TO authenticated, anon;
GRANT ALL ON public.rank_tiers TO service_role;
ALTER TABLE public.rank_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rank tiers are viewable by all authenticated" ON public.rank_tiers;
CREATE POLICY "Rank tiers are viewable by all authenticated" ON public.rank_tiers
  FOR SELECT TO authenticated USING (true);

-- Seed default rank tiers if not present
INSERT INTO public.rank_tiers (id, display_name, description, badge_color, priority, min_invested, min_profit, enabled)
VALUES
  ('bronze', 'Bronze Member', 'Standard investor tier', '#CD7F32', 1, 0, 0, true),
  ('silver', 'Silver Member', 'Preferred investor tier with higher volume', '#C0C0C0', 2, 1000, 250, true),
  ('gold', 'Gold Member', 'Elite premium investor tier', '#FFD700', 3, 5000, 1000, true)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  badge_color = EXCLUDED.badge_color,
  priority = EXCLUDED.priority,
  min_invested = EXCLUDED.min_invested,
  min_profit = EXCLUDED.min_profit;

-- 3. Extend profiles with ranking columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calculated_rank text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS manual_rank text REFERENCES public.rank_tiers(id),
  ADD COLUMN IF NOT EXISTS effective_rank text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS rank_updated_at timestamptz DEFAULT now();

-- 4. Helper to recalculate user rank
CREATE OR REPLACE FUNCTION public.recalculate_user_rank(_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total_inv numeric := 0;
  total_prof numeric := 0;
  new_calc_rank text := 'bronze';
  cur_manual text;
  final_effective text;
BEGIN
  -- Aggregate total invested across active + completed investments
  SELECT COALESCE(SUM(initial_amount), 0)
    INTO total_inv
    FROM public.user_investments
    WHERE user_id = _user_id AND state IN ('active'::public.investment_state, 'completed'::public.investment_state);

  -- Get current realized profit
  SELECT COALESCE(profit_balance, 0), manual_rank
    INTO total_prof, cur_manual
    FROM public.profiles
    WHERE id = _user_id;

  -- Determine calculated rank from configured tiers
  SELECT id INTO new_calc_rank
    FROM public.rank_tiers
    WHERE enabled = true
      AND min_invested <= total_inv
    ORDER BY priority DESC, min_invested DESC
    LIMIT 1;

  IF new_calc_rank IS NULL THEN
    new_calc_rank := 'bronze';
  END IF;

  final_effective := COALESCE(cur_manual, new_calc_rank);

  UPDATE public.profiles
    SET calculated_rank = new_calc_rank,
        effective_rank = final_effective,
        rank_updated_at = now()
    WHERE id = _user_id;

  RETURN final_effective;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_user_rank(uuid) TO authenticated;
