import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate sync key
    const syncKey = req.headers.get("x-sync-key");
    const expectedKey = Deno.env.get("FINANCIAL_SYNC_KEY");
    if (expectedKey && syncKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { sheet_type, data } = body;

    if (!sheet_type || !data || !Array.isArray(data)) {
      return new Response(JSON.stringify({ error: "Invalid payload. Expected { sheet_type, data[] }" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPERACIONAL_USER_ID = "ebf8bfe5-490d-40ae-a6cd-a37ed430f069";

    let rowsImported = 0;

    if (sheet_type === "cashbook") {
      // Clear existing
      await supabase.from("financial_cashbook").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows = data.map((row: any) => ({
        data: row.data || row.Data,
        tipo: (row.tipo || row.Tipo || "SAÍDA").toUpperCase(),
        nivel1: row.nivel1 || row["Nível 1"] || row.nivel_1 || "",
        nivel2: row.nivel2 || row["Nível 2 (Conta)"] || row.nivel_2 || null,
        historico: row.historico || row["Histórico"] || null,
        valor: parseFloat(String(row.valor || row["Valor (R$)"] || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        forma_pagamento: row.forma_pagamento || row["Forma Pgto"] || null,
        banco_cartao: row.banco_cartao || row["Banco/Cartão"] || null,
        saldo_acumulado: row.saldo_acumulado != null ? parseFloat(String(row.saldo_acumulado || row["Saldo Acumulado"] || "0").replace(/[R$\s.]/g, "").replace(",", ".")) : null,
        observacoes: row.observacoes || row["Observações"] || null,
        uploaded_by: OPERACIONAL_USER_ID,
      }));

      const { error } = await supabase.from("financial_cashbook").insert(rows);
      if (error) throw error;
      rowsImported = rows.length;

    } else if (sheet_type === "payables") {
      await supabase.from("financial_payables").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows = data.map((row: any) => ({
        vencimento: row.vencimento || row.Vencimento,
        dias_vencer: parseInt(row.dias_vencer || row["Dias p/ Vencer"]) || null,
        status: (row.status || row.Status || "PENDENTE").toUpperCase(),
        nivel1: row.nivel1 || row["Nível 1"] || "",
        nivel2: row.nivel2 || row["Nível 2 (Conta)"] || null,
        fornecedor: row.fornecedor || row["Fornecedor/Credor"] || null,
        historico: row.historico || row["Histórico"] || null,
        valor: parseFloat(String(row.valor || row["Valor (R$)"] || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        forma_pagamento: row.forma_pagamento || row["Forma Pgto"] || null,
        banco_cartao: row.banco_cartao || row["Banco/Cartão"] || null,
        observacoes: row.observacoes || row["Observações"] || null,
        uploaded_by: OPERACIONAL_USER_ID,
      }));

      const { error } = await supabase.from("financial_payables").insert(rows);
      if (error) throw error;
      rowsImported = rows.length;

    } else if (sheet_type === "budget") {
      await supabase.from("financial_budget").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows = data.map((row: any) => ({
        codigo: row.codigo || row["Código"] || null,
        nivel1: row.nivel1 || row["Nível 1 - Grupo"] || "",
        nivel2: row.nivel2 || row["Nível 2 - Conta"] || null,
        jan: parseFloat(String(row.jan || row.Jan || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        fev: parseFloat(String(row.fev || row.Fev || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        mar: parseFloat(String(row.mar || row.Mar || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        abr: parseFloat(String(row.abr || row.Abr || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        mai: parseFloat(String(row.mai || row.Mai || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        jun: parseFloat(String(row.jun || row.Jun || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        jul: parseFloat(String(row.jul || row.Jul || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        ago: parseFloat(String(row.ago || row.Ago || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        set: parseFloat(String(row.set || row.Set || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        out: parseFloat(String(row.out || row.Out || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        nov: parseFloat(String(row.nov || row.Nov || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        dez: parseFloat(String(row.dez || row.Dez || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        total_anual: parseFloat(String(row.total_anual || row["TOTAL ANUAL"] || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0,
        uploaded_by: OPERACIONAL_USER_ID,
      }));

      const { error } = await supabase.from("financial_budget").insert(rows);
      if (error) throw error;
      rowsImported = rows.length;

    } else {
      return new Response(JSON.stringify({ error: `Unknown sheet_type: ${sheet_type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track upload
    await supabase.from("financial_uploads").insert({
      file_name: `Google Sheets Sync - ${sheet_type}`,
      sheet_type,
      rows_imported: rowsImported,
      uploaded_by: OPERACIONAL_USER_ID,
    });

    return new Response(JSON.stringify({ success: true, rows_imported: rowsImported, sheet_type }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("financial-sync error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
