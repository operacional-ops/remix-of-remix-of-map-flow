import { DollarSign, TrendingUp, ShoppingCart, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

const summaryCards = [
  {
    title: 'ROAS',
    value: '4.2x',
    change: '+12%',
    positive: true,
    icon: TrendingUp,
  },
  {
    title: 'Lucro',
    value: 'R$ 87.400',
    change: '+8.3%',
    positive: true,
    icon: DollarSign,
  },
  {
    title: 'Vendas',
    value: '1.284',
    change: '+23%',
    positive: true,
    icon: ShoppingCart,
  },
  {
    title: 'Gasto',
    value: 'R$ 20.800',
    change: '-5%',
    positive: false,
    icon: CreditCard,
  },
];

const revenueData = [
  { month: 'Jan', receita: 45000, gasto: 18000 },
  { month: 'Fev', receita: 52000, gasto: 19500 },
  { month: 'Mar', receita: 48000, gasto: 17000 },
  { month: 'Abr', receita: 61000, gasto: 20000 },
  { month: 'Mai', receita: 55000, gasto: 18500 },
  { month: 'Jun', receita: 67000, gasto: 21000 },
  { month: 'Jul', receita: 72000, gasto: 20500 },
  { month: 'Ago', receita: 87400, gasto: 20800 },
];

const roasData = [
  { month: 'Jan', roas: 2.5 },
  { month: 'Fev', roas: 2.7 },
  { month: 'Mar', roas: 2.8 },
  { month: 'Abr', roas: 3.1 },
  { month: 'Mai', roas: 3.0 },
  { month: 'Jun', roas: 3.2 },
  { month: 'Jul', roas: 3.5 },
  { month: 'Ago', roas: 4.2 },
];

const barChartConfig = {
  receita: { label: 'Receita', color: 'hsl(var(--primary))' },
  gasto: { label: 'Gasto', color: 'hsl(var(--destructive))' },
};

const lineChartConfig = {
  roas: { label: 'ROAS', color: 'hsl(var(--accent))' },
};

export default function DashboardOperacao() {
  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Operação</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral de performance da operação
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <span
                    className={`text-xs font-semibold ${
                      card.positive ? 'text-emerald-500' : 'text-destructive'
                    }`}
                  >
                    {card.change} vs mês anterior
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Spend Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receita vs Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[320px] w-full">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="receita" fill="var(--color-receita)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gasto" fill="var(--color-gasto)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ROAS Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Evolução do ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lineChartConfig} className="h-[320px] w-full">
              <LineChart data={roasData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="roas"
                  stroke="var(--color-roas)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--color-roas)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
