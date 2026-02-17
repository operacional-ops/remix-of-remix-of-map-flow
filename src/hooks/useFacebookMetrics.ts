import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

async function fetchAllRows(table: string, workspaceId: string) {
  const allData: any[] = [];
  const pageSize = 1000;
  let from = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from(table as any)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('date_start', { ascending: false })
      .range(from, from + pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  return allData;
}

export function useFacebookMetrics(workspaceId?: string) {
  return useQuery({
    queryKey: ['facebook_metrics', workspaceId],
    queryFn: () => fetchAllRows('facebook_metrics', workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useFacebookCampaignInsights(workspaceId?: string) {
  return useQuery({
    queryKey: ['facebook_campaign_insights', workspaceId],
    queryFn: () => fetchAllRows('facebook_campaign_insights', workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useFacebookAdsetInsights(workspaceId?: string) {
  return useQuery({
    queryKey: ['facebook_adset_insights', workspaceId],
    queryFn: () => fetchAllRows('facebook_adset_insights', workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useFacebookAdInsights(workspaceId?: string) {
  return useQuery({
    queryKey: ['facebook_ad_insights', workspaceId],
    queryFn: () => fetchAllRows('facebook_ad_insights', workspaceId!),
    enabled: !!workspaceId,
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
      toast.success(`Sincronizado! ${data.accountCount || 0} conta(s), ${data.campaignCount || 0} campanha(s), ${data.adsetCount || 0} conjunto(s), ${data.adCount || 0} anúncio(s).`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sincronizar dados do Meta');
    },
  });
}
