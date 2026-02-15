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
    const receivedKey = String(payload.integration_key || payload.chave_unica || payload.token || '').trim();
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

    // Extract PAYT transaction data - support nested format from real PAYT payloads
    const customer = (payload.customer || {}) as Record<string, unknown>;
    const product = (payload.product || {}) as Record<string, unknown>;
    const transaction = (payload.transaction || {}) as Record<string, unknown>;
    const commissionArr = (payload.commission || []) as Array<Record<string, unknown>>;

    const transactionId = String(payload.transaction_id || payload.cart_id || payload.codigo_transacao || payload.id || '');
    const status = mapPaytStatus(String(payload.status || (transaction.payment_status as string) || ''));
    
    // PAYT sends prices in cents (e.g. 133299 = R$ 1.332,99)
    const rawAmount = parseNumber(transaction.total_price || payload.valor || payload.amount || 0);
    const amount = rawAmount > 1000 ? rawAmount / 100 : rawAmount; // auto-detect cents
    
    // Sum commissions from array
    const totalCommission = Array.isArray(commissionArr) 
      ? commissionArr.reduce((s, c) => s + parseNumber(c.amount || 0), 0) / (rawAmount > 1000 ? 100 : 1)
      : parseNumber(payload.comissao || payload.commission || 0);
    const netAmount = amount - totalCommission;
    
    const customerName = String(customer.name || payload.nome || payload.customer_name || '');
    const customerEmail = String(customer.email || payload.email || payload.customer_email || '');
    const customerPhone = String(customer.phone || payload.telefone || payload.phone || '');
    const productName = String(product.name || payload.produto || payload.product_name || '');
    const productCode = String(product.code || payload.produto_codigo || payload.product_code || '');
    const paymentMethod = String(transaction.payment_method || payload.forma_pagamento || payload.payment_method || '');

    // Determine paid_at / refunded_at
    const now = new Date().toISOString();
    const paidAt = ['approved', 'completed', 'paid'].includes(status) ? String(transaction.paid_at || payload.data_pagamento || now) : null;
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
            commission: totalCommission,
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
            commission: totalCommission,
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
          commission: totalCommission,
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
