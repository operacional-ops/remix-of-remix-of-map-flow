import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDateRangeFromPreset } from '@/lib/datePresets';
import { format } from 'date-fns';

interface FilterParams {
  workspaceId?: string;
  datePreset?: string;
  accountId?: string; // 'all' or specific account_id
}

async function fetchFilteredRows(table: string, params: FilterParams) {
  const { workspaceId, datePreset, accountId } = params;
  if (!workspaceId) return [];

  const allData: any[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    let query = supabase
      .from(table as any)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('date_start', { ascending: false });

    // Server-side date filtering
    if (datePreset && datePreset !== 'maximum') {
      const range = getDateRangeFromPreset(datePreset);
      if (range) {
        const startStr = format(range.start, 'yyyy-MM-dd');
        const endStr = format(range.end, 'yyyy-MM-dd');
        query = query.gte('date_start', startStr).lte('date_start', endStr);
      }
    }

    // Server-side account filtering
    if (accountId && accountId !== 'all') {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query.range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allData;
}

export function useFacebookMetrics(params: FilterParams) {
  return useQuery({
    queryKey: ['facebook_metrics', params.workspaceId, params.datePreset, params.accountId],
    queryFn: () => fetchFilteredRows('facebook_metrics', params),
    enabled: !!params.workspaceId,
  });
}

export function useFacebookCampaignInsights(params: FilterParams) {
  return useQuery({
    queryKey: ['facebook_campaign_insights', params.workspaceId, params.datePreset, params.accountId],
    queryFn: () => fetchFilteredRows('facebook_campaign_insights', params),
    enabled: !!params.workspaceId,
  });
}

export function useFacebookAdsetInsights(params: FilterParams) {
  return useQuery({
    queryKey: ['facebook_adset_insights', params.workspaceId, params.datePreset, params.accountId],
    queryFn: () => fetchFilteredRows('facebook_adset_insights', params),
    enabled: !!params.workspaceId,
  });
}

export function useFacebookAdInsights(params: FilterParams) {
  return useQuery({
    queryKey: ['facebook_ad_insights', params.workspaceId, params.datePreset, params.accountId],
    queryFn: () => fetchFilteredRows('facebook_ad_insights', params),
    enabled: !!params.workspaceId,
  });
}

export function useSyncFacebookMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, workspaceId, accessToken, datePreset }: { accountId: string; workspaceId?: string; accessToken?: string; datePreset?: string }) => {
      const { data, error } = await supabase.functions.invoke('fetch-fb-insights', {
        body: { accountId, workspaceId, accessToken, datePreset },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['facebook_metrics'] });
      queryClient.invalidateQueries({ queryKey: ['facebook_campaign_insights'] });
      queryClient.invalidateQueries({ queryKey: ['facebook_adset_insights'] });
      queryClient.invalidateQueries({ queryKey: ['facebook_ad_insights'] });
      const warnings = data.warnings || [];
      if (warnings.length > 0) {
        toast.warning(`Sincronizado com avisos: ${warnings.join('; ')}`);
      } else {
        toast.success(`Sincronizado! ${data.accountCount || 0} conta(s), ${data.campaignCount || 0} campanha(s), ${data.adsetCount || 0} conjunto(s), ${data.adCount || 0} anúncio(s).`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sincronizar dados do Meta');
    },
  });
}
