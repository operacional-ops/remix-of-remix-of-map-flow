
-- Tabela para métricas detalhadas por campanha do Meta Ads
CREATE TABLE public.facebook_campaign_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id),
  account_id TEXT NOT NULL,
  account_name TEXT,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  adset_id TEXT,
  adset_name TEXT,
  status TEXT,
  date_start DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cpa NUMERIC DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  frequency NUMERIC DEFAULT 0,
  objective TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT facebook_campaign_unique UNIQUE (campaign_id, date_start)
);

-- RLS
ALTER TABLE public.facebook_campaign_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view campaign insights"
  ON public.facebook_campaign_insights FOR SELECT
  USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = facebook_campaign_insights.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert campaign insights"
  ON public.facebook_campaign_insights FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update campaign insights"
  ON public.facebook_campaign_insights FOR UPDATE
  USING (true);
