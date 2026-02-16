import { useState } from 'react';
import { RefreshCw, TrendingUp, Eye, MousePointerClick, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFacebookMetrics, useSyncFacebookMetrics } from '@/hooks/useFacebookMetrics';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(val: number) {
  return val.toLocaleString('pt-BR');
}

export default function FacebookMetricsCard() {
  const [accountId, setAccountId] = useState('');
  const { activeWorkspace } = useWorkspace();
  const { data: metrics, isLoading } = useFacebookMetrics(activeWorkspace?.id);
  const syncMutation = useSyncFacebookMetrics();

  const handleSync = () => {
    if (!accountId.trim()) return;
    syncMutation.mutate({ accountId: accountId.trim(), workspaceId: activeWorkspace?.id });
  };

  const totalSpend = metrics?.reduce((s, m) => s + Number(m.spend), 0) || 0;
  const totalImpressions = metrics?.reduce((s, m) => s + Number(m.impressions), 0) || 0;
  const totalClicks = metrics?.reduce((s, m) => s + Number(m.clicks), 0) || 0;
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const chartData = (metrics || []).slice(0, 14).reverse().map(m => ({
    name: new Date(m.date_start + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    gasto: Number(m.spend),
  }));

  const summaryCards = [
    { title: 'Gasto Total', value: formatCurrency(totalSpend), icon: DollarSign, color: 'text-red-500' },
    { title: 'Impressões', value: formatNumber(totalImpressions), icon: Eye, color: 'text-blue-500' },
    { title: 'Cliques', value: formatNumber(totalClicks), icon: MousePointerClick, color: 'text-emerald-500' },
    { title: 'CTR Médio', value: `${avgCtr.toFixed(2)}%`, icon: TrendingUp, color: 'text-amber-500' },
  ];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Meta Ads — Marketing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync bar */}
        <div className="flex gap-2 items-center">
          <Input
            placeholder="ID da Conta (ex: act_123456)"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="max-w-xs text-sm"
          />
          <Button
            size="sm"
            onClick={handleSync}
            disabled={syncMutation.isPending || !accountId.trim()}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map(card => (
            <Card key={card.title} className="bg-muted/30">
              <CardContent className="p-4 flex items-center gap-3">
                <card.icon className={`h-8 w-8 ${card.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="text-lg font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Gasto']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="gasto" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="hsl(var(--primary))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Carregando métricas...</p>}
        {!isLoading && (!metrics || metrics.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum dado sincronizado ainda. Insira o ID da conta e clique em Sincronizar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
