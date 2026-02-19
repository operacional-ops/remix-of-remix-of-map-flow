import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardCampaign } from '@/hooks/useDashboardData';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function InvestmentReturnChart({ campaigns }: { campaigns: DashboardCampaign[] }) {
  const top10 = [...campaigns]
    .sort((a, b) => b.meta.spend - a.meta.spend)
    .slice(0, 10)
    .map(c => ({
      name: c.campaign_name.length > 20 ? c.campaign_name.slice(0, 20) + '…' : c.campaign_name,
      investimento: c.meta.spend,
      faturamento: c.payt.faturamento_aprovado,
    }));

  if (top10.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-2">Investimento vs Retorno</p>
          <p className="text-xs text-muted-foreground text-center py-8">Sem campanhas no período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground mb-3">Investimento vs Retorno (Top 10 campanhas)</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="investimento" name="Investimento (Meta)" fill="hsl(0, 80%, 55%)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="faturamento" name="Faturamento (PayT)" fill="hsl(150, 60%, 45%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
