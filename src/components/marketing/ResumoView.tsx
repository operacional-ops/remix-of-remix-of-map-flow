import { Info, RefreshCw, ShoppingCart, CreditCard, TrendingUp, TrendingDown, DollarSign, Target, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePaytSalesBreakdown, type PaytSalesBreakdown } from '@/hooks/useUnifiedMetrics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface ResumoViewProps {
  metrics: any[] | undefined;
  campaigns: any[] | undefined;
  isLoading: boolean;
  onSync: () => void;
  isSyncing: boolean;
  datePreset: string;
  onDatePresetChange: (v: string) => void;
}

function KpiCard({ label, value, color, icon, subLabel }: { label: string; value: string; color?: string; icon?: React.ReactNode; subLabel?: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
          {icon || <Info className="h-3.5 w-3.5 text-muted-foreground/50" />}
        </div>
        <p className={`text-xl font-bold ${color || 'text-foreground'}`}>{value}</p>
        {subLabel && <p className="text-[10px] text-muted-foreground mt-0.5">{subLabel}</p>}
      </CardContent>
    </Card>
  );
}

const paymentMethodLabels: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  pix: 'PIX',
  boleto: 'Boleto',
  debit_card: 'Cartão de Débito',
};

export default function ResumoView({ metrics, campaigns, isLoading, onSync, isSyncing, datePreset, onDatePresetChange }: ResumoViewProps) {
  const { breakdown: payt, isLoading: paytLoading } = usePaytSalesBreakdown(datePreset);

  const safeMetrics = metrics || [];
  const safeCampaigns = campaigns || [];

  // === META (GASTOS) ===
  const totalSpend = safeMetrics.reduce((s, m) => s + Number(m.spend || 0), 0);
  const totalClicks = safeMetrics.reduce((s, m) => s + Number(m.clicks || 0), 0);
  const totalImpressions = safeMetrics.reduce((s, m) => s + Number(m.impressions || 0), 0);
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // === PAYT (VENDAS) — dados reais ===
  const totalVendas = payt.totalVendas;
  const totalFaturamento = payt.totalFaturamento;
  const avgTicket = payt.avgTicket;

  // === UNIFICADO ===
  const lucro = totalFaturamento - totalSpend;
  const margem = totalFaturamento > 0 ? (lucro / totalFaturamento) * 100 : 0;
  const roi = totalSpend > 0 ? (lucro / totalSpend) * 100 : 0;
  const roas = totalSpend > 0 ? totalFaturamento / totalSpend : 0;
  const cpa = totalVendas > 0 ? totalSpend / totalVendas : 0;

  // === FUNIL REAL ===
  const funnelData = [
    { name: 'Impressões', value: totalImpressions, pct: '100%' },
    { name: 'Cliques', value: totalClicks, pct: totalImpressions > 0 ? `${ctr.toFixed(1)}%` : '0%' },
    { name: 'Checkouts Perdidos', value: payt.totalLostCart, pct: totalClicks > 0 ? `${((payt.totalLostCart / totalClicks) * 100).toFixed(2)}%` : '0%' },
    { name: 'Vendas (PAYT)', value: totalVendas, pct: totalClicks > 0 ? `${((totalVendas / totalClicks) * 100).toFixed(2)}%` : '0%' },
  ];

  // === DAILY UNIFIED CHART ===
  const dailyMap = new Map<string, { date: string; spend: number; faturamento: number; vendas: number }>();
  safeMetrics.forEach(m => {
    const date = m.date_start;
    if (!date) return;
    const existing = dailyMap.get(date) || { date, spend: 0, faturamento: 0, vendas: 0 };
    existing.spend += Number(m.spend || 0);
    dailyMap.set(date, existing);
  });
  payt.dailySales.forEach(d => {
    const existing = dailyMap.get(d.date) || { date: d.date, spend: 0, faturamento: 0, vendas: 0 };
    existing.faturamento += d.faturamento;
    existing.vendas += d.vendas;
    dailyMap.set(d.date, existing);
  });
  const dailyData = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      lucro: d.faturamento - d.spend,
      label: (() => { try { return format(parseISO(d.date), 'dd/MM', { locale: ptBR }); } catch { return d.date; } })(),
    }));

  // === PIE: PAYMENT METHOD ===
  const pmColors = ['hsl(var(--primary))', 'hsl(210, 100%, 56%)', 'hsl(45, 100%, 51%)', 'hsl(150, 60%, 45%)'];
  const pmPieData = payt.byPaymentMethod.map((pm, i) => ({
    name: paymentMethodLabels[pm.method] || pm.method,
    value: pm.revenue,
    count: pm.count,
    color: pmColors[i % pmColors.length],
  }));

  // === PIE: PRODUCT BREAKDOWN ===
  const prodColors = ['hsl(280, 60%, 55%)', 'hsl(var(--primary))', 'hsl(45, 100%, 51%)', 'hsl(150, 60%, 45%)', 'hsl(210, 100%, 56%)'];
  const prodPieData = payt.byProduct.slice(0, 5).map((p, i) => ({
    name: p.name.length > 25 ? p.name.slice(0, 25) + '…' : p.name,
    value: p.revenue,
    count: p.count,
    color: prodColors[i % prodColors.length],
  }));

  const hasData = safeMetrics.length > 0 || totalVendas > 0;
  const loading = isLoading || paytLoading;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Resumo Unificado</h2>
          <p className="text-[11px] text-muted-foreground">Meta Ads (Gastos) + PAYT (Vendas)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {hasData ? `${totalVendas} vendas · ${safeMetrics.length} métricas` : 'Sem dados'}
          </span>
          <Button size="sm" onClick={onSync} disabled={isSyncing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Período</label>
            <Select value={datePreset} onValueChange={onDatePresetChange}>
              <SelectTrigger className="h-8 text-xs bg-card border-border w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
                <SelectItem value="last_14d">Últimos 14 dias</SelectItem>
                <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
                <SelectItem value="this_month">Este mês</SelectItem>
                <SelectItem value="last_month">Mês passado</SelectItem>
                <SelectItem value="maximum">Máximo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-500 text-[10px] font-medium rounded-full">
              PAYT ✓ Conectada
            </span>
            <span className="px-2.5 py-1 bg-blue-500/15 text-blue-500 text-[10px] font-medium rounded-full">
              Meta Ads ✓ Conectado
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Carregando dados...
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <p className="text-sm">Nenhum dado encontrado para o período selecionado.</p>
            <p className="text-xs">Conecte Meta Ads + PAYT e clique em Atualizar.</p>
          </div>
        ) : (
          <>
            {/* KPI Row 1 — Financeiro Unificado */}
            <div className="grid grid-cols-5 gap-3">
              <KpiCard
                label="Faturamento (PAYT)"
                value={formatCurrency(totalFaturamento)}
                icon={<DollarSign className="h-3.5 w-3.5 text-emerald-500" />}
                subLabel={`${totalVendas} vendas aprovadas`}
              />
              <KpiCard
                label="Gastos (Meta Ads)"
                value={formatCurrency(totalSpend)}
                icon={<TrendingDown className="h-3.5 w-3.5 text-red-400" />}
              />
              <KpiCard
                label="Lucro"
                value={formatCurrency(lucro)}
                color={lucro >= 0 ? 'text-emerald-500' : 'text-red-500'}
                icon={lucro >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
              />
              <KpiCard
                label="Margem"
                value={`${margem.toFixed(1)}%`}
                color={margem > 0 ? 'text-emerald-500' : 'text-red-500'}
              />
              <KpiCard
                label="ROI"
                value={`${roi.toFixed(1)}%`}
                color={roi >= 0 ? 'text-emerald-500' : 'text-red-500'}
              />
            </div>

            {/* KPI Row 2 — Performance */}
            <div className="grid grid-cols-5 gap-3">
              <KpiCard label="ROAS" value={roas.toFixed(2)} color={roas >= 1 ? 'text-emerald-500' : 'text-red-500'} subLabel="Faturamento / Gasto" />
              <KpiCard label="CPA" value={formatCurrency(cpa)} subLabel="Custo por Venda" icon={<Target className="h-3.5 w-3.5 text-orange-400" />} />
              <KpiCard label="Ticket Médio" value={formatCurrency(avgTicket)} icon={<ShoppingCart className="h-3.5 w-3.5 text-blue-400" />} />
              <KpiCard label="CPC" value={formatCurrency(cpc)} />
              <KpiCard label="CPM" value={formatCurrency(cpm)} />
            </div>

            {/* KPI Row 3 — Tráfego + Carrinhos */}
            <div className="grid grid-cols-5 gap-3">
              <KpiCard label="Cliques" value={totalClicks.toLocaleString('pt-BR')} />
              <KpiCard label="Impressões" value={totalImpressions.toLocaleString('pt-BR')} />
              <KpiCard label="CTR" value={`${ctr.toFixed(2)}%`} />
              <KpiCard label="Carrinhos Perdidos" value={String(payt.totalLostCart)} color="text-orange-400" />
              <KpiCard label="Pendentes / Expiradas" value={`${payt.totalPending}`} subLabel={formatCurrency(payt.pendingAmount)} />
            </div>

            {/* Funnel */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-sm font-semibold text-foreground mb-3 block">Funil de Conversão (Meta → PAYT)</span>
                <div className="grid grid-cols-4 gap-3">
                  {funnelData.map((step, i) => {
                    const isLast = i === funnelData.length - 1;
                    const bgColors = ['bg-blue-500/10', 'bg-blue-500/10', 'bg-orange-500/10', 'bg-emerald-500/10'];
                    const textColors = ['text-blue-500', 'text-blue-500', 'text-orange-500', 'text-emerald-500'];
                    return (
                      <div key={i} className={`rounded-lg p-3 ${bgColors[i]} text-center`}>
                        <span className="text-[10px] text-muted-foreground block mb-1">{step.name}</span>
                        <span className={`text-lg font-bold block ${textColors[i]}`}>{step.value.toLocaleString('pt-BR')}</span>
                        <span className="text-[10px] text-muted-foreground block">{step.pct}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Payment Method Pie */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Vendas por Método de Pagamento</span>
                  </div>
                  {pmPieData.length > 0 ? (
                    <>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pmPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value"
                              label={({ name, count }) => `${name} (${count})`}>
                              {pmPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {pmPieData.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            {d.name}: {formatCurrency(d.value)}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p className="text-xs text-muted-foreground text-center py-8">Sem vendas no período</p>}
                </CardContent>
              </Card>

              {/* Product Breakdown Pie */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PieIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Vendas por Produto (PAYT)</span>
                  </div>
                  {prodPieData.length > 0 ? (
                    <>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={prodPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value"
                              label={({ count }) => `${count}x`}>
                              {prodPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {prodPieData.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p className="text-xs text-muted-foreground text-center py-8">Sem vendas no período</p>}
                </CardContent>
              </Card>
            </div>

            {/* Investimento x Faturamento x Lucro por Dia */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-sm font-semibold text-foreground mb-3 block">
                  Investimento (Meta) x Faturamento (PAYT) x Lucro por Dia
                </span>
                {dailyData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${v.toFixed(0)}`} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Legend />
                        <Area type="monotone" dataKey="spend" stroke="hsl(0, 80%, 55%)" fill="hsl(0, 80%, 55%)" fillOpacity={0.1} name="Gastos (Meta)" />
                        <Area type="monotone" dataKey="faturamento" stroke="hsl(210, 100%, 56%)" fill="hsl(210, 100%, 56%)" fillOpacity={0.1} name="Faturamento (PAYT)" />
                        <Area type="monotone" dataKey="lucro" stroke="hsl(150, 60%, 45%)" fill="hsl(150, 60%, 45%)" fillOpacity={0.1} name="Lucro" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-8">Sem dados diários</p>}
              </CardContent>
            </Card>

            {/* Daily Sales Bar Chart */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-sm font-semibold text-foreground mb-3 block">Vendas por Dia (PAYT)</span>
                {dailyData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip formatter={(v: number, name: string) => name === 'vendas' ? `${v} vendas` : formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="vendas" fill="hsl(var(--primary))" name="Vendas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-8">Sem vendas no período</p>}
              </CardContent>
            </Card>

            {/* Products Table */}
            {payt.byProduct.length > 0 && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <span className="text-sm font-semibold text-foreground mb-3 block">Performance por Produto (PAYT)</span>
                  <ScrollArea className="max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-[11px] font-semibold">PRODUTO</TableHead>
                          <TableHead className="text-[11px] font-semibold text-right">VENDAS</TableHead>
                          <TableHead className="text-[11px] font-semibold text-right">FATURAMENTO</TableHead>
                          <TableHead className="text-[11px] font-semibold text-right">TICKET MÉDIO</TableHead>
                          <TableHead className="text-[11px] font-semibold text-right">% DO TOTAL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payt.byProduct.map((p, i) => (
                          <TableRow key={i} className="hover:bg-muted/20">
                            <TableCell className="text-xs font-medium">{p.name}</TableCell>
                            <TableCell className="text-xs text-right">{p.count}</TableCell>
                            <TableCell className="text-xs text-right">{formatCurrency(p.revenue)}</TableCell>
                            <TableCell className="text-xs text-right">{formatCurrency(p.count > 0 ? p.revenue / p.count : 0)}</TableCell>
                            <TableCell className="text-xs text-right">{totalFaturamento > 0 ? `${((p.revenue / totalFaturamento) * 100).toFixed(1)}%` : '0%'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
