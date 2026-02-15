import { useState, useMemo, useRef } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Upload, FileSpreadsheet, MessageSquare, X, Send, ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCashbook, usePayables, useBudget, useImportCashbook, useImportPayables, useImportBudget } from '@/hooks/useFinancialData';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function parseCSVValue(val: string): number {
  if (!val || val === '-' || val === '') return 0;
  return parseFloat(val.replace(/[R$\s.]/g, '').replace(',', '.').replace('$', '')) || 0;
}

function parseCSVDate(val: string): string {
  if (!val) return '';
  // Already yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // dd/mm/yyyy
  const parts = val.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return val;
}

export default function FinancialDashboard() {
  const { data: cashbook = [], isLoading: loadingCashbook } = useCashbook();
  const { data: payables = [], isLoading: loadingPayables } = usePayables();
  const { data: budget = [], isLoading: loadingBudget } = useBudget();
  const importCashbook = useImportCashbook();
  const importPayables = useImportPayables();
  const importBudget = useImportBudget();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'cashbook' | 'payables' | 'budget'>('cashbook');

  // KPIs
  const kpis = useMemo(() => {
    const entradas = cashbook.filter(c => c.tipo === 'ENTRADA').reduce((s, c) => s + Number(c.valor), 0);
    const saidas = cashbook.filter(c => c.tipo === 'SAÍDA').reduce((s, c) => s + Number(c.valor), 0);
    const saldoAtual = cashbook.length > 0 ? Number(cashbook[cashbook.length - 1].saldo_acumulado || 0) : 0;
    const totalAPagar = payables.reduce((s, p) => s + Number(p.valor), 0);
    const pendentes = payables.filter(p => p.status === 'PENDENTE').length;
    const saldoProjetado = saldoAtual - totalAPagar;

    return { entradas, saidas, saldoAtual, totalAPagar, pendentes, saldoProjetado };
  }, [cashbook, payables]);

  // Chart data - by category
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    cashbook.filter(c => c.tipo === 'SAÍDA').forEach(c => {
      const cat = c.nivel1 || 'Outros';
      map[cat] = (map[cat] || 0) + Number(c.valor);
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace(/^\d+\.\s*/, ''), value }));
  }, [cashbook]);

  // PxR (Planned vs Realized) for selected month
  const pxrData = useMemo(() => {
    const monthKey = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][selectedMonth];
    const budgetByCategory: Record<string, number> = {};
    budget.forEach(b => {
      if (b.nivel1 && !b.nivel1.includes('SUBTOTAL') && !b.nivel1.includes('TOTAL')) {
        const val = Number((b as any)[monthKey] || 0);
        if (val > 0) {
          budgetByCategory[b.nivel1] = (budgetByCategory[b.nivel1] || 0) + val;
        }
      }
    });

    const realizedByCategory: Record<string, number> = {};
    cashbook.forEach(c => {
      const month = new Date(c.data).getMonth();
      if (month === selectedMonth) {
        const cat = c.nivel1 || 'Outros';
        realizedByCategory[cat] = (realizedByCategory[cat] || 0) + Number(c.valor);
      }
    });

    const allCats = new Set([...Object.keys(budgetByCategory), ...Object.keys(realizedByCategory)]);
    return Array.from(allCats).map(cat => ({
      categoria: cat.replace(/^\d+\.\s*/, ''),
      planejado: budgetByCategory[cat] || 0,
      realizado: realizedByCategory[cat] || 0,
    }));
  }, [budget, cashbook, selectedMonth]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const months: Record<number, { entradas: number; saidas: number }> = {};
    cashbook.forEach(c => {
      const m = new Date(c.data).getMonth();
      if (!months[m]) months[m] = { entradas: 0, saidas: 0 };
      if (c.tipo === 'ENTRADA') months[m].entradas += Number(c.valor);
      else months[m].saidas += Number(c.valor);
    });
    return Object.entries(months).map(([m, v]) => ({
      mes: MONTH_NAMES[Number(m)],
      entradas: v.entradas,
      saidas: v.saidas,
      resultado: v.entradas - v.saidas,
    }));
  }, [cashbook]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      
      if (lines.length < 2) {
        toast.error('Arquivo CSV vazio ou inválido');
        return;
      }

      try {
        if (importType === 'cashbook') {
          const rows = lines.slice(1).filter(l => l[0] && l[0] !== '').map(l => ({
            data: parseCSVDate(l[0]),
            tipo: l[1]?.toUpperCase() || 'SAÍDA',
            nivel1: l[2] || '',
            nivel2: l[3] || null,
            historico: l[4] || null,
            valor: parseCSVValue(l[5]),
            forma_pagamento: l[6] || null,
            banco_cartao: l[7] || null,
            saldo_acumulado: l[8] ? parseCSVValue(l[8]) : null,
            observacoes: l[9] || null,
          }));
          importCashbook.mutate(rows);
        } else if (importType === 'payables') {
          const rows = lines.slice(1).filter(l => l[0] && l[0] !== '').map(l => ({
            vencimento: parseCSVDate(l[0]),
            dias_vencer: parseInt(l[1]) || null,
            status: l[2] || 'PENDENTE',
            nivel1: l[3] || '',
            nivel2: l[4] || null,
            fornecedor: l[5] || null,
            historico: l[6] || null,
            valor: parseCSVValue(l[7]),
            forma_pagamento: l[8] || null,
            banco_cartao: l[9] || null,
            observacoes: l[10] || null,
          }));
          importPayables.mutate(rows);
        } else {
          const rows = lines.slice(1).filter(l => l[0] && l[0] !== '').map(l => ({
            codigo: l[0] || null,
            nivel1: l[1] || '',
            nivel2: l[2] || null,
            jan: parseCSVValue(l[3]),
            fev: parseCSVValue(l[4]),
            mar: parseCSVValue(l[5]),
            abr: parseCSVValue(l[6]),
            mai: parseCSVValue(l[7]),
            jun: parseCSVValue(l[8]),
            jul: parseCSVValue(l[9]),
            ago: parseCSVValue(l[10]),
            set: parseCSVValue(l[11]),
            out: parseCSVValue(l[12]),
            nov: parseCSVValue(l[13]),
            dez: parseCSVValue(l[14]),
            total_anual: parseCSVValue(l[15]),
          }));
          importBudget.mutate(rows);
        }
      } catch (err) {
        toast.error('Erro ao processar CSV. Verifique o formato.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newMessages);
    setChatLoading(true);

    try {
      // Build financial context for AI (data is injected server-side via context_data, 
      // the AI prompt has strict rules to never expose raw values)
      const financialContext = {
        saldo_atual: kpis.saldoAtual,
        total_entradas: kpis.entradas,
        total_saidas: kpis.saidas,
        total_a_pagar: kpis.totalAPagar,
        contas_pendentes: kpis.pendentes,
        saldo_projetado: kpis.saldoProjetado,
        indice_cobertura: kpis.totalAPagar > 0 ? kpis.saldoAtual / kpis.totalAPagar : null,
        categorias_despesa: categoryData.map(c => ({ categoria: c.name, valor: c.value })),
        contas_a_pagar: payables.map(p => ({
          vencimento: p.vencimento,
          status: p.status,
          categoria: p.nivel1,
          valor: Number(p.valor),
          dias: p.dias_vencer,
        })),
        movimentacoes_recentes: cashbook.slice(-10).map(c => ({
          data: c.data,
          tipo: c.tipo,
          categoria: c.nivel1,
          descricao: c.historico,
          valor: Number(c.valor),
        })),
      };

      const response = await supabase.functions.invoke('drx-ai-chat', {
        body: {
          context_type: 'financial_advisor',
          context_data: financialContext,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      // Handle streaming response
      if (response.data instanceof ReadableStream) {
        const reader = response.data.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        setChatMessages([...newMessages, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          
          for (const line of lines) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              assistantContent += delta;
              setChatMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            } catch {}
          }
        }
        
        if (!assistantContent) {
          setChatMessages([...newMessages, { role: 'assistant', content: 'Não consegui gerar uma resposta. Tente novamente.' }]);
        }
      } else {
        // Non-streaming fallback
        const reply = response.data?.choices?.[0]?.message?.content || response.data?.reply || 'Erro ao processar.';
        setChatMessages([...newMessages, { role: 'assistant', content: reply }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages([...newMessages, { role: 'assistant', content: 'Erro ao processar. Tente novamente.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-emerald-500" />
            Dashboard Financeiro DRX
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão e Operações Financeiras — Visão 360°</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={importType} onValueChange={(v: any) => setImportType(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cashbook">Livro Caixa</SelectItem>
              <SelectItem value="payables">Contas a Pagar</SelectItem>
              <SelectItem value="budget">Orçamento</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          <Button onClick={() => setChatOpen(!chatOpen)} variant={chatOpen ? 'default' : 'outline'} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Chat
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">Saldo Atual</span>
            </div>
            <p className="text-lg font-bold text-foreground">{fmt(kpis.saldoAtual)}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <ArrowUpCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Entradas</span>
            </div>
            <p className="text-lg font-bold text-foreground">{fmt(kpis.entradas)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <ArrowDownCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Saídas</span>
            </div>
            <p className="text-lg font-bold text-foreground">{fmt(kpis.saidas)}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">A Pagar</span>
            </div>
            <p className="text-lg font-bold text-foreground">{fmt(kpis.totalAPagar)}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Pendentes</span>
            </div>
            <p className="text-lg font-bold text-foreground">{kpis.pendentes}</p>
          </CardContent>
        </Card>
        <Card className={`${kpis.saldoProjetado >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <CardContent className="p-4">
            <div className={`flex items-center gap-2 mb-1 ${kpis.saldoProjetado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {kpis.saldoProjetado >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-xs font-medium">Projetado</span>
            </div>
            <p className="text-lg font-bold text-foreground">{fmt(kpis.saldoProjetado)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <FileSpreadsheet className="h-8 w-8 mr-2 opacity-50" />
                  Importe dados para visualizar
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Planejado vs Realizado</CardTitle>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {pxrData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pxrData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <YAxis type="category" dataKey="categoria" width={120} className="text-xs" />
                    <RechartsTooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="planejado" fill="#3b82f6" name="Planejado" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="realizado" fill="#22c55e" name="Realizado" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Importe orçamento e livro caixa
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      {monthlyTrend.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tendência Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <RechartsTooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="entradas" stroke="#22c55e" name="Entradas" strokeWidth={2} />
                  <Line type="monotone" dataKey="saidas" stroke="#ef4444" name="Saídas" strokeWidth={2} />
                  <Line type="monotone" dataKey="resultado" stroke="#3b82f6" name="Resultado" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Tables */}
      <Tabs defaultValue="cashbook" className="w-full">
        <TabsList>
          <TabsTrigger value="cashbook">📊 Livro Caixa</TabsTrigger>
          <TabsTrigger value="payables">📋 Contas a Pagar</TabsTrigger>
          <TabsTrigger value="budget">🎯 Orçamento</TabsTrigger>
          <TabsTrigger value="dfc">💰 DFC</TabsTrigger>
        </TabsList>

        <TabsContent value="cashbook">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nível 1</TableHead>
                      <TableHead>Nível 2</TableHead>
                      <TableHead>Histórico</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Forma Pgto</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashbook.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum registro. Importe um CSV.</TableCell></TableRow>
                    ) : cashbook.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">{row.data}</TableCell>
                        <TableCell>
                          <Badge variant={row.tipo === 'ENTRADA' ? 'default' : 'destructive'} className="text-xs">
                            {row.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{row.nivel1}</TableCell>
                        <TableCell className="text-xs">{row.nivel2}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{row.historico}</TableCell>
                        <TableCell className={`text-right font-medium ${row.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {fmt(Number(row.valor))}
                        </TableCell>
                        <TableCell className="text-xs">{row.forma_pagamento}</TableCell>
                        <TableCell className="text-xs">{row.banco_cartao}</TableCell>
                        <TableCell className="text-right font-medium">{row.saldo_acumulado ? fmt(Number(row.saldo_acumulado)) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Histórico</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Forma Pgto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payables.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum registro.</TableCell></TableRow>
                    ) : payables.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">{row.vencimento}</TableCell>
                        <TableCell>
                          <Badge variant={(row.dias_vencer || 0) <= 7 ? 'destructive' : 'secondary'} className="text-xs">
                            {row.dias_vencer}d
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.status === 'PAGO' ? 'default' : row.status === 'AGENDADO' ? 'secondary' : 'outline'} className="text-xs">
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{row.nivel1}</TableCell>
                        <TableCell className="text-xs">{row.fornecedor}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{row.historico}</TableCell>
                        <TableCell className="text-right font-medium text-red-500">{fmt(Number(row.valor))}</TableCell>
                        <TableCell className="text-xs">{row.forma_pagamento}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cód</TableHead>
                      <TableHead>Nível 1</TableHead>
                      <TableHead>Nível 2</TableHead>
                      {MONTH_NAMES.map(m => <TableHead key={m} className="text-right text-xs">{m}</TableHead>)}
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budget.length === 0 ? (
                      <TableRow><TableCell colSpan={16} className="text-center text-muted-foreground py-8">Nenhum registro.</TableCell></TableRow>
                    ) : budget.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs">{row.codigo}</TableCell>
                        <TableCell className="text-xs font-medium">{row.nivel1}</TableCell>
                        <TableCell className="text-xs">{row.nivel2}</TableCell>
                        {(['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const).map(m => (
                          <TableCell key={m} className="text-right text-xs">
                            {Number((row as any)[m]) > 0 ? fmt(Number((row as any)[m])) : '-'}
                          </TableCell>
                        ))}
                        <TableCell className="text-right text-xs font-bold">{row.total_anual ? fmt(Number(row.total_anual)) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dfc">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">📊 Situação Atual</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Saldo Atual no Banco</span><span className="font-bold">{fmt(kpis.saldoAtual)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total a Pagar</span><span className="font-bold text-red-500">{fmt(kpis.totalAPagar)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-sm font-medium">Saldo Projetado (30d)</span><span className={`font-bold ${kpis.saldoProjetado >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(kpis.saldoProjetado)}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">🏥 Saúde Financeira</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Índice de Cobertura</span>
                  <span className="font-bold">{kpis.totalAPagar > 0 ? (kpis.saldoAtual / kpis.totalAPagar).toFixed(2) : '∞'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status Geral</span>
                  <Badge variant={kpis.saldoProjetado >= 0 ? 'default' : 'destructive'}>
                    {kpis.saldoProjetado >= 0 ? '✅ SAUDÁVEL' : '⚠️ ATENÇÃO'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dias de Operação</span>
                  <span className="font-bold">
                    {kpis.saidas > 0 ? `${Math.floor(kpis.saldoAtual / (kpis.saidas / 30))} dias` : '∞'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Chat Panel */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 w-[400px] h-[500px] bg-card border border-border rounded-xl shadow-2xl flex flex-col z-50">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Assistente Financeiro DRX</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setChatOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Olá! Sou o assistente financeiro.</p>
                <p className="text-xs mt-1">Pergunte sobre fluxo de caixa, contas a pagar, orçamento...</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm animate-pulse">Analisando...</div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChatSend()}
              placeholder="Pergunte sobre as finanças..."
              className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="icon" onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
