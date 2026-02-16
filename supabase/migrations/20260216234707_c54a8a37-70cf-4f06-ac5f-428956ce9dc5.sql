
-- Fix INSERT/UPDATE policies to only allow service role (not anon)
DROP POLICY IF EXISTS "Service role can insert campaign insights" ON public.facebook_campaign_insights;
DROP POLICY IF EXISTS "Service role can update campaign insights" ON public.facebook_campaign_insights;

-- Same fix for facebook_metrics
DROP POLICY IF EXISTS "Service role can manage facebook_metrics" ON public.facebook_metrics;
DROP POLICY IF EXISTS "Service role insert facebook_metrics" ON public.facebook_metrics;

-- Recreate: only authenticated workspace members can insert/update
CREATE POLICY "Workspace members can insert campaign insights"
  ON public.facebook_campaign_insights FOR INSERT
  WITH CHECK (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = facebook_campaign_insights.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update campaign insights"
  ON public.facebook_campaign_insights FOR UPDATE
  USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = facebook_campaign_insights.workspace_id
        AND wm.user_id = auth.uid()
    )
  );
