
-- Create facebook_metrics table
CREATE TABLE public.facebook_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,
  account_name TEXT,
  date_start DATE NOT NULL,
  spend NUMERIC DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  workspace_id UUID REFERENCES public.workspaces(id),
  CONSTRAINT facebook_metrics_unique UNIQUE (account_id, date_start)
);

-- Enable RLS
ALTER TABLE public.facebook_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies - workspace members can read
CREATE POLICY "Workspace members can view facebook_metrics"
ON public.facebook_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = facebook_metrics.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Authenticated users can insert/update (via edge function uses service role, but also allow direct)
CREATE POLICY "Workspace members can insert facebook_metrics"
ON public.facebook_metrics FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = facebook_metrics.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Workspace members can update facebook_metrics"
ON public.facebook_metrics FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = facebook_metrics.workspace_id
    AND wm.user_id = auth.uid()
  )
);
