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

export function useSyncFacebookMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, workspaceId }: { accountId: string; workspaceId?: string }) => {
      const { data, error } = await supabase.functions.invoke('fetch-fb-insights', {
        body: { accountId, workspaceId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['facebook_metrics'] });
      toast.success(`Sincronizado! ${data.count} registros importados.`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sincronizar dados do Meta');
    },
  });
}
