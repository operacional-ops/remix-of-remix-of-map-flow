import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPREADSHEET_ID = "142zEXhlAYA22xGWIfNCAkzmgZEQ5-MaaOE2KJPH8b0c";
const OPERACIONAL_USER_ID = "ebf8bfe5-490d-40ae-a6cd-a37ed430f069";

function parseValue(val: string): number {
  if (!val || val === "-" || val === "") return 0;
  return parseFloat(val.replace(/[$,]/g, "").trim()) || 0;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Support both POST (push from Apps Script) and GET/POST with action=pull (pull from Sheets)
    let action = "pull";
    let body: any = {};

    if (req.method === "POST") {
      try {
        body = await req.json();
        action = body.action || (body.sheet_type ? "push" : "pull");
      } catch {
        action = "pull";
      }
    }

    // ===== PULL MODE: Fetch directly from Google Sheets =====
    if (action === "pull") {
      console.log("Pulling data from Google Sheets...");
      
      // Use gviz endpoint which works with "anyone with link" sharing
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;
      const csvResponse = await fetch(csvUrl);
      
      if (!csvResponse.ok) {
        throw new Error(`Failed to fetch spreadsheet: ${csvResponse.status} ${csvResponse.statusText}`);
      }

      const csvText = await csvResponse.text();
      const lines = csvText.split("\n").filter(l => l.trim());
      
      if (lines.length < 2) {
        return new Response(JSON.stringify({ error: "Spreadsheet is empty" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Skip header row (line 0), parse data rows
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (!cols[0] || cols[0] === "") continue;
        
        const data = cols[0]; // Date
        const tipo = (cols[1] || "SAÍDA").toUpperCase();
        const nivel1 = cols[2] || "";
        const nivel2 = cols[3] || null;
        const historico = cols[4] || null;
        const valor = parseValue(cols[5]);
        const formaPagamento = cols[6] || null;
        const bancoCartao = cols[7] || null;
        const saldoAcumulado = cols[8] ? parseValue(cols[8]) : null;
        const observacoes = cols[9] || null;

        rows.push({
          data,
          tipo,
          nivel1,
          nivel2,
          historico,
          valor,
          forma_pagamento: formaPagamento,
          banco_cartao: bancoCartao,
          saldo_acumulado: saldoAcumulado,
          observacoes: observacoes,
          uploaded_by: OPERACIONAL_USER_ID,
        });
      }

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: "No data rows found in spreadsheet" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clear and re-insert
      await supabase.from("financial_cashbook").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabase.from("financial_cashbook").insert(rows);
      if (error) throw error;

      // Track upload
      await supabase.from("financial_uploads").insert({
        file_name: `Google Sheets Pull - cashbook`,
        sheet_type: "cashbook",
        rows_imported: rows.length,
        uploaded_by: OPERACIONAL_USER_ID,
      });

      console.log(`Successfully pulled ${rows.length} rows from Google Sheets`);

      return new Response(JSON.stringify({ 
        success: true, 
        rows_imported: rows.length, 
        sheet_type: "cashbook",
        source: "google_sheets_pull" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== PUSH MODE: Receive data from Apps Script =====
    const syncKey = req.headers.get("x-sync-key");
    const expectedKey = Deno.env.get("FINANCIAL_SYNC_KEY");
    if (expectedKey && syncKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sheet_type, data } = body;
    if (!sheet_type || !data || !Array.isArray(data)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let rowsImported = 0;

    if (sheet_type === "cashbook") {
      await supabase.from("financial_cashbook").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const pushRows = data.map((row: any) => ({
        data: row.data || row.Data,
        tipo: (row.tipo || row.Tipo || "SAÍDA").toUpperCase(),
        nivel1: row.nivel1 || row["Nível 1"] || "",
        nivel2: row.nivel2 || row["Nível 2 (Conta)"] || null,
        historico: row.historico || row["Histórico"] || null,
        valor: parseValue(String(row.valor || row["Valor (R$)"] || "0")) || 0,
        forma_pagamento: row.forma_pagamento || row["Forma Pgto"] || null,
        banco_cartao: row.banco_cartao || row["Banco/Cartão"] || null,
        saldo_acumulado: row.saldo_acumulado != null ? parseValue(String(row.saldo_acumulado || "0")) : null,
        observacoes: row.observacoes || row["Observações"] || null,
        uploaded_by: OPERACIONAL_USER_ID,
      }));
      const { error } = await supabase.from("financial_cashbook").insert(pushRows);
      if (error) throw error;
      rowsImported = pushRows.length;
    } else if (sheet_type === "payables") {
      await supabase.from("financial_payables").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const pushRows = data.map((row: any) => ({
        vencimento: row.vencimento || row.Vencimento,
        dias_vencer: parseInt(row.dias_vencer || row["Dias p/ Vencer"]) || null,
        status: (row.status || row.Status || "PENDENTE").toUpperCase(),
        nivel1: row.nivel1 || row["Nível 1"] || "",
        nivel2: row.nivel2 || row["Nível 2 (Conta)"] || null,
        fornecedor: row.fornecedor || row["Fornecedor/Credor"] || null,
        historico: row.historico || row["Histórico"] || null,
        valor: parseValue(String(row.valor || row["Valor (R$)"] || "0")) || 0,
        forma_pagamento: row.forma_pagamento || row["Forma Pgto"] || null,
        banco_cartao: row.banco_cartao || row["Banco/Cartão"] || null,
        observacoes: row.observacoes || row["Observações"] || null,
        uploaded_by: OPERACIONAL_USER_ID,
      }));
      const { error } = await supabase.from("financial_payables").insert(pushRows);
      if (error) throw error;
      rowsImported = pushRows.length;
    } else if (sheet_type === "budget") {
      await supabase.from("financial_budget").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const pushRows = data.map((row: any) => ({
        codigo: row.codigo || row["Código"] || null,
        nivel1: row.nivel1 || row["Nível 1 - Grupo"] || "",
        nivel2: row.nivel2 || row["Nível 2 - Conta"] || null,
        jan: parseValue(String(row.jan || row.Jan || "0")),
        fev: parseValue(String(row.fev || row.Fev || "0")),
        mar: parseValue(String(row.mar || row.Mar || "0")),
        abr: parseValue(String(row.abr || row.Abr || "0")),
        mai: parseValue(String(row.mai || row.Mai || "0")),
        jun: parseValue(String(row.jun || row.Jun || "0")),
        jul: parseValue(String(row.jul || row.Jul || "0")),
        ago: parseValue(String(row.ago || row.Ago || "0")),
        set: parseValue(String(row.set || row.Set || "0")),
        out: parseValue(String(row.out || row.Out || "0")),
        nov: parseValue(String(row.nov || row.Nov || "0")),
        dez: parseValue(String(row.dez || row.Dez || "0")),
        total_anual: parseValue(String(row.total_anual || row["TOTAL ANUAL"] || "0")),
        uploaded_by: OPERACIONAL_USER_ID,
      }));
      const { error } = await supabase.from("financial_budget").insert(pushRows);
      if (error) throw error;
      rowsImported = pushRows.length;
    } else {
      return new Response(JSON.stringify({ error: `Unknown sheet_type: ${sheet_type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("financial_uploads").insert({
      file_name: `Push Sync - ${sheet_type}`,
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
