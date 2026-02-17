import { Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

function KpiCard({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: boolean }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          {icon && <Info className="h-3.5 w-3.5 text-muted-foreground/50" />}
        </div>
        <p className={`text-xl font-bold ${color || 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function ResumoView({ metrics, campaigns, isLoading, onSync, isSyncing, datePreset, onDatePresetChange }: ResumoViewProps) {
  const safeMetrics = metrics || [];
  const safeCampaigns = campaigns || [];

  // Real aggregated metrics
  const totalSpend = safeMetrics.reduce((s, m) => s + Number(m.spend || 0), 0);
  const totalClicks = safeMetrics.reduce((s, m) => s + Number(m.clicks || 0), 0);
  const totalImpressions = safeMetrics.reduce((s, m) => s + Number(m.impressions || 0), 0);

  const totalConversions = safeCampaigns.reduce((s, c) => s + Number(c.conversions || 0), 0);
  // Calculate real ROAS from action_values stored in roas field
  const totalRevenue = safeCampaigns.reduce((s, c) => s + (Number(c.roas || 0) * Number(c.spend || 0)), 0);

  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const realRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const lucro = totalRevenue - totalSpend;
  const margem = totalRevenue > 0 ? (lucro / totalRevenue) * 100 : 0;
  const roi = totalSpend > 0 ? (lucro / totalSpend) * 100 : 0;

  // Real funnel data
  const funnelData = [
    { name: 'Impressões', value: totalImpressions, pct: '100%' },
    { name: 'Cliques', value: totalClicks, pct: totalImpressions > 0 ? `${ctr.toFixed(1)}%` : '0%' },
    { name: 'Conversões', value: totalConversions, pct: totalClicks > 0 ? `${((totalConversions / totalClicks) * 100).toFixed(2)}%` : '0%' },
  ];

  // Build daily data from real metrics for charts
  const dailyMap = new Map<string, { date: string; spend: number; revenue: number; clicks: number; impressions: number }>();
  safeMetrics.forEach(m => {
    const date = m.date_start;
    if (!date) return;
    const existing = dailyMap.get(date) || { date, spend: 0, revenue: 0, clicks: 0, impressions: 0 };
    existing.spend += Number(m.spend || 0);
    existing.clicks += Number(m.clicks || 0);
    existing.impressions += Number(m.impressions || 0);
    dailyMap.set(date, existing);
  });
  // Add revenue from campaigns
  safeCampaigns.forEach(c => {
    const date = c.date_start;
    if (!date) return;
    const existing = dailyMap.get(date) || { date, spend: 0, revenue: 0, clicks: 0, impressions: 0 };
    existing.revenue += Number(c.roas || 0) * Number(c.spend || 0);
    dailyMap.set(date, existing);
  });

  const dailyData = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      lucro: d.revenue - d.spend,
      label: (() => { try { return format(parseISO(d.date), 'dd/MM', { locale: ptBR }); } catch { return d.date; } })(),
    }));

  // Campaign breakdown for pie chart (top 5 by spend)
  const campaignAgg = new Map<string, { name: string; spend: number }>();
  safeCampaigns.forEach(c => {
    const key = c.campaign_id;
    const existing = campaignAgg.get(key);
    if (existing) {
      existing.spend += Number(c.spend || 0);
    } else {
      campaignAgg.set(key, { name: c.campaign_name || 'Sem nome', spend: Number(c.spend || 0) });
    }
  });
  const topCampaigns = Array.from(campaignAgg.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);
  const pieColors = ['hsl(var(--primary))', 'hsl(210, 100%, 56%)', 'hsl(45, 100%, 51%)', 'hsl(150, 60%, 45%)', 'hsl(280, 60%, 55%)'];
  const pieData = topCampaigns.map((c, i) => ({
    name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name,
    value: Math.round(c.spend * 100) / 100,
    color: pieColors[i % pieColors.length],
  }));

  const hasData = safeMetrics.length > 0 || safeCampaigns.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Resumo</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {hasData ? `${safeMetrics.length} registros` : 'Sem dados'}
          </span>
          <Button size="sm" onClick={onSync} disabled={isSyncing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 grid grid-cols-5 gap-4 border-b border-border">
        <div>
          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            Período de Visualização <Info className="h-3 w-3 text-muted-foreground/50" />
          </label>
          <Select value={datePreset} onValueChange={onDatePresetChange}>
            <SelectTrigger className="h-9 text-sm bg-card border-border">
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
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Conta de Anúncio</label>
          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="h-9 text-sm bg-card border-border"><SelectValue placeholder="Qualquer" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Qualquer</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Fonte de Tráfego</label>
          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="h-9 text-sm bg-card border-border"><SelectValue placeholder="Qualquer" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Qualquer</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Plataforma</label>
          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="h-9 text-sm bg-card border-border"><SelectValue placeholder="Qualquer" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Qualquer</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Produto</label>
          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="h-9 text-sm bg-card border-border"><SelectValue placeholder="Qualquer" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Qualquer</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Sincronizando dados...
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <p className="text-sm">Nenhum dado encontrado para o período selecionado.</p>
            <p className="text-xs">Conecte seu Facebook, selecione contas e clique em Atualizar.</p>
          </div>
        ) : (
          <>
            {/* KPI Row 1 - Financial */}
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="Faturamento (Receita)" value={formatCurrency(totalRevenue)} icon />
              <KpiCard label="Gastos com Anúncios" value={formatCurrency(totalSpend)} icon />
              <KpiCard label="Margem" value={`${margem.toFixed(1)}%`} color={margem > 0 ? "text-emerald-500" : "text-red-500"} icon />
              <KpiCard label="Lucro" value={formatCurrency(lucro)} color={lucro >= 0 ? "text-emerald-500" : "text-red-500"} icon />
            </div>

            {/* KPI Row 2 - Performance */}
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="ROAS" value={realRoas.toFixed(2)} color={realRoas >= 1 ? "text-emerald-500" : "text-red-500"} icon />
              <KpiCard label="ROI" value={`${roi.toFixed(1)}%`} color={roi >= 0 ? "text-emerald-500" : "text-red-500"} icon />
              <KpiCard label="CPA" value={formatCurrency(cpa)} icon />
              <KpiCard label="Conversões" value={totalConversions.toLocaleString('pt-BR')} icon />
            </div>

            {/* KPI Row 3 - Traffic */}
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="Cliques" value={totalClicks.toLocaleString('pt-BR')} icon />
              <KpiCard label="Impressões" value={totalImpressions.toLocaleString('pt-BR')} icon />
              <KpiCard label="CTR" value={`${ctr.toFixed(2)}%`} icon />
              <KpiCard label="CPC" value={formatCurrency(cpc)} icon />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Gasto por Campanha (Pie) */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Gasto por Campanha (Top 5)</span>
                  </div>
                  {pieData.length > 0 ? (
                    <>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" label={({ value }) => formatCurrency(value)}>
                              {pieData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {pieData.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">Sem dados de campanhas</p>
                  )}
                </CardContent>
              </Card>

              {/* CPM por dia */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">CPM Diário</span>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData.map(d => ({
                        ...d,
                        cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${v.toFixed(0)}`} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="cpm" fill="hsl(210, 100%, 56%)" name="CPM" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Funil de Conversão */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Funil de Conversão (Meta Ads)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mt-8">
                    {funnelData.map((step, i) => (
                      <div key={i}>
                        <span className="text-[10px] text-muted-foreground block mb-1">{step.name}</span>
                        <span className={`text-sm font-bold block ${i >= 2 ? 'text-emerald-500' : 'text-foreground'}`}>{step.pct}</span>
                        <span className="text-[10px] text-muted-foreground block">{step.value.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Investimento x Faturamento x Lucro por Dia */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">Investimento x Faturamento x Lucro por Dia</span>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${v.toFixed(0)}`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="spend" stroke="hsl(30, 100%, 50%)" fill="hsl(30, 100%, 50%)" fillOpacity={0.1} name="Investimento" />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(210, 100%, 56%)" fill="hsl(210, 100%, 56%)" fillOpacity={0.1} name="Faturamento" />
                      <Area type="monotone" dataKey="lucro" stroke="hsl(150, 60%, 45%)" fill="hsl(150, 60%, 45%)" fillOpacity={0.1} name="Lucro" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
