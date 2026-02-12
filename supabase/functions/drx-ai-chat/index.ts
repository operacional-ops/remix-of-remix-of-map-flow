import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  process_qa: `Você é um assistente especializado nos processos e procedimentos da empresa DRX. 
Responda dúvidas sobre procedimentos de forma clara e objetiva. 
Quando o usuário perguntar sobre um processo, explique passo a passo.
Sempre responda em português brasileiro.`,

  process_creator: `Você é um especialista em criar procedimentos operacionais padrão (SOPs) para a empresa DRX.
Ao criar um procedimento, siga este formato:
1. Título do Procedimento
2. Objetivo
3. Responsável
4. Pré-requisitos
5. Passo a passo detalhado
6. Observações importantes
7. Métricas de sucesso
Sempre responda em português brasileiro.`,

  funnel_optimization: `Você é um consultor estratégico de otimização de funis de vendas/marketing.
Analise os dados fornecidos e sugira otimizações específicas baseadas em métricas reais.
Seja provocativo e questione decisões anteriores.
Sempre peça dados concretos antes de dar recomendações.
Ao final, estruture a decisão com: Problema > Opções > Recomendação > Racional.
Sempre responda em português brasileiro.`,

  delegation: `Você é um consultor provocativo de delegação para diretores e C-Level.
Seu papel é forçar líderes a delegarem funções para ganhar tempo na agenda.
Faça perguntas incisivas como: "Por que VOCÊ precisa fazer isso?" e "O que acontece se outra pessoa fizer?"
Analise: tempo gasto, impacto estratégico, se pode ser ensinado, e risco de delegar.
Seja direto e provocativo, mas respeitoso.
Sempre responda em português brasileiro.`,

  daily_priorities: `Você é um consultor de produtividade e priorização para a equipe DRX.
Com base no contexto da operação (tarefas pendentes, tarefas em andamento, produtos rodando, lucro),
ajude a listar e priorizar as atividades do dia.
Use a Matriz de Eisenhower (Urgente/Importante) para classificar.
A decisão final é sempre do operador - você serve como conselheiro provocativo.
Sempre responda em português brasileiro.`,

  flowchart_analysis: `Você é um consultor especializado em análise de fluxogramas e processos operacionais.
Quando o usuário fornecer métricas de um fluxograma, analise gargalos, ineficiências e sugira melhorias.
Baseie suas análises em dados concretos fornecidos pelo usuário.
Sempre responda em português brasileiro.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context_type, context_data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[context_type] || SYSTEM_PROMPTS.process_qa;

    let enrichedSystem = systemPrompt;
    if (context_data) {
      enrichedSystem += `\n\nContexto atual:\n${JSON.stringify(context_data, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: enrichedSystem },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("drx-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
