import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse the postback data from PAYT
    const rawBody = await req.text();
    let payload: Record<string, unknown>;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      // PAYT may send as form-urlencoded
      const params = new URLSearchParams(rawBody);
      payload = Object.fromEntries(params.entries());
    }

    console.log('PAYT Postback received:', JSON.stringify(payload));

    // Validate the postback key
    const paytKey = Deno.env.get('PAYT_POSTBACK_KEY');
    const receivedKey = (payload.chave_unica as string) || 
                        (payload.token as string) || 
                        new URL(req.url).searchParams.get('token');

    if (paytKey && receivedKey && receivedKey !== paytKey) {
      console.log('Invalid PAYT postback key');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store raw postback in webhook_inbox for debugging
    await supabase.from('webhook_inbox').insert({
      source: 'payt',
      headers: Object.fromEntries(
        [...req.headers.entries()].filter(([k]) => !['authorization'].includes(k.toLowerCase()))
      ),
      payload,
      status: 'received',
    });

    // Map PAYT status to our format
    const status = String(payload.status || payload.transaction_status || '').toLowerCase();
    const valor = Number(payload.valor || payload.amount || payload.transaction_amount || 0);
    const produto = String(payload.produto || payload.product_name || payload.prod_name || 'PAYT');
    const produtoCodigo = String(payload.produto_codigo || payload.product_code || payload.prod_code || 'PAYT');

    console.log(`PAYT event: status=${status}, valor=${valor}, produto=${produto}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Postback received',
      status,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PAYT postback error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
