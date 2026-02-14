import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface OperationalProduct {
  id: string;
  name: string;
  code: string;
  created_at: string;
  workspace_id: string | null;
}

export interface OperationalMetric {
  id: string;
  product_id: string;
  data: string;
  contas_produto: string;
  status: string;
  gastos: number;
  cpm: number;
  cpc: number;
  conv_funil: number;
  qnt_vendas: number;
  ticket_medio: number;
  cpa: number;
  resultado: number;
  lucro_bruto: number;
  roas: number;
  margem: number;
}

export function useOperationalProducts() {
  const { activeWorkspace } = useWorkspace();

  return useQuery({
    queryKey: ['operational-products', activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_products')
        .select('*')
        .eq('workspace_id', activeWorkspace!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as OperationalProduct[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useOperationalMetrics(productId: string | null) {
  return useQuery({
    queryKey: ['operational-metrics', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_metrics')
        .select('*')
        .eq('product_id', productId!)
        .order('data', { ascending: false });
      if (error) throw error;
      return data as OperationalMetric[];
    },
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      if (!activeWorkspace) throw new Error('Selecione um workspace primeiro');
      const { data, error } = await supabase
        .from('operational_products')
        .insert({
          name,
          code,
          created_by: user.id,
          workspace_id: activeWorkspace.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-products'] });
    },
  });
}

export function useImportMetrics() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, rows }: { productId: string; rows: Omit<OperationalMetric, 'id' | 'product_id'>[] }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const toInsert = rows.map(r => ({
        ...r,
        product_id: productId,
        created_by: user.id,
      }));
      const { error } = await supabase
        .from('operational_metrics')
        .insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-metrics'] });
    },
  });
}

export function useAddMetricRow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (row: { product_id: string; data: string; contas_produto: string; status?: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('operational_metrics')
        .insert({
          ...row,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-metrics'] });
    },
  });
}

export function useUpdateMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase
        .from('operational_metrics')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-metrics'] });
    },
  });
}

export function useDeleteMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('operational_metrics')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-metrics'] });
    },
  });
}
