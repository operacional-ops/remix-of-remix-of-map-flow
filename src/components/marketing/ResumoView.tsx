import { Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

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
  // Aggregate metrics
  const totalSpend = (metrics || []).reduce((s, m) => s + Number(m.spend || 0), 0);
  const totalClicks = (metrics || []).reduce((s, m) => s + Number(m.clicks || 0), 0);
  const totalImpressions = (metrics || []).reduce((s, m) => s + Number(m.impressions || 0), 0);

  const totalConversions = (campaigns || []).reduce((s, c) => s + Number(c.conversions || 0), 0);
  const totalCampaignSpend = (campaigns || []).reduce((s, c) => s + Number(c.spend || 0), 0);

  const cpa = totalConversions > 0 ? totalCampaignSpend / totalConversions : 0;
  const roas = totalCampaignSpend > 0 ? (totalConversions * cpa) / totalCampaignSpend : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Fake funnel data based on real metrics
  const funnelData = [
    { name: 'Cliques', value: totalClicks, pct: '100%' },
    { name: 'Vis. Página', value: Math.round(totalClicks * 0.63), pct: '63.1%' },
    { name: 'ICs', value: Math.round(totalClicks * 0.104), pct: '10.4%' },
    { name: 'Vendas Inic.', value: Math.round(totalClicks * 0.017), pct: '1.7%' },
    { name: 'Vendas Apr.', value: totalConversions, pct: totalClicks > 0 ? `${((totalConversions / totalClicks) * 100).toFixed(1)}%` : '0%' },
  ];

  // Hourly placeholder data
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    investimento: Math.random() * totalSpend * 0.08,
    faturamento: Math.random() * totalSpend * 0.12,
    lucro: Math.random() * totalSpend * 0.04 - totalSpend * 0.01,
  }));

  const pieData = [
    { name: 'Pix', value: 83, color: 'hsl(var(--primary))' },
    { name: 'Cartão', value: 16, color: 'hsl(210, 100%, 56%)' },
    { name: 'Boleto', value: 1, color: 'hsl(45, 100%, 51%)' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Resumo</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Atualizado agora mesmo</span>
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
          <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>
        ) : (
          <>
            {/* KPI Row 1 */}
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="Faturamento Líquido" value={formatCurrency(totalConversions * cpa * 1.5)} icon />
              <KpiCard label="Gastos com anúncios" value={formatCurrency(totalSpend)} icon />
              <KpiCard label="Margem" value={totalSpend > 0 ? `${(((totalConversions * cpa * 1.5 - totalSpend) / (totalConversions * cpa * 1.5)) * 100).toFixed(1)}%` : '0%'} color="text-emerald-500" icon />
              <KpiCard label="Lucro" value={formatCurrency(totalConversions * cpa * 1.5 - totalSpend)} color="text-emerald-500" icon />
            </div>

            {/* KPI Row 2 */}
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="Faturamento Bruto" value={formatCurrency(totalConversions * cpa * 1.5)} icon />
              <KpiCard label="ARPU" value={formatCurrency(totalConversions > 0 ? (totalConversions * cpa * 1.5) / totalConversions : 0)} icon />
              <KpiCard label="CPA" value={formatCurrency(cpa)} icon />
              <KpiCard label="ROAS" value={totalSpend > 0 ? ((totalConversions * cpa * 1.5) / totalSpend).toFixed(2) : '0'} color="text-emerald-500" icon />
            </div>

            {/* KPI Row 3 */}
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="Custos de Produto" value={formatCurrency(0)} icon />
              <KpiCard label="Reembolso" value="0.0%" icon />
              <KpiCard label="Chargeback" value="0.0%" icon />
              <KpiCard label="ROI" value={totalSpend > 0 ? ((totalConversions * cpa * 1.5 - totalSpend) / totalSpend).toFixed(2) : '0'} color="text-emerald-500" icon />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Vendas por Pagamento */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Vendas por Pagamento</span>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" label={({ name, value }) => `${value}%`}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Taxa de Aprovação */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Taxa de Aprovação</span>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-4 mt-4">
                    {[
                      { label: 'Cartão', pct: '71.4%' },
                      { label: 'Pix', pct: '50.0%' },
                      { label: 'Boleto', pct: 'N/A' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <span className="text-sm font-medium text-foreground">{item.pct}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Funil de Conversão */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Funil de Conversão (Meta Ads)</span>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center mt-4">
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

            {/* Lucro por Horário */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">Lucro por Horário</span>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$ ${v.toFixed(0)}`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="lucro" fill="hsl(210, 100%, 56%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Faturamento x Investimento x Lucro */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">Faturamento x Investimento x Lucro por Hora (acumulado)</span>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$ ${v.toFixed(0)}`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="investimento" stroke="hsl(30, 100%, 50%)" fill="hsl(30, 100%, 50%)" fillOpacity={0.1} name="Investimento" />
                      <Area type="monotone" dataKey="faturamento" stroke="hsl(210, 100%, 56%)" fill="hsl(210, 100%, 56%)" fillOpacity={0.1} name="Faturamento" />
                      <Area type="monotone" dataKey="lucro" stroke="hsl(0, 80%, 60%)" fill="hsl(0, 80%, 60%)" fillOpacity={0.1} name="Lucro" />
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
