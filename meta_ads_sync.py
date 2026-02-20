#!/usr/bin/env python3
"""
Meta Ads to Supabase Sync Script
Fetches campaign data from Meta Ads API and inserts into Supabase gastos_meta table
"""

import os
import requests
from datetime import datetime, timedelta
from supabase import create_client, Client

# Configurações
META_ACCESS_TOKEN = os.getenv('META_ADS_TOKEN', 'EAAbi6z14ra8BQ5ZAcX7xXBCgpuNscfTuI2Xb3ZCv6PihjEXIpvTx2qkvbmxu7mN4aZAHla9b3ZAaZA04wIcEgSZAB7exsGYA04Q3vV2rJW224MO4m01FP7rkaRzVcpG2iZCrZB3VZC2UlZBTgJNXdJ0WSqllZCdPbiFZApyV8rnP87HxUKm04CjHYBIRTvOB451j6gZDZD')
META_AD_ACCOUNT_ID = os.getenv('META_AD_ACCOUNT_ID', 'act_545837621783259')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://apvczhiifvdodawrlgmk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdmN6aGlpZnZkb2Rhd3JsZ21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI3OTgzOSwiZXhwIjoyMDg2ODU1ODM5fQ.ph3PdEu7Yc8kTehXjz_fFdOoPI5gJypCHnFk4ar2mY4')

# Inicializar Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_meta_ads_data(date_preset='today'):
    """
    Busca dados de campanhas do Meta Ads
    
    Args:
        date_preset: 'today', 'yesterday', 'last_7d', 'last_30d'
    
    Returns:
        List of campaign data
    """
    url = f'https://graph.facebook.com/v18.0/{META_AD_ACCOUNT_ID}/insights'
    
    params = {
        'access_token': META_ACCESS_TOKEN,
        'level': 'campaign',
        'date_preset': date_preset,
        'fields': 'campaign_id,campaign_name,account_id,account_name,spend,impressions,clicks,ctr,cpm,cpc,actions,action_values',
        'limit': 500
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if 'data' in data:
            print(f"✅ Fetched {len(data['data'])} campaigns from Meta Ads")
            return data['data']
        else:
            print(f"⚠️  No data returned from Meta Ads API")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching Meta Ads data: {e}")
        return []

def transform_meta_data(raw_data):
    """
    Transforma dados da API do Meta para o formato do Supabase
    """
    transformed = []
    
    for item in raw_data:
        # Extrair conversões se existirem
        conversions = 0
        conversion_value = 0
        
        if 'actions' in item:
            for action in item['actions']:
                if action.get('action_type') in ['purchase', 'offsite_conversion.fb_pixel_purchase']:
                    conversions += int(action.get('value', 0))
        
        if 'action_values' in item:
            for action_value in item['action_values']:
                if action_value.get('action_type') in ['purchase', 'offsite_conversion.fb_pixel_purchase']:
                    conversion_value += float(action_value.get('value', 0))
        
        record = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'campaign_id': item.get('campaign_id'),
            'campaign_name': item.get('campaign_name'),
            'account_id': item.get('account_id'),
            'account_name': item.get('account_name', 'DRX Intelligence'),
            'spend': float(item.get('spend', 0)),
            'impressions': int(item.get('impressions', 0)),
            'clicks': int(item.get('clicks', 0))
        }
        
        transformed.append(record)
    
    return transformed

def insert_to_supabase(data):
    """
    Insere dados no Supabase (upsert para evitar duplicatas)
    """
    if not data:
        print("⚠️  No data to insert")
        return
    
    try:
        # Usar upsert para evitar duplicatas (baseado em campaign_id + date)
        result = supabase.table('gastos_meta').upsert(data, on_conflict='campaign_id,date').execute()
        print(f"✅ Inserted/Updated {len(data)} records in Supabase")
        return result
        
    except Exception as e:
        print(f"❌ Error inserting to Supabase: {e}")
        return None

def main():
    """
    Função principal
    """
    print("🚀 Starting Meta Ads sync...")
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. Buscar dados do Meta Ads
    raw_data = fetch_meta_ads_data(date_preset='today')
    
    if not raw_data:
        print("⚠️  No data fetched, exiting...")
        return
    
    # 2. Transformar dados
    transformed_data = transform_meta_data(raw_data)
    print(f"📊 Transformed {len(transformed_data)} records")
    
    # 3. Inserir no Supabase
    insert_to_supabase(transformed_data)
    
    print("✅ Sync completed!")

if __name__ == '__main__':
    main()
