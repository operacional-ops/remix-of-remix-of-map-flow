import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  ShoppingCart, DollarSign, TrendingUp, Users, 
  CreditCard, ArrowUpRight, ArrowDownRight, Clock, XCircle,
  CalendarIcon, Percent, BarChart3, Target, Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays, startOfMonth, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { usePaytStats, type PaytTransaction } from '@/hooks/usePaytTransactions';

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    approved: { label: 'Aprovada', className: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
    paid: { label: 'Paga', className: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
    pending: { label: 'Pendente', className: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' },
    cancelled: { label: 'Cancelada', className: 'border-muted-foreground/30 text-muted-foreground bg-muted/30' },
    refunded: { label: 'Reembolsada', className: 'border-rose-500/30 text-rose-400 bg-rose-500/10' },
    chargeback: { label: 'Chargeback', className: 'border-red-500/30 text-red-400 bg-red-500/10' },
    expired: { label: 'Expirada', className: 'border-muted-foreground/30 text-muted-foreground bg-muted/30' },
    lost_cart: { label: 'Carrinho Perdido', className: 'border-orange-500/30 text-orange-400 bg-orange-500/10' },
  };
  const c = config[status] || { label: status, className: 'border-muted-foreground/30 text-muted-foreground' };
  return <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', c.className)}>{c.label}</Badge>;
}

type QuickRange = 'today' | '7d' | '30d' | 'month' | 'all';

function getQuickRange(key: QuickRange): DateRange | undefined {
  const now = new Date();
  switch (key) {
    case 'today': return { from: startOfDay(now), to: endOfDay(now) };
    case '7d': return { from: subDays(now, 7), to: now };
    case '30d': return { from: subDays(now, 30), to: now };
    case 'month': return { from: startOfMonth(now), to: now };
    case 'all': return undefined;
  }
}

export function PaytSalesPanel() {
  const { stats, transactions: allTransactions, isLoading } = usePaytStats();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [quickRange, setQuickRange] = useState<QuickRange>('all');

  const handleQuickRange = (key: QuickRange) => {
    setQuickRange(key);
    setDateRange(getQuickRange(key));
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setQuickRange('all'); // custom range
  };

  // Filter transactions by date range
  const transactions = useMemo(() => {
    if (!dateRange?.from) return allTransactions;
    return allTransactions.filter(t => {
      const d = parseISO(t.paid_at || t.created_at);
      const from = startOfDay(dateRange.from!);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
      return isWithinInterval(d, { start: from, end: to });
    });
  }, [allTransactions, dateRange]);

  // Recalculate stats for filtered transactions
  const filteredStats = useMemo(() => {
    const approved = transactions.filter(t => ['approved', 'paid'].includes(t.status));
    const totalRevenue = approved.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalNetRevenue = approved.reduce((s, t) => s + Number(t.net_amount || 0), 0);
    const totalCommission = approved.reduce((s, t) => s + Number(t.commission || 0), 0);
    const totalSales = approved.length;
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const conversionRate = transactions.length > 0 ? (totalSales / transactions.length) * 100 : 0;
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + Number(t.amount || 0), 0);
    const cancelledCount = transactions.filter(t => ['cancelled', 'refunded', 'chargeback'].includes(t.status)).length;
    const refundedAmount = transactions.filter(t => ['refunded', 'chargeback'].includes(t.status)).reduce((s, t) => s + Number(t.amount || 0), 0);
    const lostCartCount = transactions.filter(t => t.status === 'lost_cart').length;
    const lostCartAmount = transactions.filter(t => t.status === 'lost_cart').reduce((s, t) => s + Number(t.amount || 0), 0);

    // By payment method
    const byMethod: Record<string, { count: number; revenue: number }> = {};
    approved.forEach(t => {
      const method = t.payment_method || 'Não informado';
      if (!byMethod[method]) byMethod[method] = { count: 0, revenue: 0 };
      byMethod[method].count++;
      byMethod[method].revenue += Number(t.amount || 0);
    });

    // Top products
    const byProduct: Record<string, { count: number; revenue: number }> = {};
    approved.forEach(t => {
      const name = t.product_name || 'Sem nome';
      if (!byProduct[name]) byProduct[name] = { count: 0, revenue: 0 };
      byProduct[name].count++;
      byProduct[name].revenue += Number(t.amount || 0);
    });
    const topProducts = Object.entries(byProduct)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue);

    // Daily sales
    const byDay: Record<string, { sales: number; revenue: number; lost: number }> = {};
    transactions.forEach(t => {
      const day = (t.paid_at || t.created_at).split('T')[0];
      if (!byDay[day]) byDay[day] = { sales: 0, revenue: 0, lost: 0 };
      if (['approved', 'paid'].includes(t.status)) {
        byDay[day].sales++;
        byDay[day].revenue += Number(t.amount || 0);
      }
      if (t.status === 'lost_cart') byDay[day].lost++;
    });
    const dailySales = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, ...d }));

    // Hourly distribution
    const byHour: Record<number, number> = {};
    approved.forEach(t => {
      try {
        const hour = parseISO(t.paid_at || t.created_at).getHours();
        byHour[hour] = (byHour[hour] || 0) + 1;
      } catch {}
    });
    const hourlyDist = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}h`,
      vendas: byHour[h] || 0,
    }));

    return {
      totalRevenue, totalNetRevenue, totalCommission, totalSales, avgTicket,
      conversionRate, pendingCount, pendingAmount, cancelledCount, refundedAmount,
      lostCartCount, lostCartAmount,
      byMethod: Object.entries(byMethod).map(([method, d]) => ({ method, ...d })).sort((a, b) => b.revenue - a.revenue),
      topProducts, dailySales, hourlyDist,
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    return filteredStats.dailySales.slice(-30).map(d => ({
      day: format(parseISO(d.date), 'dd/MMM', { locale: ptBR }),
      vendas: d.sales,
      receita: d.revenue,
      perdidos: d.lost,
    }));
  }, [filteredStats.dailySales]);

  const statusPie = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    const colors: Record<string, string> = {
      approved: 'hsl(142, 71%, 45%)', paid: 'hsl(142, 71%, 45%)',
      pending: 'hsl(43, 96%, 56%)', cancelled: 'hsl(215, 20%, 50%)',
      refunded: 'hsl(0, 84%, 60%)', chargeback: 'hsl(0, 70%, 50%)',
      expired: 'hsl(215, 20%, 40%)', lost_cart: 'hsl(25, 95%, 53%)',
    };
    const labels: Record<string, string> = {
      approved: 'Aprovada', paid: 'Paga', pending: 'Pendente', cancelled: 'Cancelada',
      refunded: 'Reembolsada', chargeback: 'Chargeback', expired: 'Expirada', lost_cart: 'Carrinho Perdido',
    };
    return Object.entries(counts).map(([status, count]) => ({
      name: labels[status] || status, value: count,
      color: colors[status] || 'hsl(215, 20%, 50%)',
    }));
  }, [transactions]);

  const methodPie = useMemo(() => {
    const colors = ['hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(43, 96%, 56%)', 'hsl(280, 70%, 55%)', 'hsl(0, 84%, 60%)'];
    const labels: Record<string, string> = {
      credit_card: 'Cartão de Crédito', pix: 'PIX', bankslip: 'Boleto', debit_card: 'Débito',
    };
    return filteredStats.byMethod.map((m, i) => ({
      name: labels[m.method] || m.method, value: m.count, color: colors[i % colors.length],
    }));
  }, [filteredStats.byMethod]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (allTransactions.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhuma transação recebida da PAYT ainda.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Quando uma venda ocorrer, os dados aparecerão aqui em tempo real.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          PAYT — Vendas em Tempo Real
        </h2>
        <Badge variant="outline" className="text-[10px]">{transactions.length} transações</Badge>
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">● Live</Badge>
        
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Quick range buttons */}
          {([
            ['today', 'Hoje'],
            ['7d', '7 dias'],
            ['30d', '30 dias'],
            ['month', 'Mês'],
            ['all', 'Tudo'],
          ] as [QuickRange, string][]).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={quickRange === key ? 'default' : 'outline'}
              className="h-7 text-[11px] px-3"
              onClick={() => handleQuickRange(key)}
            >
              {label}
            </Button>
          ))}
          
          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]">
                <CalendarIcon className="h-3 w-3" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>{format(dateRange.from, 'dd/MM', { locale: ptBR })} – {format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}</>
                  ) : format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                ) : 'Período'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Cards - Row 1: Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Receita Bruta</span>
              </div>
              <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(filteredStats.totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Líquido: {formatCurrency(filteredStats.totalNetRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-medium">Vendas Aprovadas</span>
              </div>
            </div>
            <p className="text-xl font-bold">{filteredStats.totalSales}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Ticket Médio: {formatCurrency(filteredStats.avgTicket)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Percent className="h-4 w-4" />
                <span className="text-xs font-medium">Taxa de Conversão</span>
              </div>
            </div>
            <p className="text-xl font-bold">{filteredStats.conversionRate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {filteredStats.totalSales} de {transactions.length} transações
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium">Comissões</span>
              </div>
            </div>
            <p className="text-xl font-bold">{formatCurrency(filteredStats.totalCommission)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {filteredStats.totalRevenue > 0 ? ((filteredStats.totalCommission / filteredStats.totalRevenue) * 100).toFixed(1) : '0'}% da receita
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 2: Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Pendentes</span>
            </div>
            <p className="text-xl font-bold">{filteredStats.pendingCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{formatCurrency(filteredStats.pendingAmount)} em aberto</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Carrinhos Perdidos</span>
            </div>
            <p className="text-xl font-bold">{filteredStats.lostCartCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{formatCurrency(filteredStats.lostCartAmount)} potencial perdido</p>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Cancelamentos</span>
            </div>
            <p className="text-xl font-bold">{filteredStats.cancelledCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{formatCurrency(filteredStats.refundedAmount)} devolvidos</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">Margem Líquida</span>
            </div>
            <p className="text-xl font-bold">
              {filteredStats.totalRevenue > 0
                ? ((filteredStats.totalNetRevenue / filteredStats.totalRevenue) * 100).toFixed(1)
                : '0'}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{formatCurrency(filteredStats.totalNetRevenue)} líquido</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Revenue Chart */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas & Carrinhos Perdidos por Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados no período</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215, 20%, 65%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 20%, 65%)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(215, 20%, 16%)', border: '1px solid hsl(215, 20%, 20%)', borderRadius: '8px', fontSize: 12, color: 'hsl(210, 40%, 96%)' }}
                    formatter={(value: number, name: string) => [
                      name === 'receita' ? formatCurrency(value) : value,
                      name === 'receita' ? 'Receita' : name === 'perdidos' ? 'Carrinhos Perdidos' : 'Vendas',
                    ]}
                  />
                  <Bar dataKey="receita" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} opacity={0.8} />
                  <Bar dataKey="perdidos" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center">
            {statusPie.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {statusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(215, 20%, 16%)', border: '1px solid hsl(215, 20%, 20%)', borderRadius: '8px', fontSize: 12, color: 'hsl(210, 40%, 96%)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {statusPie.map(e => (
                    <div key={e.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                      {e.name} ({e.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Payment methods + Hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Methods */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Formas de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center">
            {methodPie.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={methodPie} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {methodPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(215, 20%, 16%)', border: '1px solid hsl(215, 20%, 20%)', borderRadius: '8px', fontSize: 12, color: 'hsl(210, 40%, 96%)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {methodPie.map(e => (
                    <div key={e.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                      {e.name} ({e.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horário de Pico de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredStats.hourlyDist} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'hsl(215, 20%, 65%)' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 20%, 65%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(215, 20%, 16%)', border: '1px solid hsl(215, 20%, 20%)', borderRadius: '8px', fontSize: 12, color: 'hsl(210, 40%, 96%)' }} />
                <Bar dataKey="vendas" fill="hsl(221, 83%, 53%)" radius={[3, 3, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {filteredStats.topProducts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-xs">Produto</TableHead>
                  <TableHead className="text-xs text-right">Vendas</TableHead>
                  <TableHead className="text-xs text-right">Receita</TableHead>
                  <TableHead className="text-xs text-right">Ticket Médio</TableHead>
                  <TableHead className="text-xs text-right">% Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStats.topProducts.map(p => (
                  <TableRow key={p.name} className="hover:bg-muted/50 border-border">
                    <TableCell className="text-sm font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm text-right">{p.count}</TableCell>
                    <TableCell className="text-sm text-right text-emerald-400">{formatCurrency(p.revenue)}</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">
                      {formatCurrency(p.count > 0 ? p.revenue / p.count : 0)}
                    </TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">
                      {filteredStats.totalRevenue > 0 ? ((p.revenue / filteredStats.totalRevenue) * 100).toFixed(1) : '0'}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Últimas Transações</CardTitle>
          <Badge variant="secondary" className="text-xs">{transactions.length} no período</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">Produto</TableHead>
                <TableHead className="text-xs">Pagamento</TableHead>
                <TableHead className="text-xs text-right">Valor</TableHead>
                <TableHead className="text-xs text-right">Líquido</TableHead>
                <TableHead className="text-xs text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 25).map(t => (
                <TableRow key={t.id} className="hover:bg-muted/50 border-border">
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <p className="font-medium truncate max-w-[150px]">{t.customer_name || '—'}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{t.customer_email || t.customer_phone || ''}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[120px]">{t.product_name || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {({ credit_card: 'Cartão', pix: 'PIX', bankslip: 'Boleto' } as Record<string, string>)[t.payment_method || ''] || t.payment_method || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    <span className={['approved', 'paid'].includes(t.status) ? 'text-emerald-400' : t.status === 'refunded' ? 'text-rose-400' : ''}>
                      {formatCurrency(Number(t.amount))}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-right text-muted-foreground">
                    {formatCurrency(Number(t.net_amount || 0))}
                  </TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">
                    {(() => {
                      try { return format(parseISO(t.paid_at || t.created_at), 'dd/MM HH:mm', { locale: ptBR }); }
                      catch { return '—'; }
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
