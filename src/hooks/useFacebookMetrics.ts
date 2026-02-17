import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useFacebookMetrics(workspaceId?: string) {
  return useQuery({
    queryKey: ['facebook_metrics', workspaceId],
    queryFn: async () => {
      let query = supabase
        .from('facebook_metrics')
        .select('*')
        .order('date_start', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useFacebookCampaignInsights(workspaceId?: string) {
  return useQuery({
    queryKey: ['facebook_campaign_insights', workspaceId],
    queryFn: async () => {
      let query = supabase
        .from('facebook_campaign_insights')
        .select('*')
        .order('date_start', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useFacebookAdsetInsights(workspaceId?: string) {
  return useQuery({
    queryKey: ['facebook_adset_insights', workspaceId],
    queryFn: async () => {
      let query = supabase
        .from('facebook_adset_insights' as any)
        .select('*')
        .order('date_start', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!workspaceId,
  });
}

export function useFacebookAdInsights(workspaceId?: string) {
  return useQuery({
    queryKey: ['facebook_ad_insights', workspaceId],
    queryFn: async () => {
      let query = supabase
        .from('facebook_ad_insights' as any)
        .select('*')
        .order('date_start', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
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
