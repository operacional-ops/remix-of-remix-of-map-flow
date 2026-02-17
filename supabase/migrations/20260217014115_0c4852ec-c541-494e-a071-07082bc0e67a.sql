
-- Create facebook_adset_insights table
CREATE TABLE public.facebook_adset_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,
  account_name TEXT,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  adset_id TEXT NOT NULL,
  adset_name TEXT,
  status TEXT DEFAULT 'unknown',
  date_start TEXT NOT NULL,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cpa NUMERIC DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  frequency NUMERIC DEFAULT 0,
  objective TEXT,
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(adset_id, date_start)
);

-- Create facebook_ad_insights table
CREATE TABLE public.facebook_ad_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,
  account_name TEXT,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  adset_id TEXT,
  adset_name TEXT,
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  status TEXT DEFAULT 'unknown',
  date_start TEXT NOT NULL,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cpa NUMERIC DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  frequency NUMERIC DEFAULT 0,
  objective TEXT,
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ad_id, date_start)
);

-- Enable RLS
ALTER TABLE public.facebook_adset_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_ad_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for adset insights
CREATE POLICY "Authenticated users can view adset insights" ON public.facebook_adset_insights
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert adset insights" ON public.facebook_adset_insights
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update adset insights" ON public.facebook_adset_insights
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS policies for ad insights
CREATE POLICY "Authenticated users can view ad insights" ON public.facebook_ad_insights
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert ad insights" ON public.facebook_ad_insights
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update ad insights" ON public.facebook_ad_insights
  FOR UPDATE USING (auth.role() = 'authenticated');
