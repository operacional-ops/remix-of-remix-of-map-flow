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

    // Validate postback key (optional - only reject if both exist and mismatch)
    const paytKey = Deno.env.get('PAYT_POSTBACK_KEY');
    const receivedKey = String(payload.chave_unica || payload.token || '').trim();
    const queryToken = (new URL(req.url).searchParams.get('token') || '').trim();

    // Log for debugging
    console.log(`Key validation: paytKey=${paytKey ? 'SET' : 'NOT_SET'}, received=${receivedKey ? 'YES' : 'NO'}, query=${queryToken ? 'YES' : 'NO'}`);

    // Skip validation if no key is configured or no key was sent
    if (paytKey && paytKey.trim() !== '' && (receivedKey || queryToken)) {
      const keyMatch = receivedKey === paytKey.trim() || queryToken === paytKey.trim();
      if (!keyMatch) {
        console.log('Invalid PAYT postback key');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get workspace_id from query params or use default
    const workspaceId = new URL(req.url).searchParams.get('workspace') || '1dc2a772-4acc-4a12-a86f-21ac77471460';

    // Extract PAYT transaction data - handle various field name formats
    const transactionId = String(payload.transaction || payload.transaction_id || payload.codigo_transacao || payload.id || '');
    const status = mapPaytStatus(String(payload.status || payload.transaction_status || payload.status_transacao || ''));
    const amount = parseNumber(payload.valor || payload.amount || payload.transaction_amount || payload.preco || 0);
    const commission = parseNumber(payload.comissao || payload.commission || 0);
    const netAmount = parseNumber(payload.valor_liquido || payload.net_amount || (amount - commission));
    const customerName = String(payload.nome || payload.customer_name || payload.nome_completo || payload.comprador_nome || '');
    const customerEmail = String(payload.email || payload.customer_email || payload.comprador_email || '');
    const customerPhone = String(payload.telefone || payload.phone || payload.celular || payload.comprador_telefone || '');
    const productName = String(payload.produto || payload.product_name || payload.prod_name || payload.nome_produto || '');
    const productCode = String(payload.produto_codigo || payload.product_code || payload.prod_code || payload.codigo_produto || '');
    const paymentMethod = String(payload.forma_pagamento || payload.payment_method || payload.metodo_pagamento || '');

    // Determine paid_at / refunded_at
    const now = new Date().toISOString();
    const paidAt = ['approved', 'completed', 'paid'].includes(status) ? (String(payload.data_pagamento || payload.paid_at || now)) : null;
    const refundedAt = ['refunded', 'chargeback'].includes(status) ? now : null;

    // Upsert transaction (update if same transaction_id exists)
    if (transactionId) {
      const { data: existing } = await supabase
        .from('payt_transactions')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('payt_transactions')
          .update({
            status,
            amount,
            commission,
            net_amount: netAmount,
            payment_method: paymentMethod,
            paid_at: paidAt,
            refunded_at: refundedAt,
            raw_payload: payload,
          })
          .eq('id', existing.id);

        console.log(`PAYT transaction updated: ${transactionId} -> ${status}`);
      } else {
        await supabase
          .from('payt_transactions')
          .insert({
            workspace_id: workspaceId,
            transaction_id: transactionId,
            status,
            customer_name: customerName || null,
            customer_email: customerEmail || null,
            customer_phone: customerPhone || null,
            product_name: productName || null,
            product_code: productCode || null,
            payment_method: paymentMethod || null,
            amount,
            commission,
            net_amount: netAmount,
            paid_at: paidAt,
            refunded_at: refundedAt,
            raw_payload: payload,
          });

        console.log(`PAYT transaction created: ${transactionId} -> ${status}`);
      }
    } else {
      // No transaction_id, just insert
      await supabase
        .from('payt_transactions')
        .insert({
          workspace_id: workspaceId,
          status,
          customer_name: customerName || null,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          product_name: productName || null,
          product_code: productCode || null,
          payment_method: paymentMethod || null,
          amount,
          commission,
          net_amount: netAmount,
          paid_at: paidAt,
          refunded_at: refundedAt,
          raw_payload: payload,
        });

      console.log(`PAYT transaction created (no ID) -> ${status}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Postback processed',
      status,
      transaction_id: transactionId,
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

function mapPaytStatus(raw: string): string {
  const normalized = raw.toLowerCase().trim();
  if (['aprovado', 'approved', 'pago', 'paid', 'finalizada', 'completed', 'complete'].includes(normalized)) return 'approved';
  if (['aguardando', 'waiting', 'pending', 'aguardando_pagamento', 'waiting_payment'].includes(normalized)) return 'pending';
  if (['cancelado', 'cancelled', 'canceled', 'cancelada'].includes(normalized)) return 'cancelled';
  if (['reembolsado', 'refunded', 'refund', 'estornado', 'estorno'].includes(normalized)) return 'refunded';
  if (['chargeback', 'disputa', 'dispute'].includes(normalized)) return 'chargeback';
  if (['expirado', 'expired'].includes(normalized)) return 'expired';
  return normalized || 'unknown';
}

function parseNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[R$\s]/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}
