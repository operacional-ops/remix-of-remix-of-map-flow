import { useState, useRef, useCallback } from 'react';
import { Plus, Upload, Package, Trash2, ChevronDown, TrendingUp, DollarSign, ShoppingCart, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  useOperationalProducts,
  useOperationalMetrics,
  useCreateProduct,
  useImportMetrics,
  useAddMetricRow,
  useUpdateMetric,
  useDeleteMetric,
  type OperationalMetric,
} from '@/hooks/useOperationalProducts';

const COLUMNS = [
  { key: 'data', label: 'Data', type: 'date' },
  { key: 'contas_produto', label: 'Contas + Produto', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['Testando', 'Ativo', 'Pausado', 'Morto'] },
  { key: 'gastos', label: 'Gastos', type: 'currency' },
  { key: 'cpm', label: 'CPM', type: 'currency' },
  { key: 'cpc', label: 'CPC', type: 'currency' },
  { key: 'conv_funil', label: 'Conv. Funil', type: 'percent' },
  { key: 'qnt_vendas', label: 'Qnt. Vendas', type: 'number' },
  { key: 'ticket_medio', label: 'Ticket Médio', type: 'currency' },
  { key: 'cpa', label: 'CPA', type: 'currency' },
  { key: 'resultado', label: 'Resultado', type: 'currency' },
  { key: 'lucro_bruto', label: 'Lucro Bruto', type: 'currency' },
  { key: 'roas', label: 'ROAS', type: 'number' },
  { key: 'margem', label: 'Margem', type: 'percent' },
] as const;

function parseCSVValue(val: string): number {
  if (!val || val === 'NaN' || val === 'Infinity' || val === '-Infinity') return 0;
  return parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').replace('%', '').trim()) || 0;
}

function parseDateBR(dateStr: string): string {
  const months: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12',
  };
  const parts = dateStr.toLowerCase().trim().split(/\s+de\s+/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

function parseCSVRows(text: string): Omit<OperationalMetric, 'id' | 'product_id'>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  // skip header
  return lines.slice(1).map(line => {
    // Handle CSV with potential commas inside quotes
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { cols.push(current); current = ''; continue; }
      current += ch;
    }
    cols.push(current);

    return {
      data: parseDateBR(cols[0] || ''),
      contas_produto: (cols[1] || '').trim(),
      status: (cols[2] || 'Testando').trim(),
      gastos: parseCSVValue(cols[3]),
      cpm: parseCSVValue(cols[4]),
      cpc: parseCSVValue(cols[5]),
      conv_funil: parseCSVValue(cols[6]),
      qnt_vendas: parseInt(cols[7]) || 0,
      ticket_medio: parseCSVValue(cols[8]),
      cpa: parseCSVValue(cols[9]),
      resultado: parseCSVValue(cols[10]),
      lucro_bruto: parseCSVValue(cols[11]),
      roas: parseCSVValue(cols[12]),
      margem: parseCSVValue(cols[13]),
    };
  });
}

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(val: number) {
  return `${val.toFixed(2)}%`;
}

function formatDate(val: string) {
  if (!val) return '';
  const d = new Date(val + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getCellColor(col: string, val: number): string {
  if (col === 'lucro_bruto' || col === 'resultado') {
    return val > 0 ? 'text-emerald-500' : val < 0 ? 'text-destructive' : '';
  }
  if (col === 'roas') {
    return val >= 2 ? 'text-emerald-500' : val >= 1 ? 'text-yellow-500' : 'text-destructive';
  }
  if (col === 'margem') {
    return val > 0 ? 'text-emerald-500' : val < 0 ? 'text-destructive' : '';
  }
  return '';
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Testando': 'bg-yellow-500/20 text-yellow-600',
    'Ativo': 'bg-emerald-500/20 text-emerald-600',
    'Pausado': 'bg-muted text-muted-foreground',
    'Morto': 'bg-destructive/20 text-destructive',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}

// Editable cell
function EditableCell({ value, type, colKey, rowId, onSave }: {
  value: any;
  type: string;
  colKey: string;
  rowId: string;
  onSave: (id: string, field: string, value: any) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(String(value ?? ''));

  const handleSave = () => {
    setEditing(false);
    let parsed: any = localVal;
    if (type === 'currency' || type === 'number' || type === 'percent') {
      parsed = parseFloat(localVal.replace(',', '.')) || 0;
    }
    onSave(rowId, colKey, parsed);
  };

  if (type === 'select') {
    return (
      <Select value={String(value)} onValueChange={(v) => onSave(rowId, colKey, v)}>
        <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 w-auto min-w-[80px]">
          <StatusBadge status={String(value)} />
        </SelectTrigger>
        <SelectContent>
          {['Testando', 'Ativo', 'Pausado', 'Morto'].map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (editing) {
    return (
      <Input
        autoFocus
        className="h-7 text-xs w-full min-w-[80px] px-1"
        value={localVal}
        onChange={e => setLocalVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
      />
    );
  }

  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  let display = String(value ?? '');
  if (type === 'currency') display = formatCurrency(numVal);
  else if (type === 'percent') display = formatPercent(numVal);
  else if (type === 'date') display = formatDate(String(value));
  else if (type === 'number') display = String(numVal);

  const colorClass = getCellColor(colKey, numVal);

  return (
    <button
      className={`text-left w-full text-xs px-1 py-0.5 rounded hover:bg-muted/50 cursor-text ${colorClass}`}
      onClick={() => { setLocalVal(type === 'date' ? String(value ?? '') : String(numVal)); setEditing(true); }}
    >
      {display || '—'}
    </button>
  );
}

export default function DashboardOperacao() {
  const { data: products, isLoading: loadingProducts } = useOperationalProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { data: metrics, isLoading: loadingMetrics } = useOperationalMetrics(selectedProductId);
  const createProduct = useCreateProduct();
  const importMetrics = useImportMetrics();
  const addRow = useAddMetricRow();
  const updateMetric = useUpdateMetric();
  const deleteMetric = useDeleteMetric();

  const [newProductName, setNewProductName] = useState('');
  const [newProductCode, setNewProductCode] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first product
  const activeProduct = products?.find(p => p.id === selectedProductId) || products?.[0] || null;
  if (activeProduct && selectedProductId !== activeProduct.id) {
    setTimeout(() => setSelectedProductId(activeProduct.id), 0);
  }

  const handleCreateProduct = async () => {
    if (!newProductName.trim() || !newProductCode.trim()) return;
    try {
      const prod = await createProduct.mutateAsync({ name: newProductName, code: newProductCode });
      setSelectedProductId(prod.id);
      setNewProductName('');
      setNewProductCode('');
      setDialogOpen(false);
      toast.success('Produto criado com sucesso!');
    } catch { toast.error('Erro ao criar produto'); }
  };

  const handleCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductId) return;
    const text = await file.text();
    const rows = parseCSVRows(text);
    if (rows.length === 0) { toast.error('CSV vazio ou formato inválido'); return; }
    try {
      await importMetrics.mutateAsync({ productId: selectedProductId, rows });
      toast.success(`${rows.length} linhas importadas com sucesso!`);
    } catch { toast.error('Erro ao importar CSV'); }
    e.target.value = '';
  }, [selectedProductId, importMetrics]);

  const handleAddRow = async () => {
    if (!selectedProductId) return;
    const today = new Date().toISOString().split('T')[0];
    await addRow.mutateAsync({
      product_id: selectedProductId,
      data: today,
      contas_produto: activeProduct?.code || '',
      status: 'Testando',
    });
  };

  const handleCellSave = (id: string, field: string, value: any) => {
    updateMetric.mutate({ id, field, value });
  };

  // Summary calculations
  const totalGastos = metrics?.reduce((s, m) => s + Number(m.gastos), 0) || 0;
  const totalResultado = metrics?.reduce((s, m) => s + Number(m.resultado), 0) || 0;
  const totalLucro = metrics?.reduce((s, m) => s + Number(m.lucro_bruto), 0) || 0;
  const totalVendas = metrics?.reduce((s, m) => s + Number(m.qnt_vendas), 0) || 0;
  const avgRoas = totalGastos > 0 ? totalResultado / totalGastos : 0;

  const summaryCards = [
    { title: 'ROAS', value: avgRoas.toFixed(2) + 'x', icon: TrendingUp, positive: avgRoas >= 1 },
    { title: 'Lucro Bruto', value: formatCurrency(totalLucro), icon: DollarSign, positive: totalLucro >= 0 },
    { title: 'Vendas', value: String(totalVendas), icon: ShoppingCart, positive: true },
    { title: 'Gasto Total', value: formatCurrency(totalGastos), icon: CreditCard, positive: false },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar lateral */}
      <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Controle Operacional Geral</h2>
        </div>

        <div className="p-3 border-b border-border space-y-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                <Plus className="h-3.5 w-3.5" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Nome do produto (ex: LITHIUM)" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
                <Input placeholder="Código (ex: LTH)" value={newProductCode} onChange={e => setNewProductCode(e.target.value)} />
                <Button onClick={handleCreateProduct} className="w-full" disabled={createProduct.isPending}>
                  Criar Produto
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedProductId}
          >
            <Upload className="h-3.5 w-3.5" /> Importar CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingProducts && <p className="text-xs text-muted-foreground p-2">Carregando...</p>}
            {products?.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedProductId === product.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Package className="h-4 w-4 shrink-0" />
                <span className="truncate">{product.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{product.code}</span>
              </button>
            ))}
            {products?.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">
                Nenhum produto cadastrado. Clique em "Novo Produto" para começar.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header + Summary */}
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {activeProduct ? `Controle de Contas — ${activeProduct.name}` : 'Dashboard Operação'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {activeProduct ? `Produto: ${activeProduct.code}` : 'Selecione um produto na lateral'}
              </p>
            </div>
            {selectedProductId && (
              <Button size="sm" variant="outline" onClick={handleAddRow} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Nova Linha
              </Button>
            )}
          </div>

          {/* Summary cards */}
          {selectedProductId && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {summaryCards.map(card => (
                <Card key={card.title} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{card.title}</p>
                      <p className={`text-lg font-bold ${card.positive ? 'text-foreground' : 'text-foreground'}`}>
                        {card.value}
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <card.icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Airtable-style Table */}
        <div className="flex-1 overflow-auto">
          {!selectedProductId ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Selecione ou crie um produto para visualizar os dados
            </div>
          ) : loadingMetrics ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Carregando métricas...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {COLUMNS.map(col => (
                    <TableHead key={col.key} className="text-xs font-semibold whitespace-nowrap px-2 py-2 border-r border-border last:border-r-0">
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-8 px-1" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.map(row => (
                  <TableRow key={row.id} className="group hover:bg-muted/30 border-b border-border">
                    {COLUMNS.map(col => (
                      <TableCell key={col.key} className="px-1 py-1 border-r border-border last:border-r-0 whitespace-nowrap">
                        <EditableCell
                          value={(row as any)[col.key]}
                          type={col.type}
                          colKey={col.key}
                          rowId={row.id}
                          onSave={handleCellSave}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="px-1 py-1">
                      <button
                        onClick={() => deleteMetric.mutate(row.id)}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {metrics?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length + 1} className="text-center text-muted-foreground text-sm py-8">
                      Nenhum dado. Importe um CSV ou adicione uma nova linha.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
