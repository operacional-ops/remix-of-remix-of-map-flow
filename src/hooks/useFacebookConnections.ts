import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FacebookConnection {
  id: string;
  user_id: string;
  workspace_id: string | null;
  fb_user_id: string;
  fb_user_name: string | null;
  access_token: string;
  token_expires_at: string | null;
  selected_account_ids: string[];
  created_at: string;
  updated_at: string;
}

export function useFacebookConnection(workspaceId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['facebook_connection', user?.id, workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facebook_connections' as any)
        .select('*')
        .eq('user_id', user!.id)
        .eq('workspace_id', workspaceId!)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as FacebookConnection | null;
    },
    enabled: !!user?.id && !!workspaceId,
  });
}

export function useSaveFacebookConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      workspaceId: string;
      fbUserId: string;
      fbUserName: string;
      accessToken: string;
      expiresIn?: number;
    }) => {
      const expiresAt = params.expiresIn
        ? new Date(Date.now() + params.expiresIn * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('facebook_connections' as any)
        .upsert(
          {
            user_id: params.userId,
            workspace_id: params.workspaceId,
            fb_user_id: params.fbUserId,
            fb_user_name: params.fbUserName,
            access_token: params.accessToken,
            token_expires_at: expiresAt,
          } as any,
          { onConflict: 'user_id,workspace_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FacebookConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook_connection'] });
      toast.success('Perfil do Facebook conectado!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao salvar conexão');
    },
  });
}

export function useUpdateSelectedAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ connectionId, accountIds }: { connectionId: string; accountIds: string[] }) => {
      const { error } = await supabase
        .from('facebook_connections' as any)
        .update({ selected_account_ids: accountIds } as any)
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook_connection'] });
    },
  });
}

export function useDisconnectFacebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('facebook_connections' as any)
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook_connection'] });
      toast.success('Facebook desconectado');
    },
  });
}
