
-- Add min_invest and max_invest columns to bundles table
ALTER TABLE public.bundles 
ADD COLUMN min_invest numeric DEFAULT 0,
ADD COLUMN max_invest numeric DEFAULT 0;

-- Update existing bundles with sensible defaults based on current price_usd
UPDATE public.bundles SET min_invest = price_usd, max_invest = price_usd * 2 WHERE min_invest = 0;
