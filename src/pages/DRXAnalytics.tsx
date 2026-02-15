import { useState, useMemo } from "react";
import {
  DollarSign,
  Megaphone,
  TrendingUp,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CalendarIcon,
} from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  useOperationalProducts,
  useOperationalMetrics,
  type OperationalMetric,
} from "@/hooks/useOperationalProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// ── Sparkline Component ────────────────────────────────────
function Sparkline({ data, color }: { data: { v: number }[]; color: string }) {
  if (!data.length) return null;
  const gradId = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div className="absolute inset-0 opacity-15">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={`url(#${gradId})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── KPI Card Component ─────────────────────────────────────
function KPICard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  sparkData,
  sparkColor,
  loading,
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  sparkData: { v: number }[];
  sparkColor: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden border-border/50 bg-card">
        <CardContent className="p-5 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card hover:border-primary/30 transition-all duration-300 group">
      <Sparkline data={sparkData} color={sparkColor} />
      <CardContent className="relative z-10 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              positive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Main Page ──────────────────────────────────────────────
export default function DRXAnalytics() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<string>("all");

  const { data: products, isLoading: loadingProducts } = useOperationalProducts();
  
  // Fetch metrics for selected product or first product
  const productIds = useMemo(() => products?.map(p => p.id) || [], [products]);
  
  // We need to fetch metrics for all products when "all" is selected, or specific product
  const activeProductId = selectedProductId === "all" ? null : selectedProductId;
  
  // Fetch all metrics for all products
  const metricsQueries = useMemo(() => {
    if (selectedProductId === "all") return productIds;
    return [selectedProductId].filter(Boolean);
  }, [selectedProductId, productIds]);

  // Use individual queries for each product
  const { data: singleMetrics, isLoading: loadingSingle } = useOperationalMetrics(
    selectedProductId !== "all" ? selectedProductId : null
  );
  
  // For "all" mode, fetch all products' metrics
  const allProductMetrics = useMemo(() => {
    if (selectedProductId !== "all") return [];
    return productIds;
  }, [selectedProductId, productIds]);

  // We'll use a simpler approach: fetch metrics for selected product, or first product
  // For "all", we'll need to query directly
  const { data: allMetricsRaw, isLoading: loadingAll } = useAllMetrics(
    selectedProductId === "all" ? productIds : []
  );

  const rawMetrics = selectedProductId === "all" ? (allMetricsRaw || []) : (singleMetrics || []);
  const loading = loadingProducts || (selectedProductId === "all" ? loadingAll : loadingSingle);

  // Filter by date range
  const metrics = useMemo(() => {
    if (!dateRange?.from) return rawMetrics;
    return rawMetrics.filter(m => {
      const d = parseISO(m.data);
      const from = startOfDay(dateRange.from!);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
      return isWithinInterval(d, { start: from, end: to });
    });
  }, [rawMetrics, dateRange]);

  // ── Computed KPIs ──────────────────────────────
  const kpis = useMemo(() => {
    const totalGastos = metrics.reduce((s, m) => s + Number(m.gastos || 0), 0);
    const totalResultado = metrics.reduce((s, m) => s + Number(m.resultado || 0), 0);
    const totalLucro = metrics.reduce((s, m) => s + Number(m.lucro_bruto || 0), 0);
    const totalVendas = metrics.reduce((s, m) => s + Number(m.qnt_vendas || 0), 0);
    const avgRoas = totalGastos > 0 ? totalResultado / totalGastos : 0;
    return { totalGastos, totalResultado, totalLucro, totalVendas, avgRoas };
  }, [metrics]);

  // ── Chart: Revenue vs Spend by day ──────────────
  const revenueSpendData = useMemo(() => {
    const byDay: Record<string, { revenue: number; spend: number }> = {};
    metrics.forEach(m => {
      const day = m.data;
      if (!byDay[day]) byDay[day] = { revenue: 0, spend: 0 };
      byDay[day].revenue += Number(m.resultado || 0);
      byDay[day].spend += Number(m.gastos || 0);
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, vals]) => ({
        day: format(parseISO(day), "dd/MMM", { locale: ptBR }),
        revenue: vals.revenue,
        spend: vals.spend,
      }));
  }, [metrics]);

  // ── Chart: Breakdown by product (pie) ──────────
  const pieData = useMemo(() => {
    const colors = [
      "hsl(221, 83%, 53%)", "hsl(280, 70%, 55%)", "hsl(142, 71%, 45%)",
      "hsl(43, 96%, 56%)", "hsl(0, 84%, 60%)", "hsl(190, 70%, 50%)",
    ];
    const byProduct: Record<string, number> = {};
    metrics.forEach(m => {
      const pid = m.product_id;
      byProduct[pid] = (byProduct[pid] || 0) + Number(m.gastos || 0);
    });
    return Object.entries(byProduct).map(([pid, value], i) => {
      const prod = products?.find(p => p.id === pid);
      return {
        name: prod?.name || "Produto",
        value: Math.round(value * 100) / 100,
        color: colors[i % colors.length],
      };
    });
  }, [metrics, products]);

  // ── Sparkline data from daily totals ────────────
  const sparklines = useMemo(() => {
    const sorted = [...revenueSpendData].slice(-7);
    return {
      revenue: sorted.map(d => ({ v: d.revenue })),
      spend: sorted.map(d => ({ v: d.spend })),
      profit: sorted.map(d => ({ v: d.revenue - d.spend })),
      roas: sorted.map(d => ({ v: d.spend > 0 ? d.revenue / d.spend : 0 })),
      sales: (() => {
        const byDay: Record<string, number> = {};
        metrics.forEach(m => {
          byDay[m.data] = (byDay[m.data] || 0) + Number(m.qnt_vendas || 0);
        });
        return Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-7)
          .map(([, v]) => ({ v }));
      })(),
    };
  }, [revenueSpendData, metrics]);

  // ── Campaigns table: group by contas_produto ────
  const campaigns = useMemo(() => {
    const byConta: Record<string, { spend: number; revenue: number; vendas: number; count: number; status: string }> = {};
    metrics.forEach(m => {
      const key = m.contas_produto || "Sem conta";
      if (!byConta[key]) byConta[key] = { spend: 0, revenue: 0, vendas: 0, count: 0, status: m.status || "Testando" };
      byConta[key].spend += Number(m.gastos || 0);
      byConta[key].revenue += Number(m.resultado || 0);
      byConta[key].vendas += Number(m.qnt_vendas || 0);
      byConta[key].count++;
      // Use latest status
      if (m.status === "Ativo") byConta[key].status = "Ativo";
    });
    return Object.entries(byConta).map(([name, d]) => ({
      name,
      status: d.status,
      spend: d.spend,
      revenue: d.revenue,
      roas: d.spend > 0 ? d.revenue / d.spend : 0,
      cpa: d.vendas > 0 ? d.spend / d.vendas : 0,
      cvr: d.count > 0 ? (d.vendas / d.count) * 100 : 0,
    }));
  }, [metrics]);

  const handleSync = () => {
    setSyncing(true);
    queryClient.invalidateQueries({ queryKey: ["operational-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["operational-products"] });
    setTimeout(() => setSyncing(false), 1500);
  };

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* ── Main Content ────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 h-14 shrink-0">
          <h1 className="text-lg font-semibold">DRX Analytics</h1>
          <div className="flex items-center gap-3">
            {/* Product filter */}
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Todos os produtos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM", { locale: ptBR })} –{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Todo período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button size="sm" variant="outline" onClick={handleSync} className="gap-2 text-xs">
              <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
              Sync
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* ── KPI Row ──────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Receita"
              value={formatCurrency(kpis.totalResultado)}
              change={metrics.length > 0 ? `${metrics.length} registros` : "—"}
              positive={kpis.totalResultado > 0}
              icon={DollarSign}
              sparkData={sparklines.revenue}
              sparkColor="hsl(142, 71%, 45%)"
              loading={loading}
            />
            <KPICard
              title="Gastos Ads"
              value={formatCurrency(kpis.totalGastos)}
              change={pieData.length > 0 ? `${pieData.length} produtos` : "—"}
              positive={false}
              icon={Megaphone}
              sparkData={sparklines.spend}
              sparkColor="hsl(0, 84%, 60%)"
              loading={loading}
            />
            <KPICard
              title="Lucro Bruto"
              value={formatCurrency(kpis.totalLucro)}
              change={kpis.totalLucro >= 0 ? "Positivo" : "Negativo"}
              positive={kpis.totalLucro >= 0}
              icon={TrendingUp}
              sparkData={sparklines.profit}
              sparkColor="hsl(142, 71%, 45%)"
              loading={loading}
            />
            <KPICard
              title="ROAS"
              value={`${kpis.avgRoas.toFixed(2)}x`}
              change={kpis.avgRoas >= 2 ? "Saudável" : "Atenção"}
              positive={kpis.avgRoas >= 2}
              icon={TrendingUp}
              sparkData={sparklines.roas}
              sparkColor={kpis.avgRoas >= 2 ? "hsl(142, 71%, 45%)" : "hsl(43, 96%, 56%)"}
              loading={loading}
            />
            <KPICard
              title="Vendas"
              value={String(kpis.totalVendas)}
              change={`${campaigns.length} contas`}
              positive={kpis.totalVendas > 0}
              icon={ShoppingCart}
              sparkData={sparklines.sales}
              sparkColor="hsl(221, 83%, 53%)"
              loading={loading}
            />
          </div>

          {/* ── Charts Row ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue vs Spend */}
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita vs Gastos
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {revenueSpendData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Sem dados para o período selecionado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={revenueSpendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(215, 20%, 65%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(215, 20%, 65%)" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(215, 20%, 16%)",
                          border: "1px solid hsl(215, 20%, 20%)",
                          borderRadius: "8px",
                          fontSize: 12,
                          color: "hsl(210, 40%, 96%)",
                        }}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === "revenue" ? "Receita" : "Gastos",
                        ]}
                      />
                      <Bar dataKey="spend" fill="hsl(0, 62%, 50%)" radius={[4, 4, 0, 0]} opacity={0.7} name="spend" />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(142, 71%, 45%)"
                        strokeWidth={2.5}
                        dot={false}
                        name="revenue"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Product Breakdown Pie */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gastos por Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex flex-col items-center justify-center">
                {pieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(215, 20%, 16%)",
                            border: "1px solid hsl(215, 20%, 20%)",
                            borderRadius: "8px",
                            fontSize: 12,
                            color: "hsl(210, 40%, 96%)",
                          }}
                          formatter={(value: number) => [formatCurrency(value), ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {pieData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                          {entry.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Campaigns Table ──────────────────── */}
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contas / Campanhas
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {campaigns.length} contas
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {campaigns.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhum dado encontrado. Importe dados no Dashboard Operação.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Conta / Campanha</TableHead>
                      <TableHead className="text-xs text-right">Gastos</TableHead>
                      <TableHead className="text-xs text-right">Receita</TableHead>
                      <TableHead className="text-xs text-right">ROAS</TableHead>
                      <TableHead className="text-xs text-right">CPA</TableHead>
                      <TableHead className="text-xs text-right">CVR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((c) => (
                      <TableRow
                        key={c.name}
                        className="hover:bg-muted/50 transition-colors border-border cursor-pointer"
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5",
                              c.status === "Ativo"
                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                : c.status === "Pausado"
                                ? "border-muted-foreground/30 text-muted-foreground bg-muted/30"
                                : "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                            )}
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm text-right text-rose-400">
                          {formatCurrency(c.spend)}
                        </TableCell>
                        <TableCell className="text-sm text-right text-emerald-400">
                          {formatCurrency(c.revenue)}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          <span
                            className={cn(
                              "font-semibold",
                              c.roas >= 2.5 ? "text-emerald-400" : c.roas >= 2.0 ? "text-yellow-400" : "text-rose-400"
                            )}
                          >
                            {c.roas.toFixed(2)}x
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">
                          {formatCurrency(c.cpa)}
                        </TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">
                          {c.cvr.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Hook to fetch metrics for ALL products ─────────────────
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function useAllMetrics(productIds: string[]) {
  return useQuery({
    queryKey: ["operational-metrics", "all", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from("operational_metrics")
        .select("*")
        .in("product_id", productIds)
        .order("data", { ascending: false });
      if (error) throw error;
      return data as OperationalMetric[];
    },
    enabled: productIds.length > 0,
  });
}
