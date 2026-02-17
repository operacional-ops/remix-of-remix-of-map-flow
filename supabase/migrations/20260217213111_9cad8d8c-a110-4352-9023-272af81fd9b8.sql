
-- Add missing columns to facebook_metrics
ALTER TABLE public.facebook_metrics
  ADD COLUMN IF NOT EXISTS cpm numeric,
  ADD COLUMN IF NOT EXISTS cpc numeric,
  ADD COLUMN IF NOT EXISTS frequency numeric,
  ADD COLUMN IF NOT EXISTS purchases bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cpp numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reach bigint;

-- Add missing columns to facebook_campaign_insights
ALTER TABLE public.facebook_campaign_insights
  ADD COLUMN IF NOT EXISTS purchases bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cpp numeric DEFAULT 0;

-- Add missing columns to facebook_adset_insights
ALTER TABLE public.facebook_adset_insights
  ADD COLUMN IF NOT EXISTS purchases bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cpp numeric DEFAULT 0;

-- Add missing columns to facebook_ad_insights
ALTER TABLE public.facebook_ad_insights
  ADD COLUMN IF NOT EXISTS purchases bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cpp numeric DEFAULT 0;
