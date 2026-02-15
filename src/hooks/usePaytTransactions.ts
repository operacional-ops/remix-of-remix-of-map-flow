import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface PaytTransaction {
  id: string;
  workspace_id: string | null;
  transaction_id: string | null;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  product_name: string | null;
  product_code: string | null;
  payment_method: string | null;
  amount: number;
  commission: number;
  net_amount: number;
  currency: string;
  paid_at: string | null;
  refunded_at: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function usePaytTransactions() {
  const { activeWorkspace } = useWorkspace();

  return useQuery({
    queryKey: ['payt-transactions', activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payt_transactions')
        .select('*')
        .eq('workspace_id', activeWorkspace!.id)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as PaytTransaction[];
    },
    enabled: !!activeWorkspace?.id,
    refetchInterval: 30000, // Auto-refresh every 30s for real-time feel
  });
}

export function usePaytStats() {
  const { data: transactions = [], isLoading } = usePaytTransactions();

  const stats = {
    totalSales: transactions.filter(t => t.status === 'approved').length,
    totalRevenue: transactions
      .filter(t => t.status === 'approved')
      .reduce((s, t) => s + Number(t.amount || 0), 0),
    totalNetRevenue: transactions
      .filter(t => t.status === 'approved')
      .reduce((s, t) => s + Number(t.net_amount || 0), 0),
    totalCommission: transactions
      .filter(t => t.status === 'approved')
      .reduce((s, t) => s + Number(t.commission || 0), 0),
    pendingCount: transactions.filter(t => t.status === 'pending').length,
    pendingAmount: transactions
      .filter(t => t.status === 'pending')
      .reduce((s, t) => s + Number(t.amount || 0), 0),
    cancelledCount: transactions.filter(t => ['cancelled', 'refunded', 'chargeback'].includes(t.status)).length,
    refundedAmount: transactions
      .filter(t => ['refunded', 'chargeback'].includes(t.status))
      .reduce((s, t) => s + Number(t.amount || 0), 0),
    avgTicket: 0,
    conversionRate: 0,
    topProducts: [] as { name: string; count: number; revenue: number }[],
    dailySales: [] as { date: string; sales: number; revenue: number }[],
  };

  // Avg ticket
  if (stats.totalSales > 0) {
    stats.avgTicket = stats.totalRevenue / stats.totalSales;
  }

  // Conversion rate (approved / total)
  if (transactions.length > 0) {
    stats.conversionRate = (stats.totalSales / transactions.length) * 100;
  }

  // Top products
  const byProduct: Record<string, { count: number; revenue: number }> = {};
  transactions
    .filter(t => t.status === 'approved')
    .forEach(t => {
      const name = t.product_name || 'Sem nome';
      if (!byProduct[name]) byProduct[name] = { count: 0, revenue: 0 };
      byProduct[name].count++;
      byProduct[name].revenue += Number(t.amount || 0);
    });
  stats.topProducts = Object.entries(byProduct)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue);

  // Daily sales
  const byDay: Record<string, { sales: number; revenue: number }> = {};
  transactions
    .filter(t => t.status === 'approved' && t.paid_at)
    .forEach(t => {
      const day = t.paid_at!.split('T')[0];
      if (!byDay[day]) byDay[day] = { sales: 0, revenue: 0 };
      byDay[day].sales++;
      byDay[day].revenue += Number(t.amount || 0);
    });
  stats.dailySales = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, ...d }));

  return { stats, transactions, isLoading };
}
