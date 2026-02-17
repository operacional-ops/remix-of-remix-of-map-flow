import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_DATE_PRESETS: Record<string, string> = {
  today: "today",
  yesterday: "yesterday",
  last_7d: "last_7d",
  last_14d: "last_14d",
  last_28d: "last_28d",
  last_30d: "last_30d",
  this_month: "this_month",
  last_month: "last_month",
  last_90d: "last_90d",
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
  const actionValues = item.action_values || [];
  const purchaseValue = actionValues.find((a: any) =>
    a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'omni_purchase'
  );
  const roas = spend > 0 && purchaseValue ? parseFloat(purchaseValue.value) / spend : 0;

  return { conversions, cpa, roas, spend };
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url);
    const json = await response.json();

    if (json.error) {
      const code = json.error.code || 0;
      const msg = json.error.message || 'Unknown error';

      if ((code === 1 || code === 2) && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.log(`Transient Meta error (code ${code}), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (code === 100 || code === 10) {
        throw new Error(`Sem permissão para acessar esta conta. Verifique as permissões no Facebook. (Meta code: ${code})`);
      }
      if (code === 190) {
        throw new Error(`Token do Facebook expirado. Desconecte e reconecte seu perfil. (Meta code: ${code})`);
      }
      if (code === 17 || code === 4) {
        if (attempt < maxRetries - 1) {
          const delay = 10000 + Math.random() * 5000;
          console.log(`Rate limited, waiting ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(`Limite de requisições da Meta atingido. Aguarde alguns minutos. (Meta code: ${code})`);
      }
      throw new Error(`Meta API Error: ${msg} (code: ${code})`);
    }

    return json;
  }
  throw new Error("Max retries exceeded");
}

async function fetchAllPages(url: string): Promise<any[]> {
  const allData: any[] = [];
  let nextUrl: string | null = url;
  let pageCount = 0;
  const maxPages = 50;

  while (nextUrl && pageCount < maxPages) {
    const json = await fetchWithRetry(nextUrl);
    if (json.data) {
      allData.push(...json.data);
    }
    nextUrl = json.paging?.next || null;
    pageCount++;
  }

  return allData;
}

async function batchUpsert(supabase: any, table: string, rows: any[], conflictKey: string, batchSize = 500) {
  const promises = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    promises.push(
      supabase.from(table).upsert(batch, { onConflict: conflictKey })
        .then(({ error }: any) => { if (error) console.error(`Upsert error in ${table}:`, error); })
    );
  }
  await Promise.all(promises);
}

function buildDateParam(datePreset: string): string {
  const mapped = META_DATE_PRESETS[datePreset];
  if (mapped) {
    return `date_preset=${mapped}`;
  }
  const today = new Date();
  const twoYearsAgo = new Date(today);
  twoYearsAgo.setFullYear(today.getFullYear() - 2);
  const since = twoYearsAgo.toISOString().split('T')[0];
  const until = today.toISOString().split('T')[0];
  return `time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`;
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

    let { accountId, workspaceId, datePreset, accessToken } = await req.json();
    if (!accountId) throw new Error("accountId is required");
    if (!accountId.startsWith('act_')) accountId = `act_${accountId}`;
    if (!accessToken) throw new Error("Conecte seu perfil do Facebook primeiro.");

    const preset = datePreset || "last_28d";
    const dateParam = buildDateParam(preset);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const actionFields = "actions,cost_per_action_type,action_values";
    const apiVersion = "v21.0";

    // 1. Account-level (fast, small payload)
    const accountFields = `account_id,account_name,spend,impressions,clicks,ctr`;
    const accountUrl = `https://graph.facebook.com/${apiVersion}/${accountId}/insights?level=account&fields=${accountFields}&${dateParam}&time_increment=1&access_token=${accessToken}&limit=500`;
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
      await batchUpsert(supabase, "facebook_metrics", accountRows, "account_id,date_start");
      accountCount = accountRows.length;
    }

    // 2. Campaign + Adset + Ad — PARALLEL fetch from Meta
    const campaignFields = `campaign_id,campaign_name,account_id,account_name,spend,impressions,clicks,reach,ctr,cpm,cpc,${actionFields},objective`;
    const adsetFields = `campaign_id,campaign_name,adset_id,adset_name,account_id,account_name,spend,impressions,clicks,reach,ctr,cpm,cpc,${actionFields},objective`;
    const adFields = `campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,account_id,account_name,spend,impressions,clicks,reach,ctr,cpm,cpc,${actionFields},objective`;

    const [campaignInsights, adsetInsights, adInsights] = await Promise.all([
      fetchAllPages(`https://graph.facebook.com/${apiVersion}/${accountId}/insights?level=campaign&fields=${campaignFields}&${dateParam}&time_increment=1&access_token=${accessToken}&limit=500`),
      fetchAllPages(`https://graph.facebook.com/${apiVersion}/${accountId}/insights?level=adset&fields=${adsetFields}&${dateParam}&time_increment=1&access_token=${accessToken}&limit=500`),
      fetchAllPages(`https://graph.facebook.com/${apiVersion}/${accountId}/insights?level=ad&fields=${adFields}&${dateParam}&time_increment=1&access_token=${accessToken}&limit=500`),
    ]);

    // 3. Transform & upsert in parallel
    const campaignRows = campaignInsights.map((item: any) => {
      const { conversions, cpa, roas, spend } = parseActions(item);
      return {
        account_id: item.account_id || accountId.replace('act_', ''),
        account_name: item.account_name || accountId,
        campaign_id: item.campaign_id, campaign_name: item.campaign_name,
        status: 'active', date_start: item.date_start,
        spend, impressions: parseInt(item.impressions) || 0,
        clicks: parseInt(item.clicks) || 0, reach: parseInt(item.reach) || 0,
        ctr: parseFloat(item.ctr) || 0, cpm: parseFloat(item.cpm) || 0,
        cpc: parseFloat(item.cpc) || 0, cpa, conversions, roas,
        frequency: 0, objective: item.objective || null,
        workspace_id: workspaceId || null,
      };
    });

    const adsetRows = adsetInsights.map((item: any) => {
      const { conversions, cpa, roas, spend } = parseActions(item);
      return {
        account_id: item.account_id || accountId.replace('act_', ''),
        account_name: item.account_name || accountId,
        campaign_id: item.campaign_id, campaign_name: item.campaign_name,
        adset_id: item.adset_id, adset_name: item.adset_name,
        status: 'active', date_start: item.date_start,
        spend, impressions: parseInt(item.impressions) || 0,
        clicks: parseInt(item.clicks) || 0, reach: parseInt(item.reach) || 0,
        ctr: parseFloat(item.ctr) || 0, cpm: parseFloat(item.cpm) || 0,
        cpc: parseFloat(item.cpc) || 0, cpa, conversions, roas,
        frequency: 0, objective: item.objective || null,
        workspace_id: workspaceId || null,
      };
    });

    const adRows = adInsights.map((item: any) => {
      const { conversions, cpa, roas, spend } = parseActions(item);
      return {
        account_id: item.account_id || accountId.replace('act_', ''),
        account_name: item.account_name || accountId,
        campaign_id: item.campaign_id, campaign_name: item.campaign_name,
        adset_id: item.adset_id, adset_name: item.adset_name,
        ad_id: item.ad_id, ad_name: item.ad_name,
        status: 'active', date_start: item.date_start,
        spend, impressions: parseInt(item.impressions) || 0,
        clicks: parseInt(item.clicks) || 0, reach: parseInt(item.reach) || 0,
        ctr: parseFloat(item.ctr) || 0, cpm: parseFloat(item.cpm) || 0,
        cpc: parseFloat(item.cpc) || 0, cpa, conversions, roas,
        frequency: 0, objective: item.objective || null,
        workspace_id: workspaceId || null,
      };
    });

    // Parallel DB upserts
    await Promise.all([
      campaignRows.length > 0 ? batchUpsert(supabase, "facebook_campaign_insights", campaignRows, "campaign_id,date_start") : Promise.resolve(),
      adsetRows.length > 0 ? batchUpsert(supabase, "facebook_adset_insights", adsetRows, "adset_id,date_start") : Promise.resolve(),
      adRows.length > 0 ? batchUpsert(supabase, "facebook_ad_insights", adRows, "ad_id,date_start") : Promise.resolve(),
    ]);

    const campaignCount = campaignRows.length;
    const adsetCount = adsetRows.length;
    const adCount = adRows.length;

    // 4. Fetch real statuses in parallel (non-blocking, best-effort)
    try {
      const [campaignsData, adsetsData, adsData] = await Promise.all([
        fetchAllPages(`https://graph.facebook.com/${apiVersion}/${accountId}/campaigns?fields=id,name,status,objective&access_token=${accessToken}&limit=500`).catch(() => []),
        fetchAllPages(`https://graph.facebook.com/${apiVersion}/${accountId}/adsets?fields=id,name,status,campaign_id&access_token=${accessToken}&limit=500`).catch(() => []),
        fetchAllPages(`https://graph.facebook.com/${apiVersion}/${accountId}/ads?fields=id,name,status,adset_id,campaign_id&access_token=${accessToken}&limit=500`).catch(() => []),
      ]);

      // Batch status updates by building maps and doing bulk updates
      const statusPromises: Promise<any>[] = [];
      
      // Group campaigns by status for bulk update
      const campaignsByStatus = new Map<string, string[]>();
      for (const c of campaignsData) {
        const status = c.status?.toLowerCase() || 'unknown';
        if (!campaignsByStatus.has(status)) campaignsByStatus.set(status, []);
        campaignsByStatus.get(status)!.push(c.id);
      }
      for (const [status, ids] of campaignsByStatus) {
        statusPromises.push(
          supabase.from("facebook_campaign_insights").update({ status }).in("campaign_id", ids)
        );
      }

      const adsetsByStatus = new Map<string, string[]>();
      for (const a of adsetsData) {
        const status = a.status?.toLowerCase() || 'unknown';
        if (!adsetsByStatus.has(status)) adsetsByStatus.set(status, []);
        adsetsByStatus.get(status)!.push(a.id);
      }
      for (const [status, ids] of adsetsByStatus) {
        statusPromises.push(
          supabase.from("facebook_adset_insights").update({ status }).in("adset_id", ids)
        );
      }

      const adsByStatus = new Map<string, string[]>();
      for (const a of adsData) {
        const status = a.status?.toLowerCase() || 'unknown';
        if (!adsByStatus.has(status)) adsByStatus.set(status, []);
        adsByStatus.get(status)!.push(a.id);
      }
      for (const [status, ids] of adsByStatus) {
        statusPromises.push(
          supabase.from("facebook_ad_insights").update({ status }).in("ad_id", ids)
        );
      }

      await Promise.allSettled(statusPromises);
    } catch (statusErr) {
      console.error("Error updating statuses:", statusErr);
    }

    return new Response(
      JSON.stringify({
        success: true, accountCount, campaignCount, adsetCount, adCount,
        message: `Sincronizado: ${accountCount} conta, ${campaignCount} campanhas, ${adsetCount} conjuntos, ${adCount} anúncios.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-fb-insights:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
