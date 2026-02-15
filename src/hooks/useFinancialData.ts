import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CashbookEntry {
  id: string;
  data: string;
  tipo: string;
  nivel1: string;
  nivel2: string | null;
  historico: string | null;
  valor: number;
  forma_pagamento: string | null;
  banco_cartao: string | null;
  saldo_acumulado: number | null;
  observacoes: string | null;
  created_at: string;
}

export interface PayableEntry {
  id: string;
  vencimento: string;
  dias_vencer: number | null;
  status: string;
  nivel1: string;
  nivel2: string | null;
  fornecedor: string | null;
  historico: string | null;
  valor: number;
  forma_pagamento: string | null;
  banco_cartao: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface BudgetEntry {
  id: string;
  codigo: string | null;
  nivel1: string;
  nivel2: string | null;
  jan: number | null;
  fev: number | null;
  mar: number | null;
  abr: number | null;
  mai: number | null;
  jun: number | null;
  jul: number | null;
  ago: number | null;
  set: number | null;
  out: number | null;
  nov: number | null;
  dez: number | null;
  total_anual: number | null;
  created_at: string;
}

export const useCashbook = () => {
  return useQuery({
    queryKey: ['financial-cashbook'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_cashbook')
        .select('*')
        .order('data', { ascending: true });
      if (error) throw error;
      return (data || []) as CashbookEntry[];
    },
  });
};

export const usePayables = () => {
  return useQuery({
    queryKey: ['financial-payables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_payables')
        .select('*')
        .order('vencimento', { ascending: true });
      if (error) throw error;
      return (data || []) as PayableEntry[];
    },
  });
};

export const useBudget = () => {
  return useQuery({
    queryKey: ['financial-budget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_budget')
        .select('*')
        .order('codigo', { ascending: true });
      if (error) throw error;
      return (data || []) as BudgetEntry[];
    },
  });
};

export const useImportCashbook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rows: Omit<CashbookEntry, 'id' | 'created_at'>[]) => {
      // Clear existing data first
      await supabase.from('financial_cashbook').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const inserts = rows.map(r => ({ ...r, uploaded_by: user?.id }));
      const { error } = await supabase.from('financial_cashbook').insert(inserts);
      if (error) throw error;

      // Track upload
      await supabase.from('financial_uploads').insert({
        file_name: 'CSV Import',
        sheet_type: 'cashbook',
        rows_imported: rows.length,
        uploaded_by: user?.id,
      });

      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['financial-cashbook'] });
      toast.success(`${count} registros importados no Livro Caixa`);
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast.error('Erro ao importar Livro Caixa');
    },
  });
};

export const useImportPayables = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rows: Omit<PayableEntry, 'id' | 'created_at'>[]) => {
      await supabase.from('financial_payables').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const inserts = rows.map(r => ({ ...r, uploaded_by: user?.id }));
      const { error } = await supabase.from('financial_payables').insert(inserts);
      if (error) throw error;

      await supabase.from('financial_uploads').insert({
        file_name: 'CSV Import',
        sheet_type: 'payables',
        rows_imported: rows.length,
        uploaded_by: user?.id,
      });

      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['financial-payables'] });
      toast.success(`${count} registros importados em Contas a Pagar`);
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast.error('Erro ao importar Contas a Pagar');
    },
  });
};

export const useImportBudget = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rows: Omit<BudgetEntry, 'id' | 'created_at'>[]) => {
      await supabase.from('financial_budget').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const inserts = rows.map(r => ({ ...r, uploaded_by: user?.id }));
      const { error } = await supabase.from('financial_budget').insert(inserts);
      if (error) throw error;

      await supabase.from('financial_uploads').insert({
        file_name: 'CSV Import',
        sheet_type: 'budget',
        rows_imported: rows.length,
        uploaded_by: user?.id,
      });

      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['financial-budget'] });
      toast.success(`${count} registros importados no Orçamento`);
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast.error('Erro ao importar Orçamento');
    },
  });
};
