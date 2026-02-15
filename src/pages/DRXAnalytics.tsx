import { useState } from "react";
import {
  DollarSign,
  Megaphone,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  Layers,
  Image,
  Settings,
  LayoutDashboard,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

// ── Mock Data ──────────────────────────────────────────────
const revenueSpendData = [
  { day: "01/Jan", revenue: 1800, spend: 620 },
  { day: "02/Jan", revenue: 2100, spend: 710 },
  { day: "03/Jan", revenue: 1400, spend: 580 },
  { day: "04/Jan", revenue: 2600, spend: 830 },
  { day: "05/Jan", revenue: 3100, spend: 900 },
  { day: "06/Jan", revenue: 2800, spend: 850 },
  { day: "07/Jan", revenue: 3400, spend: 920 },
  { day: "08/Jan", revenue: 2200, spend: 760 },
  { day: "09/Jan", revenue: 2900, spend: 880 },
  { day: "10/Jan", revenue: 3600, spend: 950 },
  { day: "11/Jan", revenue: 2500, spend: 800 },
  { day: "12/Jan", revenue: 3200, spend: 910 },
  { day: "13/Jan", revenue: 3800, spend: 980 },
  { day: "14/Jan", revenue: 4100, spend: 1020 },
];

const sparkRevenue = [
  { v: 40 }, { v: 55 }, { v: 38 }, { v: 72 }, { v: 60 }, { v: 85 }, { v: 78 },
];
const sparkSpend = [
  { v: 30 }, { v: 35 }, { v: 28 }, { v: 42 }, { v: 38 }, { v: 50 }, { v: 45 },
];
const sparkProfit = [
  { v: 10 }, { v: 20 }, { v: 10 }, { v: 30 }, { v: 22 }, { v: 35 }, { v: 33 },
];
const sparkRoas = [
  { v: 2.1 }, { v: 2.4 }, { v: 1.9 }, { v: 2.8 }, { v: 2.6 }, { v: 3.0 }, { v: 2.96 },
];
const sparkSales = [
  { v: 12 }, { v: 18 }, { v: 10 }, { v: 24 }, { v: 20 }, { v: 28 }, { v: 30 },
];

const pieData = [
  { name: "Facebook Ads", value: 62, color: "hsl(221, 83%, 53%)" },
  { name: "Instagram Ads", value: 23, color: "hsl(280, 70%, 55%)" },
  { name: "Orgânico", value: 10, color: "hsl(142, 71%, 45%)" },
  { name: "Google Ads", value: 5, color: "hsl(43, 96%, 56%)" },
];

const campaigns = [
  { name: "LITHIUM - TOF - Broad", status: "active", spend: 1420, revenue: 4890, roas: 3.44, cpa: 28.4, cvr: 4.2 },
  { name: "LITHIUM - MOF - Retargeting", status: "active", spend: 980, revenue: 3200, roas: 3.27, cpa: 32.6, cvr: 3.8 },
  { name: "LITHIUM - BOF - Lookalike", status: "active", spend: 750, revenue: 2100, roas: 2.80, cpa: 37.5, cvr: 3.1 },
  { name: "LITHIUM - Criativo Novo A", status: "paused", spend: 520, revenue: 1050, roas: 2.02, cpa: 52.0, cvr: 2.4 },
  { name: "LITHIUM - VSL - Cold", status: "active", spend: 330, revenue: 810, roas: 2.45, cpa: 41.2, cvr: 2.8 },
  { name: "LITHIUM - Stories - Oferta", status: "paused", spend: 200, revenue: 400, roas: 2.00, cpa: 50.0, cvr: 1.9 },
];

// ── Sidebar Items ──────────────────────────────────────────
const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Campanhas", icon: Megaphone },
  { label: "Conjuntos", icon: Layers },
  { label: "Criativos", icon: Image },
  { label: "Configurações", icon: Settings },
];

// ── Sparkline Component ────────────────────────────────────
function Sparkline({ data, color }: { data: { v: number }[]; color: string }) {
  return (
    <div className="absolute inset-0 opacity-15">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, "")})`}
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
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  sparkData: { v: number }[];
  sparkColor: string;
}) {
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

// ── Main Page ──────────────────────────────────────────────
export default function DRXAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 0, 14),
  });

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0",
          sidebarOpen ? "w-56" : "w-14"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-4 border-b border-border h-14">
          <BarChart3 className="h-6 w-6 text-primary shrink-0" />
          {sidebarOpen && (
            <span className="text-sm font-bold tracking-tight whitespace-nowrap">
              DRX <span className="text-primary">Analytics</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-1 px-2">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm transition-colors",
                item.active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </aside>

      {/* ── Main Content ────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 h-14 shrink-0">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
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
                    "Selecionar período"
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
              value="R$ 12.450,00"
              change="+12.5%"
              positive
              icon={DollarSign}
              sparkData={sparkRevenue}
              sparkColor="hsl(142, 71%, 45%)"
            />
            <KPICard
              title="Gastos Ads"
              value="R$ 4.200,00"
              change="+8.2%"
              positive={false}
              icon={Megaphone}
              sparkData={sparkSpend}
              sparkColor="hsl(0, 84%, 60%)"
            />
            <KPICard
              title="Lucro Líquido"
              value="R$ 8.250,00"
              change="+18.3%"
              positive
              icon={TrendingUp}
              sparkData={sparkProfit}
              sparkColor="hsl(142, 71%, 45%)"
            />
            <KPICard
              title="ROAS"
              value="2.96x"
              change="+0.32"
              positive
              icon={TrendingUp}
              sparkData={sparkRoas}
              sparkColor="hsl(142, 71%, 45%)"
            />
            <KPICard
              title="Vendas"
              value="142"
              change="+24"
              positive
              icon={ShoppingCart}
              sparkData={sparkSales}
              sparkColor="hsl(221, 83%, 53%)"
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
                        `R$ ${value.toLocaleString("pt-BR")}`,
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
              </CardContent>
            </Card>

            {/* Traffic Sources Pie */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fontes de Tráfego
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex flex-col items-center justify-center">
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
                      formatter={(value: number) => [`${value}%`, ""]}
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
              </CardContent>
            </Card>
          </div>

          {/* ── Campaigns Table ──────────────────── */}
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Campanhas Ativas
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {campaigns.length} campanhas
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Campanha</TableHead>
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
                            c.status === "active"
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              : "border-muted-foreground/30 text-muted-foreground bg-muted/30"
                          )}
                        >
                          {c.status === "active" ? "Ativo" : "Pausado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-right text-rose-400">
                        R$ {c.spend.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm text-right text-emerald-400">
                        R$ {c.revenue.toLocaleString("pt-BR")}
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
                        R$ {c.cpa.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-right text-muted-foreground">
                        {c.cvr.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
