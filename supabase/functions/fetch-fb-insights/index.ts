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
    const FACEBOOK_ACCESS_TOKEN = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
    if (!FACEBOOK_ACCESS_TOKEN) {
      throw new Error("FACEBOOK_ACCESS_TOKEN is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables not configured");
    }

    const { accountId, workspaceId } = await req.json();
    if (!accountId) {
      throw new Error("accountId is required");
    }

    // Fetch from Meta Graph API
    const fbUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=account&fields=account_id,account_name,spend,impressions,clicks,ctr&date_preset=this_month&access_token=${FACEBOOK_ACCESS_TOKEN}`;

    const fbResponse = await fetch(fbUrl);
    const fbData = await fbResponse.json();

    if (fbData.error) {
      throw new Error(`Meta API Error: ${fbData.error.message}`);
    }

    const insights = fbData.data || [];

    if (insights.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No data returned from Meta API", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert into Supabase using service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const rows = insights.map((item: any) => ({
      account_id: item.account_id,
      account_name: item.account_name || accountId,
      date_start: item.date_start,
      spend: parseFloat(item.spend) || 0,
      impressions: parseInt(item.impressions) || 0,
      clicks: parseInt(item.clicks) || 0,
      ctr: parseFloat(item.ctr) || 0,
      workspace_id: workspaceId || null,
    }));

    const { error: upsertError } = await supabase
      .from("facebook_metrics")
      .upsert(rows, { onConflict: "account_id,date_start" });

    if (upsertError) {
      throw new Error(`Upsert error: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, count: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in fetch-fb-insights:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
