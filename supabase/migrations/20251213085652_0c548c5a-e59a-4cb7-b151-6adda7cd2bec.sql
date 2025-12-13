-- Add daily growth rate to bundles table
ALTER TABLE public.bundles ADD COLUMN daily_growth_rate numeric DEFAULT 0.5;

-- Update existing bundles with different growth rates
UPDATE public.bundles SET daily_growth_rate = 0.35 WHERE slug = 'starter';
UPDATE public.bundles SET daily_growth_rate = 0.55 WHERE slug = 'pro';
UPDATE public.bundles SET daily_growth_rate = 0.75 WHERE slug = 'institutional';