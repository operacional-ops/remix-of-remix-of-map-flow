# 📋 PROMPT DE EXECUÇÃO — ABA "OPERAÇÕES" (Dashboard Operação)

## 🎯 OBJETIVO

Fazer funcionar 100% a aba **Operações** (`/dashboard-operacao`) com sidebar, duas views (Resumo + Meta), integrações reais com **Meta Ads API** e **PayT Postback**.

---

## 🏗️ ARQUITETURA ATUAL

A página **existe em duas versões conflitantes**:

| Arquivo | Descrição | Status |
|---|---|---|
| `src/pages/DashboardOperacao.tsx` | **Versão atual** — usa RPC `get_dashboard_data` com KPIs + gráfico + tabela. **NÃO TEM sidebar nem abas.** | ❌ Incompleta |
| `src/components/marketing/UtmifySidebar.tsx` | Sidebar com itens "Resumo" e "Meta" | ✅ Pronto mas desconectado |
| `src/components/marketing/ResumoView.tsx` | View "Resumo" completa com KPIs financeiros, funil, gráficos de pizza (pagamento/produto), gráfico diário | ✅ Pronto mas desconectado |
| `src/components/marketing/UtmifyTable.tsx` | Tabela tipo UTMify com abas: Contas, Campanhas, Conjuntos, Anúncios + totalizadores | ✅ Pronto mas desconectado |
| `src/components/marketing/UtmifyDashboard.tsx` | Dashboard Facebook antigo (sem PayT) — **obsoleto** | ⚠️ Pode ser removido |

---

## 📌 O QUE PRECISA SER FEITO

### 1. REESTRUTURAR `DashboardOperacao.tsx`

**Arquivo:** `src/pages/DashboardOperacao.tsx`

- Adicionar o `UtmifySidebar` ao layout (sidebar à esquerda, conteúdo à direita)
- Controlar o state `activeView: 'resumo' | 'meta'`
- Quando `activeView === 'resumo'` → renderizar `ResumoView`
- Quando `activeView === 'meta'` → renderizar a view com `UtmifyTable` (abas: Contas, Campanhas, Conjuntos, Anúncios)
- Manter o login Facebook, seletor de contas e sincronização no header global (fora das views)

### 2. CONECTAR A VIEW "RESUMO"

**Arquivo:** `src/components/marketing/ResumoView.tsx`

Já funciona! Precisa receber os props corretamente:

- `metrics` → vem de `useFacebookMetrics({ workspaceId, datePreset, accountId })`
  - **Tabela fonte:** `facebook_metrics`
- `campaigns` → vem de `useFacebookCampaignInsights({ workspaceId, datePreset, accountId })`
  - **Tabela fonte:** `facebook_campaign_insights`
- Vendas PayT → já busca internamente via `usePaytSalesBreakdown(datePreset)`
  - **Hook fonte:** `src/hooks/useUnifiedMetrics.ts`
  - **Tabela fonte:** `payt_transactions`

### 3. CONECTAR A VIEW "META" (Tabela UTMify)

**Arquivo:** `src/components/marketing/UtmifyTable.tsx`

A view Meta precisa de um container que:

- Exiba **4 abas**: Contas, Campanhas, Conjuntos, Anúncios
- Busque dados de 4 tabelas diferentes:
  - **Contas** → `useFacebookMetrics` → tabela `facebook_metrics`
  - **Campanhas** → `useFacebookCampaignInsights` → tabela `facebook_campaign_insights`
  - **Conjuntos** → `useFacebookAdsetInsights` → tabela `facebook_adset_insights`
  - **Anúncios** → `useFacebookAdInsights` → tabela `facebook_ad_insights`
- **Hooks fonte:** `src/hooks/useFacebookMetrics.ts` (todos os 4 hooks estão lá)
- Cruze vendas via `usePaytSalesBreakdown(datePreset)` usando `matchSalesToCampaign()` e `matchSalesViaParentCampaign()`
  - **Hook fonte:** `src/hooks/useUnifiedMetrics.ts`
- Transforme cada row no formato `UtmifyRow` (interface definida em `UtmifyTable.tsx`)
- Inclua as ferramentas da toolbar:
  - ⚙️ `ColumnCustomizerPopover` → `src/components/marketing/ColumnCustomizerPopover.tsx`
  - ✨ `UtmDiagnosticDialog` → `src/components/marketing/UtmDiagnosticDialog.tsx`

### 4. BARRA DE FERRAMENTAS + FILTROS GLOBAIS

**Arquivo:** `src/components/marketing/UtmifyFilters.tsx` (já existe)

- Filtro de **período** (datePreset): today, yesterday, last_7d, last_14d, last_30d, this_month, last_month, maximum
- Filtro de **conta** (accountId): dropdown com contas disponíveis
- Botão de **Sincronizar Meta**: usa `useSyncFacebookMetrics()` de `src/hooks/useFacebookMetrics.ts`
- Botão de **login Facebook**: `src/components/marketing/FacebookLoginButton.tsx`
- Botão de **gerenciar contas**: `src/components/marketing/AccountSelector.tsx`

---

## 🔗 INTEGRAÇÕES REAIS

### META ADS (Facebook)

| Item | Localização |
|---|---|
| Facebook App ID | `1938349836774831` (hardcoded no SDK) |
| Login SDK | `src/components/marketing/FacebookLoginButton.tsx` |
| Conexão salva em | Tabela `facebook_connections` (token + contas selecionadas) |
| Hook de conexão | `src/hooks/useFacebookConnections.ts` |
| Edge Function de sync | `supabase/functions/fetch-fb-insights/index.ts` |
| Hook de sync | `useSyncFacebookMetrics()` em `src/hooks/useFacebookMetrics.ts` |
| Tabelas de dados | `facebook_metrics`, `facebook_campaign_insights`, `facebook_adset_insights`, `facebook_ad_insights` |
| Domínios autorizados | Precisam estar no Meta Developer Panel: `lovable.app`, `drx-painel-central.lovable.app` e o domínio de preview |

### PAYT (Vendas)

| Item | Localização |
|---|---|
| Endpoint postback | `supabase/functions/payt-postback/index.ts` |
| URL do webhook | `https://ntanivakazwoimvtzmxo.supabase.co/functions/v1/payt-postback` |
| Chave de segurança | Secret `PAYT_POSTBACK_KEY` (valor: `754faad8e28fbfe09dbe04eeb7e822ee`) |
| Tabela de dados | `payt_transactions` |
| Hook de leitura | `src/hooks/usePaytTransactions.ts` |
| Cruzamento Meta↔PayT | Via campo `utm_id` no `raw_payload.link.query_params.utm_id` = `campaign_id` do Meta |
| Hook unificado | `src/hooks/useUnifiedMetrics.ts` → `usePaytSalesBreakdown()` |

---

## 🗂️ TABELAS DO BANCO (Lovable Cloud)

| Tabela | Uso |
|---|---|
| `facebook_connections` | Token, user_id, workspace_id, selected_account_ids |
| `facebook_metrics` | Métricas nível CONTA (spend, clicks, impressions por dia) |
| `facebook_campaign_insights` | Métricas nível CAMPANHA |
| `facebook_adset_insights` | Métricas nível CONJUNTO DE ANÚNCIOS |
| `facebook_ad_insights` | Métricas nível ANÚNCIO |
| `payt_transactions` | Vendas recebidas via postback (status, amount, product_name, payment_method, raw_payload com UTMs) |

---

## 🧮 LÓGICA DE ATRIBUIÇÃO (Vendas ↔ Campanhas)

1. **Nível Campanha:** `utm_id` da transação PayT = `campaign_id` do Meta → match direto
2. **Nível Conjunto/Anúncio:** Vendas da campanha pai são distribuídas **proporcionalmente ao gasto** de cada conjunto/anúncio filho
   - Fórmula: `vendas_entidade = vendas_campanha * (spend_entidade / spend_campanha_total)`

---

## 🚫 O QUE NÃO ALTERAR

- `src/integrations/supabase/types.ts` (auto-gerado)
- `src/integrations/supabase/client.ts` (auto-gerado)
- `.env` (auto-gerado)
- `supabase/config.toml` (auto-gerado)
- Edge Functions existentes (já funcionam)
- Tabelas e RLS policies (já configuradas)

---

## ✅ CRITÉRIO DE SUCESSO

1. Sidebar visível com "Resumo" e "Meta" clicáveis
2. View **Resumo**: KPIs reais (Faturamento, Gastos, Lucro, Margem, ROI, ROAS, CPA, Ticket Médio), Funil, Gráficos de pizza, Gráfico diário
3. View **Meta**: Tabela com 4 abas (Contas, Campanhas, Conjuntos, Anúncios), totalizadores no rodapé, colunas de vendas/faturamento/lucro/ROAS cruzadas com PayT
4. Sincronização Meta funcional (botão → edge function → upsert → refresh)
5. Dados PayT chegando via postback e aparecendo nos KPIs
