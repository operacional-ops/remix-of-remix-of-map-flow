
-- RPC that aggregates Meta Ads + PayT data for the DRX Intelligence dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_data(
  p_workspace_id uuid,
  p_date_start text DEFAULT NULL,
  p_date_end text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
  v_kpis jsonb;
  v_campaigns jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  
  -- Check workspace membership
  IF NOT user_is_workspace_member(v_user_id, p_workspace_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Build KPIs from facebook_metrics + payt_transactions
  SELECT jsonb_build_object(
    'valor_investido', COALESCE(SUM(fm.spend), 0),
    'impressions', COALESCE(SUM(fm.impressions), 0),
    'clicks', COALESCE(SUM(fm.clicks), 0)
  ) INTO v_kpis
  FROM facebook_metrics fm
  WHERE fm.workspace_id = p_workspace_id
    AND (p_date_start IS NULL OR fm.date_start >= p_date_start)
    AND (p_date_end IS NULL OR fm.date_start <= p_date_end);

  -- Add PayT KPIs
  v_kpis := v_kpis || (
    SELECT jsonb_build_object(
      'vendas_totais', COUNT(*) FILTER (WHERE pt.status IN ('approved', 'pending', 'expired')),
      'vendas_aprovadas', COUNT(*) FILTER (WHERE pt.status = 'approved'),
      'faturamento_aprovado', COALESCE(SUM(pt.amount) FILTER (WHERE pt.status = 'approved'), 0),
      'vendas_pendentes', COUNT(*) FILTER (WHERE pt.status IN ('pending', 'expired')),
      'vendas_canceladas', COUNT(*) FILTER (WHERE pt.status IN ('cancelled', 'refunded', 'chargeback')),
      'ticket_medio', CASE 
        WHEN COUNT(*) FILTER (WHERE pt.status = 'approved') > 0 
        THEN COALESCE(SUM(pt.amount) FILTER (WHERE pt.status = 'approved'), 0) / COUNT(*) FILTER (WHERE pt.status = 'approved')
        ELSE 0 
      END
    )
    FROM payt_transactions pt
    WHERE pt.workspace_id = p_workspace_id
      AND (p_date_start IS NULL OR COALESCE(pt.paid_at, pt.created_at)::date >= p_date_start::date)
      AND (p_date_end IS NULL OR COALESCE(pt.paid_at, pt.created_at)::date <= p_date_end::date)
  );

  -- Calculate ROAS
  v_kpis := v_kpis || jsonb_build_object(
    'roas_real', CASE 
      WHEN (v_kpis->>'valor_investido')::numeric > 0 
      THEN ROUND(((v_kpis->>'faturamento_aprovado')::numeric / (v_kpis->>'valor_investido')::numeric)::numeric, 2)
      ELSE NULL 
    END
  );

  -- Build campaigns array (Meta + PayT matched via utm_id)
  SELECT COALESCE(jsonb_agg(campaign_row ORDER BY (campaign_row->>'spend')::numeric DESC), '[]'::jsonb)
  INTO v_campaigns
  FROM (
    SELECT jsonb_build_object(
      'campaign_id', fci.campaign_id,
      'campaign_name', MAX(fci.campaign_name),
      'status', MAX(fci.status),
      'meta', jsonb_build_object(
        'spend', COALESCE(SUM(fci.spend), 0),
        'impressions', COALESCE(SUM(fci.impressions), 0),
        'clicks', COALESCE(SUM(fci.clicks), 0),
        'reach', COALESCE(SUM(fci.reach), 0),
        'conversions', COALESCE(SUM(fci.conversions), 0)
      ),
      'payt', jsonb_build_object(
        'vendas_totais', COALESCE(payt_agg.vendas_totais, 0),
        'vendas_aprovadas', COALESCE(payt_agg.vendas_aprovadas, 0),
        'faturamento_aprovado', COALESCE(payt_agg.faturamento_aprovado, 0)
      ),
      'roas', CASE 
        WHEN COALESCE(SUM(fci.spend), 0) > 0 AND COALESCE(payt_agg.faturamento_aprovado, 0) > 0
        THEN ROUND((COALESCE(payt_agg.faturamento_aprovado, 0) / SUM(fci.spend))::numeric, 2)
        ELSE NULL
      END
    ) AS campaign_row
    FROM facebook_campaign_insights fci
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*) FILTER (WHERE pt2.status IN ('approved', 'pending', 'expired')) AS vendas_totais,
        COUNT(*) FILTER (WHERE pt2.status = 'approved') AS vendas_aprovadas,
        COALESCE(SUM(pt2.amount) FILTER (WHERE pt2.status = 'approved'), 0) AS faturamento_aprovado
      FROM payt_transactions pt2
      WHERE pt2.workspace_id = p_workspace_id
        AND (pt2.raw_payload->'link'->'query_params'->>'utm_id') = fci.campaign_id
        AND (p_date_start IS NULL OR COALESCE(pt2.paid_at, pt2.created_at)::date >= p_date_start::date)
        AND (p_date_end IS NULL OR COALESCE(pt2.paid_at, pt2.created_at)::date <= p_date_end::date)
    ) payt_agg ON true
    WHERE fci.workspace_id = p_workspace_id
      AND (p_date_start IS NULL OR fci.date_start >= p_date_start)
      AND (p_date_end IS NULL OR fci.date_start <= p_date_end)
    GROUP BY fci.campaign_id, payt_agg.vendas_totais, payt_agg.vendas_aprovadas, payt_agg.faturamento_aprovado
  ) sub;

  -- Build final result
  v_result := jsonb_build_object(
    'kpis', v_kpis,
    'campaigns', v_campaigns,
    'generated_at', now()
  );

  RETURN v_result;
END;
$$;
