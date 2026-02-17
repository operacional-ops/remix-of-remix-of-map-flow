import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables not configured");
    }

    const { accountId, workspaceId, datePreset, accessToken } = await req.json();
    if (!accountId) {
      throw new Error("accountId is required");
    }

    // Use ONLY per-user token from Facebook login
    const token = accessToken;
    if (!token) {
      throw new Error("No Facebook access token available. Please connect your Facebook profile first.");
    }

    const preset = datePreset || "maximum";

    // 1. Fetch account-level insights
    const accountFields = "account_id,account_name,spend,impressions,clicks,ctr";
    const accountUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=account&fields=${accountFields}&date_preset=${preset}&time_increment=1&access_token=${token}&limit=500`;

    const accountResponse = await fetch(accountUrl);
    const accountData = await accountResponse.json();

    if (accountData.error) {
      throw new Error(`Meta API Error: ${accountData.error.message}`);
    }

    // 2. Fetch campaign-level insights
    const campaignFields = "campaign_id,campaign_name,account_id,account_name,spend,impressions,clicks,reach,ctr,cpm,cpc,actions,cost_per_action_type,objective";
    const campaignUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=campaign&fields=${campaignFields}&date_preset=${preset}&time_increment=1&access_token=${token}&limit=500`;

    const campaignResponse = await fetch(campaignUrl);
    const campaignData = await campaignResponse.json();

    if (campaignData.error) {
      throw new Error(`Meta API Error (campaigns): ${campaignData.error.message}`);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Upsert account-level data
    const accountInsights = accountData.data || [];
    let accountCount = 0;
    if (accountInsights.length > 0) {
      const accountRows = accountInsights.map((item: any) => ({
        account_id: item.account_id,
        account_name: item.account_name || accountId,
        date_start: item.date_start,
        spend: parseFloat(item.spend) || 0,
        impressions: parseInt(item.impressions) || 0,
        clicks: parseInt(item.clicks) || 0,
        ctr: parseFloat(item.ctr) || 0,
        workspace_id: workspaceId || null,
      }));

      const { error: accountError } = await supabase
        .from("facebook_metrics")
        .upsert(accountRows, { onConflict: "account_id,date_start" });

      if (accountError) {
        console.error("Account upsert error:", accountError);
      }
      accountCount = accountRows.length;
    }

    // Upsert campaign-level data
    const campaignInsights = campaignData.data || [];
    let campaignCount = 0;
    if (campaignInsights.length > 0) {
      const campaignRows = campaignInsights.map((item: any) => {
        const actions = item.actions || [];
        const purchaseAction = actions.find((a: any) =>
          a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        const leadAction = actions.find((a: any) => a.action_type === 'lead');
        const conversions = parseInt(purchaseAction?.value || leadAction?.value || '0');

        const costPerAction = item.cost_per_action_type || [];
        const purchaseCost = costPerAction.find((a: any) =>
          a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        const leadCost = costPerAction.find((a: any) => a.action_type === 'lead');
        const cpa = parseFloat(purchaseCost?.value || leadCost?.value || '0');

        const spend = parseFloat(item.spend) || 0;
        const purchaseValueAction = actions.find((a: any) => a.action_type === 'omni_purchase');
        const roas = spend > 0 && purchaseValueAction ? parseFloat(purchaseValueAction.value) / spend : 0;

        return {
          account_id: item.account_id || accountId.replace('act_', ''),
          account_name: item.account_name || accountId,
          campaign_id: item.campaign_id,
          campaign_name: item.campaign_name,
          status: 'active',
          date_start: item.date_start,
          spend,
          impressions: parseInt(item.impressions) || 0,
          clicks: parseInt(item.clicks) || 0,
          reach: parseInt(item.reach) || 0,
          ctr: parseFloat(item.ctr) || 0,
          cpm: parseFloat(item.cpm) || 0,
          cpc: parseFloat(item.cpc) || 0,
          cpa,
          conversions,
          roas,
          frequency: 0,
          objective: item.objective || null,
          workspace_id: workspaceId || null,
        };
      });

      const { error: campaignError } = await supabase
        .from("facebook_campaign_insights")
        .upsert(campaignRows, { onConflict: "campaign_id,date_start" });

      if (campaignError) {
        console.error("Campaign upsert error:", campaignError);
      }
      campaignCount = campaignRows.length;
    }

    // 3. Fetch campaign statuses
    const campaignsUrl = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=id,name,status,objective&access_token=${token}&limit=500`;
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();

    if (!campaignsData.error && campaignsData.data) {
      for (const campaign of campaignsData.data) {
        await supabase
          .from("facebook_campaign_insights")
          .update({
            status: campaign.status?.toLowerCase() || 'unknown',
            campaign_name: campaign.name,
            objective: campaign.objective,
          })
          .eq("campaign_id", campaign.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        accountCount,
        campaignCount,
        message: `${accountCount} account records, ${campaignCount} campaign records synced.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-fb-insights:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
