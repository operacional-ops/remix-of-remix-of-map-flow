import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart, DollarSign, TrendingUp, Users, AlertTriangle, 
  CreditCard, ArrowUpRight, ArrowDownRight, Clock, XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePaytStats, type PaytTransaction } from '@/hooks/usePaytTransactions';

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    approved: { label: 'Aprovada', className: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
    pending: { label: 'Pendente', className: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' },
    cancelled: { label: 'Cancelada', className: 'border-muted-foreground/30 text-muted-foreground bg-muted/30' },
    refunded: { label: 'Reembolsada', className: 'border-rose-500/30 text-rose-400 bg-rose-500/10' },
    chargeback: { label: 'Chargeback', className: 'border-red-500/30 text-red-400 bg-red-500/10' },
    expired: { label: 'Expirada', className: 'border-muted-foreground/30 text-muted-foreground bg-muted/30' },
  };
  const c = config[status] || { label: status, className: 'border-muted-foreground/30 text-muted-foreground' };
  return <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', c.className)}>{c.label}</Badge>;
}

export function PaytSalesPanel() {
  const { stats, transactions, isLoading } = usePaytStats();

  const chartData = useMemo(() => {
    return stats.dailySales.slice(-30).map(d => ({
      day: format(parseISO(d.date), 'dd/MMM', { locale: ptBR }),
      vendas: d.sales,
      receita: d.revenue,
    }));
  }, [stats.dailySales]);

  const statusPie = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    const colors: Record<string, string> = {
      approved: 'hsl(142, 71%, 45%)',
      pending: 'hsl(43, 96%, 56%)',
      cancelled: 'hsl(215, 20%, 50%)',
      refunded: 'hsl(0, 84%, 60%)',
      chargeback: 'hsl(0, 70%, 50%)',
      expired: 'hsl(215, 20%, 40%)',
    };
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count,
      color: colors[status] || 'hsl(215, 20%, 50%)',
    }));
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Nenhuma transação recebida da PAYT ainda.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Quando uma venda ocorrer, os dados aparecerão aqui em tempo real.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          PAYT — Vendas em Tempo Real
        </h2>
        <Badge variant="outline" className="text-[10px]">
          {transactions.length} transações
        </Badge>
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
          ● Live
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Receita Total</span>
              </div>
              <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Líquido: {formatCurrency(stats.totalNetRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-medium">Vendas Aprovadas</span>
              </div>
            </div>
            <p className="text-xl font-bold">{stats.totalSales}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Ticket Médio: {formatCurrency(stats.avgTicket)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Pendentes</span>
              </div>
            </div>
            <p className="text-xl font-bold">{stats.pendingCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatCurrency(stats.pendingAmount)} em aberto
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Canceladas / Reembolsos</span>
              </div>
            </div>
            <p className="text-xl font-bold">{stats.cancelledCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatCurrency(stats.refundedAmount)} devolvidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Revenue Chart */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Diárias (PAYT)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sem dados diários ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215, 20%, 65%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 20%, 65%)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(215, 20%, 16%)',
                      border: '1px solid hsl(215, 20%, 20%)',
                      borderRadius: '8px',
                      fontSize: 12,
                      color: 'hsl(210, 40%, 96%)',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'receita' ? formatCurrency(value) : value,
                      name === 'receita' ? 'Receita' : 'Vendas',
                    ]}
                  />
                  <Bar dataKey="receita" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center">
            {statusPie.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {statusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(215, 20%, 16%)',
                        border: '1px solid hsl(215, 20%, 20%)',
                        borderRadius: '8px',
                        fontSize: 12,
                        color: 'hsl(210, 40%, 96%)',
                      }}
                    />
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

      {/* Top Products */}
      {stats.topProducts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtos Mais Vendidos (PAYT)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-xs">Produto</TableHead>
                  <TableHead className="text-xs text-right">Vendas</TableHead>
                  <TableHead className="text-xs text-right">Receita</TableHead>
                  <TableHead className="text-xs text-right">Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topProducts.map(p => (
                  <TableRow key={p.name} className="hover:bg-muted/50 border-border">
                    <TableCell className="text-sm font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm text-right">{p.count}</TableCell>
                    <TableCell className="text-sm text-right text-emerald-400">{formatCurrency(p.revenue)}</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">
                      {formatCurrency(p.count > 0 ? p.revenue / p.count : 0)}
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
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Últimas Transações
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {transactions.length} total
          </Badge>
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
                <TableHead className="text-xs text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 20).map(t => (
                <TableRow key={t.id} className="hover:bg-muted/50 border-border">
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <p className="font-medium truncate max-w-[150px]">{t.customer_name || '—'}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{t.customer_email || ''}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[120px]">{t.product_name || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.payment_method || '—'}</TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    <span className={t.status === 'approved' ? 'text-emerald-400' : t.status === 'refunded' ? 'text-rose-400' : ''}>
                      {formatCurrency(Number(t.amount))}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">
                    {t.paid_at
                      ? format(parseISO(t.paid_at), "dd/MM HH:mm", { locale: ptBR })
                      : format(parseISO(t.created_at), "dd/MM HH:mm", { locale: ptBR })}
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
