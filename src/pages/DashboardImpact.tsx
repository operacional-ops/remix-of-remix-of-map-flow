import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  FileText,
  Package,
  CheckSquare,
  CalendarDays,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ThemeLogo } from '@/components/ThemeLogo';
import { useAuth } from '@/contexts/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  extra?: React.ReactNode;
}

function MetricCard({ label, value, icon, extra }: MetricCardProps) {
  return (
    <Card className="flex-1 min-w-[160px]">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            {extra}
          </div>
          <div className="rounded-lg p-2 bg-primary/10 text-primary flex-shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AgendaColumnProps {
  icon: React.ReactNode;
  title: string;
  count: string;
  emptyLabel: string;
  emptyIcon: React.ReactNode;
  actionButton?: React.ReactNode;
  accentColor?: string;
}

function AgendaColumn({
  icon,
  title,
  count,
  emptyLabel,
  emptyIcon,
  actionButton,
  accentColor = 'bg-primary/10 text-primary',
}: AgendaColumnProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${accentColor}`}>{icon}</div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{count}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
        {emptyIcon}
        <p className="text-sm">{emptyLabel}</p>
        {actionButton}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardImpact() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('hoje');

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const periodLabel = `${monthStart.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })} - ${monthEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'usuário';
  const greeting = `${getGreeting()}, ${userName}! 👋 Bora impactar? 🚀`;

  // Meta do mês (placeholder)
  const metaDoMes = 60000;
  const faturamentoAtual = 0;
  const progressoPct = metaDoMes > 0 ? (faturamentoAtual / metaDoMes) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur px-6 py-3">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <div className="flex items-center gap-2">
          {/* Período */}
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            {periodLabel}
          </Button>
          {/* Moeda */}
          <Button variant="outline" size="sm" className="text-xs gap-1">
            🇧🇷 BRL
          </Button>
          {/* Tema */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="px-6 py-6 space-y-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Impact</h1>
          <p className="text-muted-foreground text-sm">Visão geral do seu negócio em tempo real</p>
        </div>

        {/* ── Metric Cards ── */}
        <div className="flex flex-wrap gap-4">
          <MetricCard
            label="Faturamento do Período"
            value={formatCurrency(0)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <MetricCard
            label="Lucro"
            value={formatCurrency(0)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <MetricCard
            label="Meta do Mês"
            value={formatCurrency(metaDoMes)}
            icon={<Target className="h-5 w-5" />}
            extra={
              <div className="mt-2 space-y-1 min-w-[120px]">
                <Progress value={progressoPct} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{progressoPct.toFixed(1)}%</p>
              </div>
            }
          />
          <MetricCard
            label="A Receber"
            value={formatCurrency(0)}
            icon={<Clock className="h-5 w-5" />}
          />
          <MetricCard
            label="Faturamento Total"
            value="R$ 0"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        {/* ── Receita do Período ── */}
        <Card>
          <CardHeader>
            <CardTitle>Receita do Período</CardTitle>
            <CardDescription>Exibe o desempenho financeiro da empresa ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <TrendingDown className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Adicione mais transações ao longo do tempo</p>
            <p className="text-xs opacity-70">para visualizar a evolução das receitas</p>
          </CardContent>
        </Card>

        {/* ── Agenda (Hoje / Amanhã / Esta Semana) ── */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="hoje">Hoje</TabsTrigger>
              <TabsTrigger value="amanha">Amanhã</TabsTrigger>
              <TabsTrigger value="semana">Esta Semana</TabsTrigger>
            </TabsList>

            {/* ── Tab: Hoje ── */}
            <TabsContent value="hoje" className="mt-4 space-y-2">
              <div>
                <h2 className="text-lg font-semibold capitalize">Hoje</h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {formatDateHeader(today)}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <AgendaColumn
                  icon={<Package className="h-4 w-4" />}
                  title="Próximas Entregas"
                  count="0 entregas"
                  emptyLabel="Nenhuma entrega"
                  emptyIcon={<Package className="h-10 w-10 opacity-20" />}
                  accentColor="bg-violet-500/10 text-violet-500"
                />
                <AgendaColumn
                  icon={<CheckSquare className="h-4 w-4" />}
                  title="Próximos To-Dos"
                  count="0 pendentes"
                  emptyLabel="Nenhum to-do"
                  emptyIcon={<CheckSquare className="h-10 w-10 opacity-20" />}
                  accentColor="bg-green-500/10 text-green-500"
                  actionButton={
                    <Button size="sm" variant="outline" className="gap-1 text-xs mt-1">
                      <Plus className="h-3.5 w-3.5" /> Adicionar To-Do
                    </Button>
                  }
                />
                <AgendaColumn
                  icon={<TrendingDown className="h-4 w-4" />}
                  title="Próximas Despesas"
                  count={formatCurrency(0)}
                  emptyLabel="Nenhuma despesa"
                  emptyIcon={<TrendingDown className="h-10 w-10 opacity-20" />}
                  accentColor="bg-red-500/10 text-red-500"
                />
              </div>
            </TabsContent>

            {/* ── Tab: Amanhã ── */}
            <TabsContent value="amanha" className="mt-4 space-y-2">
              <div>
                <h2 className="text-lg font-semibold capitalize">Amanhã</h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {formatDateHeader(new Date(today.getTime() + 86400000))}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <AgendaColumn
                  icon={<Package className="h-4 w-4" />}
                  title="Próximas Entregas"
                  count="0 entregas"
                  emptyLabel="Nenhuma entrega"
                  emptyIcon={<Package className="h-10 w-10 opacity-20" />}
                  accentColor="bg-violet-500/10 text-violet-500"
                />
                <AgendaColumn
                  icon={<CheckSquare className="h-4 w-4" />}
                  title="Próximos To-Dos"
                  count="0 pendentes"
                  emptyLabel="Nenhum to-do"
                  emptyIcon={<CheckSquare className="h-10 w-10 opacity-20" />}
                  accentColor="bg-green-500/10 text-green-500"
                />
                <AgendaColumn
                  icon={<TrendingDown className="h-4 w-4" />}
                  title="Próximas Despesas"
                  count={formatCurrency(0)}
                  emptyLabel="Nenhuma despesa"
                  emptyIcon={<TrendingDown className="h-10 w-10 opacity-20" />}
                  accentColor="bg-red-500/10 text-red-500"
                />
              </div>
            </TabsContent>

            {/* ── Tab: Esta Semana ── */}
            <TabsContent value="semana" className="mt-4 space-y-2">
              <div>
                <h2 className="text-lg font-semibold">Esta Semana</h2>
                <p className="text-sm text-muted-foreground">Resumo semanal</p>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <AgendaColumn
                  icon={<Package className="h-4 w-4" />}
                  title="Entregas da Semana"
                  count="0 entregas"
                  emptyLabel="Nenhuma entrega"
                  emptyIcon={<Package className="h-10 w-10 opacity-20" />}
                  accentColor="bg-violet-500/10 text-violet-500"
                />
                <AgendaColumn
                  icon={<CheckSquare className="h-4 w-4" />}
                  title="To-Dos da Semana"
                  count="0 pendentes"
                  emptyLabel="Nenhum to-do"
                  emptyIcon={<CheckSquare className="h-10 w-10 opacity-20" />}
                  accentColor="bg-green-500/10 text-green-500"
                />
                <AgendaColumn
                  icon={<TrendingDown className="h-4 w-4" />}
                  title="Despesas da Semana"
                  count={formatCurrency(0)}
                  emptyLabel="Nenhuma despesa"
                  emptyIcon={<TrendingDown className="h-10 w-10 opacity-20" />}
                  accentColor="bg-red-500/10 text-red-500"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Rodapé ── */}
        <div className="flex items-center justify-center gap-3 pt-4 pb-8 opacity-40">
          <ThemeLogo className="h-6 w-6 object-contain" />
          <span className="text-xs font-medium tracking-widest uppercase">Impactize · Serviços Digitais</span>
        </div>
      </div>
    </div>
  );
}
