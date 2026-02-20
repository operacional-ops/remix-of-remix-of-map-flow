#!/usr/bin/env python3
"""
PayT Webhook Server
Receives webhook notifications from PayT and inserts into Supabase payt_vendas table
"""

import os
from flask import Flask, request, jsonify
from datetime import datetime
from supabase import create_client, Client

app = Flask(__name__)

# Configurações
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://apvczhiifvdodawrlgmk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdmN6aGlpZnZkb2Rhd3JsZ21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI3OTgzOSwiZXhwIjoyMDg2ODU1ODM5fQ.ph3PdEu7Yc8kTehXjz_fFdOoPI5gJypCHnFk4ar2mY4')
PAYT_SECRET_KEY = os.getenv('PAYT_SECRET_KEY', '754faad8e28fbfe09dbe04eeb7e822ee')

# Inicializar Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/webhook/payt', methods=['POST'])
def payt_webhook():
    """
    Recebe webhook da PayT
    """
    try:
        # Obter dados do POST
        data = request.get_json() or request.form.to_dict()
        
        print(f"📨 Received PayT webhook: {data}")
        
        # Validar se não é teste vazio
        if not data or len(data) == 0:
            print("⚠️  Empty webhook, ignoring...")
            return jsonify({'status': 'ignored', 'message': 'Empty data'}), 200
        
        # Extrair informações principais
        transaction_id = data.get('transaction_id') or data.get('id')
        status = data.get('status', 'pending')
        amount = float(data.get('amount', 0) or data.get('value', 0))
        customer_name = data.get('customer_name') or data.get('name', '')
        customer_email = data.get('customer_email') or data.get('email', '')
        
        # Extrair UTMs
        utm_source = data.get('utm_source', '')
        utm_medium = data.get('utm_medium', '')
        utm_campaign = data.get('utm_campaign', '')
        utm_content = data.get('utm_content', '')
        utm_term = data.get('utm_term', '')
        
        # Criar registro para Supabase
        record = {
            'transaction_id': transaction_id,
            'status': status,
            'amount': amount,
            'customer_name': customer_name,
            'customer_email': customer_email,
            'utm_source': utm_source,
            'utm_medium': utm_medium,
            'utm_campaign': utm_campaign,
            'utm_content': utm_content,
            'utm_term': utm_term,
            'data_venda': datetime.now().isoformat(),
            'raw_data': data  # Salvar dados completos para debug
        }
        
        # Inserir no Supabase
        result = supabase.table('payt_vendas').insert(record).execute()
        
        print(f"✅ Inserted PayT transaction {transaction_id} into Supabase")
        
        return jsonify({
            'status': 'success',
            'message': 'Transaction recorded',
            'transaction_id': transaction_id
        }), 200
        
    except Exception as e:
        print(f"❌ Error processing PayT webhook: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'service': 'PayT Webhook',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/', methods=['GET'])
def index():
    """
    Root endpoint
    """
    return jsonify({
        'service': 'PayT Webhook Server',
        'version': '1.0.0',
        'endpoints': {
            '/webhook/payt': 'POST - Receive PayT webhooks',
            '/health': 'GET - Health check'
        }
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Starting PayT Webhook Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
