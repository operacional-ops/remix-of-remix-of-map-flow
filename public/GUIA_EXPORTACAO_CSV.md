# 📊 Guia de Exportação de CSVs para o Dashboard DRX

Este guia explica como exportar os dados necessários de cada plataforma para alimentar o Dashboard Operacional.

---

## 🎯 Meta Ads (Facebook Ads Manager)

### Como Exportar:

1. Acesse o [Facebook Ads Manager](https://business.facebook.com/adsmanager)
2. Selecione a conta de anúncios: **act_545837621783259**
3. Vá em **Campanhas** ou **Conjuntos de Anúncios**
4. Clique em **Colunas** e selecione **Personalizar Colunas**
5. Adicione as seguintes colunas:
   - Data (date_start)
   - Nome da Campanha (campaign_name)
   - Nome da Conta (account_name)
   - Valor Gasto (spend)
   - Impressões (impressions)
   - Cliques no Link (clicks)
   - CPM
   - CPC
   - CTR
   - Conversões (purchase)
   - Valor de Conversão (purchase_value)

6. Defina o período desejado (ex: Últimos 7 dias)
7. Clique em **Exportar** → **Exportar dados da tabela** → **CSV**

### Colunas Esperadas no CSV:
```
date_start, campaign_name, account_name, spend, impressions, clicks, cpm, cpc, ctr, purchase, purchase_value
```

---

## 💰 PayT (Dados de Vendas)

### Como Exportar:

1. Acesse o [PayT Admin](https://app.payt.com.br/admin)
2. Vá em **Transações** ou **Relatórios**
3. Filtre por:
   - Status: **Aprovado** (approved)
   - Período: Últimos 7 ou 30 dias
4. Exporte o relatório em formato CSV

### Colunas Esperadas no CSV:
```
transaction_id, date, amount, status, customer_name, customer_email, utm_source, utm_campaign, utm_medium
```

**Importante:** As UTMs são essenciais para cruzar com os dados do Meta Ads!

### Se não houver UTMs no CSV:
- Certifique-se de que os links dos anúncios incluem os parâmetros UTM
- Exemplo: `?utm_source=facebook&utm_campaign=CA02-ELE&utm_medium=cpc`

---

## 📋 Airtable (Criativos por Lotes)

### Como Exportar:

1. Acesse sua [Base do Airtable](https://airtable.com/appjMtqQXTXsjYwcj/tblxkWPf7EUx0iFBJ/viwDVoFi0u7mfqpGT?blocks=hide)
2. Selecione a tabela de **Criativos** (CA02 ou AGE 01)
3. Escolha a visualização **Por Lotes**
4. Clique no menu **⋮** → **Download CSV**

### Colunas Esperadas no CSV:
```
Nome, ID, Lote, Status, Gasto, Vendas, CPA, Faturamento, Lucro, ROAS, CPC, CTR, CPM, Hook Rate, Hold Rate, Impressões, Cliques
```

### Status Válidos:
- 🟢 Escalando
- 🟡 Testando
- 🟠 Pre Escala
- ⚫ Pausado
- 🔵 Aprovado
- 🔴 Rejeitado
- ⚪ Backlog

---

## 🔄 Como Usar no Dashboard

1. **Abra o Dashboard** → Seção "Upload de Dados (CSV)"
2. **Arraste e solte** ou **clique** em cada área para selecionar os arquivos:
   - Meta Ads CSV
   - PayT CSV
   - Airtable Criativos CSV
3. Aguarde o ícone **✓ Carregado** aparecer em cada área
4. Clique em **"Processar Dados"**
5. O dashboard será atualizado automaticamente com:
   - KPIs gerais (Gasto, Vendas, ROAS, Lucro)
   - Tabela de Controle por Contas
   - Criativos organizados por Lotes
   - Gráficos de Performance

---

## 🎯 Cruzamento de Dados

O dashboard cruza automaticamente:

1. **Meta Ads ↔ PayT**: Relaciona gastos com vendas usando `utm_campaign`
2. **Airtable ↔ Meta Ads**: Relaciona criativos com performance de campanhas
3. **Cálculos Automáticos**:
   - ROAS = Faturamento / Gasto
   - CPA = Gasto / Vendas
   - Lucro = Faturamento - Gasto
   - Margem = (Lucro / Faturamento) × 100

---

## ⚠️ Dicas Importantes

- **Sempre use o mesmo período** em todas as exportações (ex: Últimos 7 dias)
- **Certifique-se de que as UTMs estão corretas** nos links dos anúncios
- **Mantenha os nomes das campanhas consistentes** entre Meta Ads e Airtable
- **Exporte em formato CSV UTF-8** para evitar problemas com caracteres especiais

---

## 🚀 Próximos Passos (Automação Futura)

Quando estiver pronto para automatizar:
1. Integração direta com Meta Ads API
2. Webhook da PayT enviando dados em tempo real
3. Sincronização automática com Airtable
4. Atualização do dashboard a cada hora

---

**Criado por: DRX Intelligence Team**  
**Última atualização: 20/02/2026**
