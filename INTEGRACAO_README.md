# Integração Meta Ads + PayT → Supabase

Scripts Python para sincronizar dados do Meta Ads e receber webhooks da PayT, inserindo tudo no Supabase.

## 📁 Arquivos

- `meta_ads_sync.py` - Script para buscar dados do Meta Ads
- `payt_webhook.py` - Servidor Flask para receber webhooks da PayT
- `requirements.txt` - Dependências Python

## 🚀 Como usar

### 1. Instalar dependências

```bash
sudo pip3 install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

```bash
export META_ADS_TOKEN="seu_token_aqui"
export META_AD_ACCOUNT_ID="act_545837621783259"
export SUPABASE_URL="https://apvczhiifvdodawrlgmk.supabase.co"
export SUPABASE_SERVICE_KEY="sua_service_key_aqui"
export PAYT_SECRET_KEY="754faad8e28fbfe09dbe04eeb7e822ee"
```

### 3. Executar sync do Meta Ads

```bash
python3 meta_ads_sync.py
```

Isso vai buscar os dados de hoje do Meta Ads e inserir no Supabase.

### 4. Iniciar webhook da PayT

```bash
python3 payt_webhook.py
```

O servidor vai rodar na porta 5000. Para expor publicamente, use ngrok ou deploy em um servidor.

## 🔄 Automação

### Opção 1: Cron (Linux)

Adicionar ao crontab para rodar a cada hora:

```bash
crontab -e
```

Adicionar linha:

```
0 * * * * cd /home/ubuntu && python3 meta_ads_sync.py >> /var/log/meta_sync.log 2>&1
```

### Opção 2: Systemd Service (Webhook)

Criar arquivo `/etc/systemd/system/payt-webhook.service`:

```ini
[Unit]
Description=PayT Webhook Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/bin/python3 /home/ubuntu/payt_webhook.py
Restart=always
Environment="SUPABASE_URL=https://apvczhiifvdodawrlgmk.supabase.co"
Environment="SUPABASE_SERVICE_KEY=sua_key"

[Install]
WantedBy=multi-user.target
```

Ativar:

```bash
sudo systemctl enable payt-webhook
sudo systemctl start payt-webhook
```

### Opção 3: Deploy em Cloud (Recomendado)

#### Google Cloud Functions

1. Criar função para Meta Ads sync (trigger: Cloud Scheduler - a cada hora)
2. Criar função para PayT webhook (trigger: HTTP)

#### Vercel/Railway/Render

Deploy do `payt_webhook.py` como aplicação Flask.

## 📊 Estrutura das Tabelas Supabase

### gastos_meta

```sql
- id (uuid, primary key)
- created_at (timestamp)
- date (date)
- campaign_id (text)
- campaign_name (text)
- account_id (text)
- account_name (text)
- spend (numeric)
- impressions (integer)
- clicks (integer)
- ctr (numeric)
- cpm (numeric)
- cpc (numeric)
- conversions (integer)
- conversion_value (numeric)
```

### payt_vendas

```sql
- id (uuid, primary key)
- created_at (timestamp)
- transaction_id (text)
- status (text)
- amount (numeric)
- customer_name (text)
- customer_email (text)
- utm_source (text)
- utm_medium (text)
- utm_campaign (text)
- utm_content (text)
- utm_term (text)
- data_venda (timestamp)
- raw_data (jsonb)
```

## 🔧 Configurar Webhook na PayT

1. Acessar https://app.payt.com.br/admin/postbacks
2. Criar novo postback
3. URL: `https://seu-dominio.com/webhook/payt`
4. Método: POST
5. Eventos: Pagamento Aprovado, Pagamento Recusado, etc.

## ✅ Testar

### Testar Meta Ads Sync

```bash
python3 meta_ads_sync.py
```

Deve exibir:
```
🚀 Starting Meta Ads sync...
✅ Fetched X campaigns from Meta Ads
📊 Transformed X records
✅ Inserted/Updated X records in Supabase
✅ Sync completed!
```

### Testar PayT Webhook

```bash
curl -X POST http://localhost:5000/webhook/payt \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test123",
    "status": "approved",
    "amount": 197.00,
    "customer_name": "João Silva",
    "customer_email": "joao@example.com",
    "utm_campaign": "CA02-ELEFANTE"
  }'
```

Deve retornar:
```json
{
  "status": "success",
  "message": "Transaction recorded",
  "transaction_id": "test123"
}
```

## 🎯 Próximos Passos

1. ✅ Scripts criados
2. ⏳ Deploy em produção (Cloud Functions ou servidor)
3. ⏳ Configurar webhook na PayT
4. ⏳ Configurar cron para Meta Ads sync
5. ⏳ Testar integração completa
6. ⏳ Dashboard carregando dados em tempo real
