import { DollarSign, TrendingUp, TrendingDown, Target, ShoppingCart, Eye, MousePointerClick } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardKpis } from '@/hooks/useDashboardData';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function num(val: number) {
  return val.toLocaleString('pt-BR');
}

function RoasBadge({ roas }: { roas: number | null }) {
  if (roas === null || roas === undefined) {
    return <span className="text-xl font-bold text-muted-foreground">—</span>;
  }
  const color = roas >= 2 ? 'text-emerald-500' : roas >= 1 ? 'text-yellow-500' : 'text-red-500';
  return <span className={`text-xl font-bold ${color}`}>{roas.toFixed(2)}x</span>;
}

function KpiCard({ label, value, icon, sub, color }: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
          {icon}
        </div>
        <div className={color}>{typeof value === 'string' ? <p className="text-xl font-bold">{value}</p> : value}</div>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function KpiGrid({ kpis }: { kpis: DashboardKpis }) {
  const lucro = kpis.faturamento_aprovado - kpis.valor_investido;
  const cpa = kpis.vendas_aprovadas > 0 ? kpis.valor_investido / kpis.vendas_aprovadas : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Valor Investido"
          value={fmt(kpis.valor_investido)}
          icon={<TrendingDown className="h-3.5 w-3.5 text-red-400" />}
        />
        <KpiCard
          label="Faturamento Aprovado"
          value={fmt(kpis.faturamento_aprovado)}
          icon={<DollarSign className="h-3.5 w-3.5 text-emerald-500" />}
          sub={`${kpis.vendas_aprovadas} vendas aprovadas`}
        />
        <KpiCard
          label="Lucro"
          value={fmt(lucro)}
          color={lucro >= 0 ? 'text-emerald-500' : 'text-red-500'}
          icon={lucro >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
        />
        <KpiCard
          label="ROAS Real"
          value={<RoasBadge roas={kpis.roas_real} />}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Vendas Totais" value={num(kpis.vendas_totais)} icon={<ShoppingCart className="h-3.5 w-3.5 text-blue-400" />} />
        <KpiCard label="CPA" value={fmt(cpa)} icon={<Target className="h-3.5 w-3.5 text-orange-400" />} sub="Custo por Venda" />
        <KpiCard label="Ticket Médio" value={fmt(kpis.ticket_medio)} />
        <KpiCard label="Impressões" value={num(kpis.impressions)} icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} />
        <KpiCard label="Cliques" value={num(kpis.clicks)} icon={<MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />} />
      </div>
    </div>
  );
}
