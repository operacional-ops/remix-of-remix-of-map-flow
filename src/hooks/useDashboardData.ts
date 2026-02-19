import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDateRangeFromPreset } from '@/lib/datePresets';
import { format } from 'date-fns';

export interface DashboardKpis {
  valor_investido: number;
  impressions: number;
  clicks: number;
  vendas_totais: number;
  vendas_aprovadas: number;
  faturamento_aprovado: number;
  vendas_pendentes: number;
  vendas_canceladas: number;
  ticket_medio: number;
  roas_real: number | null;
}

export interface DashboardCampaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  meta: {
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    conversions: number;
  };
  payt: {
    vendas_totais: number;
    vendas_aprovadas: number;
    faturamento_aprovado: number;
  };
  roas: number | null;
}

export interface DashboardData {
  kpis: DashboardKpis;
  campaigns: DashboardCampaign[];
  generated_at: string;
}

export type DashboardErrorType = 'DENIED' | 'UNAUTH' | 'UNKNOWN';

export function useDashboardData(workspaceId: string | undefined, datePreset: string) {
  return useQuery<DashboardData, { type: DashboardErrorType; message: string }>({
    queryKey: ['dashboard_data', workspaceId, datePreset],
    queryFn: async () => {
      if (!workspaceId) throw { type: 'UNKNOWN' as const, message: 'No workspace' };

      const range = getDateRangeFromPreset(datePreset);
      const params: Record<string, unknown> = { p_workspace_id: workspaceId };
      if (range) {
        params.p_date_start = format(range.start, 'yyyy-MM-dd');
        params.p_date_end = format(range.end, 'yyyy-MM-dd');
      }

      const { data, error } = await supabase.rpc('get_dashboard_data', params as any);

      if (error) {
        const msg = error.message || '';
        if (msg.includes('permission denied') || error.code === '42501') {
          throw { type: 'DENIED' as const, message: msg };
        }
        if (msg.includes('unauthenticated') || error.code === '28000') {
          throw { type: 'UNAUTH' as const, message: msg };
        }
        throw { type: 'UNKNOWN' as const, message: msg };
      }

      return data as unknown as DashboardData;
    },
    enabled: !!workspaceId,
    retry: (failureCount, error) => {
      if (error?.type === 'DENIED' || error?.type === 'UNAUTH') return false;
      return failureCount < 2;
    },
  });
}
