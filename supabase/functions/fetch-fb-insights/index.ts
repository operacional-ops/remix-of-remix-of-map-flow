import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseActions(item: any) {
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

  return { conversions, cpa, roas, spend };
}

async function fetchAllPages(url: string): Promise<any[]> {
  const allData: any[] = [];
  let nextUrl: string | null = url;
  
  while (nextUrl) {
    const response = await fetch(nextUrl);
    const json = await response.json();
    
    if (json.error) {
      throw new Error(`Meta API Error: ${json.error.message}`);
    }
    
    if (json.data) {
      allData.push(...json.data);
    }
    
    nextUrl = json.paging?.next || null;
  }
  
  return allData;
}

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

    const token = accessToken;
    if (!token) {
      throw new Error("No Facebook access token available. Please connect your Facebook profile first.");
    }

    const preset = datePreset || "maximum";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch account-level insights
    const accountFields = "account_id,account_name,spend,impressions,clicks,ctr";
    const accountUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=account&fields=${accountFields}&date_preset=${preset}&time_increment=1&access_token=${token}&limit=500`;
    const accountInsights = await fetchAllPages(accountUrl);

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

      if (accountError) console.error("Account upsert error:", accountError);
      accountCount = accountRows.length;
    }

    // 2. Fetch campaign-level insights
    const campaignFields = "campaign_id,campaign_name,account_id,account_name,spend,impressions,clicks,reach,ctr,cpm,cpc,actions,cost_per_action_type,objective";
    const campaignUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=campaign&fields=${campaignFields}&date_preset=${preset}&time_increment=1&access_token=${token}&limit=500`;
    const campaignInsights = await fetchAllPages(campaignUrl);

    let campaignCount = 0;
    if (campaignInsights.length > 0) {
      const campaignRows = campaignInsights.map((item: any) => {
        const { conversions, cpa, roas, spend } = parseActions(item);
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

      if (campaignError) console.error("Campaign upsert error:", campaignError);
      campaignCount = campaignRows.length;
    }

    // 3. Fetch adset-level insights
    const adsetFields = "campaign_id,campaign_name,adset_id,adset_name,account_id,account_name,spend,impressions,clicks,reach,ctr,cpm,cpc,actions,cost_per_action_type,objective";
    const adsetUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=adset&fields=${adsetFields}&date_preset=${preset}&time_increment=1&access_token=${token}&limit=500`;
    const adsetInsights = await fetchAllPages(adsetUrl);

    let adsetCount = 0;
    if (adsetInsights.length > 0) {
      const adsetRows = adsetInsights.map((item: any) => {
        const { conversions, cpa, roas, spend } = parseActions(item);
        return {
          account_id: item.account_id || accountId.replace('act_', ''),
          account_name: item.account_name || accountId,
          campaign_id: item.campaign_id,
          campaign_name: item.campaign_name,
          adset_id: item.adset_id,
          adset_name: item.adset_name,
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

      const { error: adsetError } = await supabase
        .from("facebook_adset_insights")
        .upsert(adsetRows, { onConflict: "adset_id,date_start" });

      if (adsetError) console.error("Adset upsert error:", adsetError);
      adsetCount = adsetRows.length;
    }

    // 4. Fetch ad-level insights
    const adFields = "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,account_id,account_name,spend,impressions,clicks,reach,ctr,cpm,cpc,actions,cost_per_action_type,objective";
    const adUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=ad&fields=${adFields}&date_preset=${preset}&time_increment=1&access_token=${token}&limit=500`;
    const adInsights = await fetchAllPages(adUrl);

    let adCount = 0;
    if (adInsights.length > 0) {
      const adRows = adInsights.map((item: any) => {
        const { conversions, cpa, roas, spend } = parseActions(item);
        return {
          account_id: item.account_id || accountId.replace('act_', ''),
          account_name: item.account_name || accountId,
          campaign_id: item.campaign_id,
          campaign_name: item.campaign_name,
          adset_id: item.adset_id,
          adset_name: item.adset_name,
          ad_id: item.ad_id,
          ad_name: item.ad_name,
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

      const { error: adError } = await supabase
        .from("facebook_ad_insights")
        .upsert(adRows, { onConflict: "ad_id,date_start" });

      if (adError) console.error("Ad upsert error:", adError);
      adCount = adRows.length;
    }

    // 5. Fetch campaign/adset/ad statuses
    const campaignsUrl = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=id,name,status,objective&access_token=${token}&limit=500`;
    const campaignsData = await fetchAllPages(campaignsUrl).catch(() => []);

    for (const campaign of campaignsData) {
      await supabase
        .from("facebook_campaign_insights")
        .update({
          status: campaign.status?.toLowerCase() || 'unknown',
          campaign_name: campaign.name,
          objective: campaign.objective,
        })
        .eq("campaign_id", campaign.id);
    }

    // Fetch adset statuses
    const adsetsUrl = `https://graph.facebook.com/v19.0/${accountId}/adsets?fields=id,name,status,campaign_id&access_token=${token}&limit=500`;
    const adsetsData = await fetchAllPages(adsetsUrl).catch(() => []);

    for (const adset of adsetsData) {
      await supabase
        .from("facebook_adset_insights")
        .update({
          status: adset.status?.toLowerCase() || 'unknown',
          adset_name: adset.name,
        })
        .eq("adset_id", adset.id);
    }

    // Fetch ad statuses
    const adsUrl = `https://graph.facebook.com/v19.0/${accountId}/ads?fields=id,name,status,adset_id,campaign_id&access_token=${token}&limit=500`;
    const adsData = await fetchAllPages(adsUrl).catch(() => []);

    for (const ad of adsData) {
      await supabase
        .from("facebook_ad_insights")
        .update({
          status: ad.status?.toLowerCase() || 'unknown',
          ad_name: ad.name,
        })
        .eq("ad_id", ad.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        accountCount,
        campaignCount,
        adsetCount,
        adCount,
        message: `${accountCount} account, ${campaignCount} campaign, ${adsetCount} adset, ${adCount} ad records synced.`
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
