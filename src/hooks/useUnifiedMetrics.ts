import { useMemo } from 'react';
import { usePaytTransactions, type PaytTransaction } from './usePaytTransactions';
import { getDateRangeFromPreset } from '@/lib/datePresets';
import { isWithinInterval, parseISO } from 'date-fns';

export interface PaytSalesBreakdown {
  totalVendas: number;
  totalFaturamento: number;
  totalPending: number;
  pendingAmount: number;
  totalCancelled: number;
  cancelledAmount: number;
  totalLostCart: number;
  avgTicket: number;
  byProduct: { name: string; count: number; revenue: number }[];
  byPaymentMethod: { method: string; count: number; revenue: number }[];
  byCampaignId: Map<string, { vendas: number; faturamento: number }>;
  dailySales: { date: string; vendas: number; faturamento: number }[];
  transactions: PaytTransaction[];
}

function extractUtmId(t: PaytTransaction): string | null {
  try {
    const payload = t.raw_payload as any;
    return payload?.link?.query_params?.utm_id || null;
  } catch {
    return null;
  }
}

function extractUtmCampaign(t: PaytTransaction): string | null {
  try {
    const payload = t.raw_payload as any;
    return payload?.link?.query_params?.utm_campaign || payload?.sources?.utm_campaign || null;
  } catch {
    return null;
  }
}

function extractUtmSource(t: PaytTransaction): string | null {
  try {
    const payload = t.raw_payload as any;
    return payload?.link?.query_params?.utm_source || payload?.sources?.utm_source || null;
  } catch {
    return null;
  }
}

export function usePaytSalesBreakdown(datePreset: string) {
  const { data: transactions = [], isLoading } = usePaytTransactions();

  const breakdown = useMemo<PaytSalesBreakdown>(() => {
    // Filter by date
    const range = getDateRangeFromPreset(datePreset);
    const filtered = range
      ? transactions.filter(t => {
          const dateStr = t.paid_at || t.created_at;
          if (!dateStr) return false;
          try {
            return isWithinInterval(parseISO(dateStr), { start: range.start, end: range.end });
          } catch {
            return false;
          }
        })
      : transactions;

    const approved = filtered.filter(t => t.status === 'approved');
    const pending = filtered.filter(t => t.status === 'pending' || t.status === 'expired');
    const cancelled = filtered.filter(t => ['cancelled', 'refunded', 'chargeback'].includes(t.status));
    const lostCart = filtered.filter(t => t.status === 'lost_cart');

    const totalFaturamento = approved.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalVendas = approved.length;

    // By product
    const prodMap: Record<string, { count: number; revenue: number }> = {};
    approved.forEach(t => {
      const name = t.product_name || 'Sem nome';
      if (!prodMap[name]) prodMap[name] = { count: 0, revenue: 0 };
      prodMap[name].count++;
      prodMap[name].revenue += Number(t.amount || 0);
    });

    // By payment method
    const pmMap: Record<string, { count: number; revenue: number }> = {};
    approved.forEach(t => {
      const method = t.payment_method || 'Outros';
      if (!pmMap[method]) pmMap[method] = { count: 0, revenue: 0 };
      pmMap[method].count++;
      pmMap[method].revenue += Number(t.amount || 0);
    });

    // By campaign ID (utm_id from query_params)
    const byCampaignId = new Map<string, { vendas: number; faturamento: number }>();
    approved.forEach(t => {
      const utmId = extractUtmId(t);
      if (utmId) {
        const existing = byCampaignId.get(utmId) || { vendas: 0, faturamento: 0 };
        existing.vendas++;
        existing.faturamento += Number(t.amount || 0);
        byCampaignId.set(utmId, existing);
      }
    });

    // Daily sales
    const dayMap: Record<string, { vendas: number; faturamento: number }> = {};
    approved.forEach(t => {
      const dateStr = t.paid_at || t.created_at;
      if (!dateStr) return;
      const day = dateStr.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { vendas: 0, faturamento: 0 };
      dayMap[day].vendas++;
      dayMap[day].faturamento += Number(t.amount || 0);
    });

    return {
      totalVendas,
      totalFaturamento,
      totalPending: pending.length,
      pendingAmount: pending.reduce((s, t) => s + Number(t.amount || 0), 0),
      totalCancelled: cancelled.length,
      cancelledAmount: cancelled.reduce((s, t) => s + Number(t.amount || 0), 0),
      totalLostCart: lostCart.length,
      avgTicket: totalVendas > 0 ? totalFaturamento / totalVendas : 0,
      byProduct: Object.entries(prodMap)
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.revenue - a.revenue),
      byPaymentMethod: Object.entries(pmMap)
        .map(([method, d]) => ({ method, ...d }))
        .sort((a, b) => b.revenue - a.revenue),
      byCampaignId,
      dailySales: Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => ({ date, ...d })),
      transactions: filtered,
    };
  }, [transactions, datePreset]);

  return { breakdown, isLoading };
}

/**
 * Match PAYT sales to Meta campaign rows using utm_id.
 * The utm_id from PAYT corresponds to campaign_id in facebook_campaign_insights.
 */
export function matchSalesToCampaign(
  campaignId: string,
  byCampaignId: Map<string, { vendas: number; faturamento: number }>
): { vendas: number; faturamento: number } {
  return byCampaignId.get(campaignId) || { vendas: 0, faturamento: 0 };
}

/**
 * Match PAYT sales to adset/ad rows by looking up their parent campaign_id.
 */
export function matchSalesViaParentCampaign(
  parentCampaignId: string | undefined | null,
  byCampaignId: Map<string, { vendas: number; faturamento: number }>
): { vendas: number; faturamento: number } {
  if (!parentCampaignId) return { vendas: 0, faturamento: 0 };
  return byCampaignId.get(parentCampaignId) || { vendas: 0, faturamento: 0 };
}
