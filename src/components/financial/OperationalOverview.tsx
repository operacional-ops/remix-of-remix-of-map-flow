import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, TrendingUp, ShoppingCart, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useOperationalProducts, type OperationalMetric } from '@/hooks/useOperationalProducts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function useAllOperationalMetrics(productIds: string[]) {
  return useQuery({
    queryKey: ['operational-metrics', 'financial-overview', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from('operational_metrics')
        .select('*')
        .in('product_id', productIds)
        .order('data', { ascending: true });
      if (error) throw error;
      return data as OperationalMetric[];
    },
    enabled: productIds.length > 0,
    staleTime: 60000,
  });
}

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface OperationalOverviewProps {
  financialEntradas: number;
  financialSaidas: number;
}

export function OperationalOverview({ financialEntradas, financialSaidas }: OperationalOverviewProps) {
  const { activeWorkspace } = useWorkspace();
  const { data: products, isLoading: loadingProducts } = useOperationalProducts();
  const productIds = useMemo(() => products?.map(p => p.id) || [], [products]);
  const { data: metrics = [], isLoading: loadingMetrics } = useAllOperationalMetrics(productIds);

  const loading = loadingProducts || loadingMetrics;

  const kpis = useMemo(() => {
    const totalGastos = metrics.reduce((s, m) => s + Number(m.gastos || 0), 0);
    const totalResultado = metrics.reduce((s, m) => s + Number(m.resultado || 0), 0);
    const totalLucro = metrics.reduce((s, m) => s + Number(m.lucro_bruto || 0), 0);
    const totalVendas = metrics.reduce((s, m) => s + Number(m.qnt_vendas || 0), 0);
    const avgRoas = totalGastos > 0 ? totalResultado / totalGastos : 0;
    const avgCpa = totalVendas > 0 ? totalGastos / totalVendas : 0;
    const avgTicket = totalVendas > 0 ? totalResultado / totalVendas : 0;
    const marginContrib = avgTicket - avgCpa;
    return { totalGastos, totalResultado, totalLucro, totalVendas, avgRoas, avgCpa, avgTicket, marginContrib };
  }, [metrics]);

  // Chart: daily revenue vs spend (last 30 days)
  const dailyChart = useMemo(() => {
    const byDay: Record<string, { receita: number; gastos: number; lucro: number }> = {};
    metrics.forEach(m => {
      if (!byDay[m.data]) byDay[m.data] = { receita: 0, gastos: 0, lucro: 0 };
      byDay[m.data].receita += Number(m.resultado || 0);
      byDay[m.data].gastos += Number(m.gastos || 0);
      byDay[m.data].lucro += Number(m.lucro_bruto || 0);
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([day, vals]) => ({
        day: format(parseISO(day), 'dd/MMM', { locale: ptBR }),
        ...vals,
      }));
  }, [metrics]);

  // ROAS evolution
  const roasEvolution = useMemo(() => {
    const byDay: Record<string, { receita: number; gastos: number }> = {};
    metrics.forEach(m => {
      if (!byDay[m.data]) byDay[m.data] = { receita: 0, gastos: 0 };
      byDay[m.data].receita += Number(m.resultado || 0);
      byDay[m.data].gastos += Number(m.gastos || 0);
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([day, vals]) => ({
        day: format(parseISO(day), 'dd/MMM', { locale: ptBR }),
        roas: vals.gastos > 0 ? vals.receita / vals.gastos : 0,
      }));
  }, [metrics]);

  // Cross-reference: % do faturamento que vem de tráfego
  const trafficRevenueShare = financialEntradas > 0
    ? ((kpis.totalResultado / financialEntradas) * 100)
    : 0;

  if (!activeWorkspace) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          <AlertTriangle className="h-5 w-5 mx-auto mb-2 opacity-50" />
          Selecione um workspace para visualizar dados operacionais.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          <Activity className="h-5 w-5 mx-auto mb-2 opacity-50" />
          Sem dados operacionais. Importe métricas no DRX Analytics primeiro.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Operacional (Tráfego Pago)
        </h2>
        <Badge variant="outline" className="text-[10px]">
          {metrics.length} registros · {products?.length || 0} produtos
        </Badge>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Receita Ads</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(kpis.totalResultado)}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
              <Megaphone className="h-4 w-4" />
              <span className="text-xs font-medium">Gastos Ads</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(kpis.totalGastos)}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Lucro Bruto</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(kpis.totalLucro)}</p>
          </CardContent>
        </Card>
        <Card className={`${kpis.avgRoas >= 2 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
          <CardContent className="p-4">
            <div className={`flex items-center gap-2 mb-1 ${kpis.avgRoas >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">ROAS</span>
            </div>
            <p className="text-lg font-bold text-foreground">{kpis.avgRoas.toFixed(2)}x</p>
          </CardContent>
        </Card>
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs font-medium">Vendas</span>
            </div>
            <p className="text-lg font-bold text-foreground">{kpis.totalVendas}</p>
          </CardContent>
        </Card>
        <Card className={`${kpis.marginContrib >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <CardContent className="p-4">
            <div className={`flex items-center gap-2 mb-1 ${kpis.marginContrib >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">Margem Unit.</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(kpis.marginContrib)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cross-reference card + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue vs Spend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita vs Gastos (Tráfego Pago)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {dailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="gastos" fill="hsl(0, 62%, 50%)" opacity={0.6} radius={[3, 3, 0, 0]} name="Gastos" />
                    <Line type="monotone" dataKey="receita" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} name="Receita" />
                    <Line type="monotone" dataKey="lucro" stroke="hsl(221, 83%, 53%)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Lucro" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Sem dados diários
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cross-references */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">🔗 Cruzamento Financeiro × Operação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Receita Ads / Entradas Financeiras</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{trafficRevenueShare.toFixed(1)}%</span>
                <span className="text-xs text-muted-foreground">do faturamento vem de tráfego</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">CPA Médio</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${kpis.avgCpa <= 30 ? 'text-emerald-500' : kpis.avgCpa <= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {formatCurrency(kpis.avgCpa)}
                </span>
                <Badge variant={kpis.avgCpa <= 30 ? 'default' : kpis.avgCpa <= 50 ? 'secondary' : 'destructive'} className="text-[10px]">
                  {kpis.avgCpa <= 30 ? 'Saudável' : kpis.avgCpa <= 50 ? 'Atenção' : 'Crítico'}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
              <span className="text-xl font-bold">{formatCurrency(kpis.avgTicket)}</span>
            </div>

            {/* ROAS sparkline */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Evolução ROAS (30d)</p>
              <div className="h-[60px]">
                {roasEvolution.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={roasEvolution} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <defs>
                        <linearGradient id="roasGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="roas" stroke="hsl(142, 71%, 45%)" fill="url(#roasGrad)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-muted-foreground">Poucos dados</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
