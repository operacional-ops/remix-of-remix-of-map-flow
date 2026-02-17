import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(val: number) {
  return val.toLocaleString('pt-BR');
}

export interface UtmifyRow {
  id: string;
  name: string;
  status?: string;
  spend: number;
  totalSpend?: number;
  vendas?: number;
  faturamento?: number;
  lucro?: number;
  clicks: number;
  impressions: number;
  cpc: number;
  ctr: number;
  cpm: number;
  cpa?: number;
  roas?: number;
  reach?: number;
  conversions?: number;
  cartao?: string;
}

interface UtmifyTableProps {
  rows: UtmifyRow[];
  activeTab: string;
  isLoading?: boolean;
  hiddenColumns?: string[];
}

function StatusToggle({ status }: { status?: string }) {
  if (!status) return null;
  const isActive = status === 'active' || status === 'ACTIVE';
  return (
    <div className="flex items-center gap-1.5">
      <Switch checked={isActive} className="scale-75" />
      <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
        {isActive ? 'Ativo' : 'Pausado'}
      </span>
    </div>
  );
}

const contasColumns = [
  { key: 'name', label: 'CONTA' },
  { key: 'totalSpend', label: 'TOTAL GASTO ⓘ' },
  { key: 'spend', label: 'GASTOS' },
  { key: 'vendas', label: 'VENDAS' },
  { key: 'faturamento', label: 'FATURAMENTO ⓘ' },
  { key: 'lucro', label: 'LUCRO ⓘ' },
  { key: 'roas_calc', label: 'ROAS' },
  { key: 'clicks', label: 'CLIQUES ⓘ' },
  { key: 'cpc', label: 'CPC ⓘ' },
  { key: 'ctr', label: 'CTR' },
  { key: 'cpm', label: 'CPM' },
];

const campaignColumns = [
  { key: 'checkbox', label: '' },
  { key: 'status', label: 'STATUS' },
  { key: 'name', label: 'CAMPANHA' },
  { key: 'spend', label: 'GASTOS' },
  { key: 'vendas', label: 'VENDAS' },
  { key: 'faturamento', label: 'FATURAMENTO ⓘ' },
  { key: 'lucro', label: 'LUCRO ⓘ' },
  { key: 'roas_calc', label: 'ROAS' },
  { key: 'clicks', label: 'CLIQUES ⓘ' },
  { key: 'cpc', label: 'CPC ⓘ' },
  { key: 'ctr', label: 'CTR ⓘ' },
  { key: 'cpm', label: 'CPM' },
  { key: 'cpa', label: 'CPA ⓘ' },
];

const conjuntoColumns = [
  { key: 'checkbox', label: '' },
  { key: 'status', label: 'STATUS' },
  { key: 'name', label: 'CONJUNTO' },
  { key: 'spend', label: 'GASTOS' },
  { key: 'vendas', label: 'VENDAS' },
  { key: 'faturamento', label: 'FATURAMENTO ⓘ' },
  { key: 'lucro', label: 'LUCRO ⓘ' },
  { key: 'roas_calc', label: 'ROAS' },
  { key: 'clicks', label: 'CLIQUES ⓘ' },
  { key: 'cpc', label: 'CPC ⓘ' },
  { key: 'ctr', label: 'CTR ⓘ' },
  { key: 'cpm', label: 'CPM' },
  { key: 'cpa', label: 'CPA' },
];

const anuncioColumns = [
  { key: 'checkbox', label: '' },
  { key: 'status', label: 'STATUS' },
  { key: 'name', label: 'ANÚNCIO' },
  { key: 'spend', label: 'GASTOS' },
  { key: 'vendas', label: 'VENDAS' },
  { key: 'faturamento', label: 'FATURAMENTO ⓘ' },
  { key: 'lucro', label: 'LUCRO ⓘ' },
  { key: 'roas_calc', label: 'ROAS' },
  { key: 'clicks', label: 'CLIQUES ⓘ' },
  { key: 'cpc', label: 'CPC ⓘ' },
  { key: 'ctr', label: 'CTR ⓘ' },
  { key: 'cpm', label: 'CPM' },
  { key: 'cpa', label: 'CPA ⓘ' },
];

const columnsByTab: Record<string, typeof contasColumns> = {
  contas: contasColumns,
  campanhas: campaignColumns,
  conjuntos: conjuntoColumns,
  anuncios: anuncioColumns,
};

export function getColumnsByTab(tab: string) {
  return columnsByTab[tab] || contasColumns;
}

function renderCell(key: string, row: UtmifyRow) {
  switch (key) {
    case 'checkbox':
      return <Checkbox className="h-4 w-4" />;
    case 'status':
      return <StatusToggle status={row.status} />;
    case 'name':
      return <span className="font-medium truncate max-w-[200px] block">{row.name}</span>;
    case 'totalSpend':
      return formatCurrency(row.totalSpend ?? row.spend);
    case 'spend':
      return <span className="text-red-400">{formatCurrency(row.spend)}</span>;
    case 'vendas':
      return <span className="text-blue-400 font-semibold">{String(row.vendas ?? row.conversions ?? 0)}</span>;
    case 'faturamento':
      return <span className="text-emerald-500">{formatCurrency(row.faturamento ?? 0)}</span>;
    case 'lucro': {
      const v = row.lucro ?? 0;
      return <span className={`font-semibold ${v >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(v)}</span>;
    }
    case 'roas_calc': {
      const roas = row.spend > 0 && (row.faturamento ?? 0) > 0 ? (row.faturamento! / row.spend) : 0;
      const color = roas >= 2 ? 'text-emerald-500' : roas >= 1 ? 'text-yellow-500' : roas > 0 ? 'text-red-400' : 'text-muted-foreground';
      return <span className={`font-semibold ${color}`}>{roas > 0 ? `${roas.toFixed(2)}x` : '—'}</span>;
    }
    case 'clicks':
      return formatNumber(row.clicks);
    case 'cpc':
      return formatCurrency(row.cpc);
    case 'ctr':
      return `${row.ctr.toFixed(2)}%`;
    case 'cpm':
      return formatCurrency(row.cpm);
    case 'cpa':
      return row.cpa && row.cpa > 0 ? formatCurrency(row.cpa) : '—';
    case 'cartao':
      return row.cartao || 'N/A';
    case 'reach':
      return formatNumber(row.reach ?? 0);
    default:
      return '—';
  }
}

export default function UtmifyTable({ rows, activeTab, isLoading, hiddenColumns = [] }: UtmifyTableProps) {
  const allColumns = columnsByTab[activeTab] || contasColumns;
  const columns = allColumns.filter(c => !hiddenColumns.includes(c.key));

  // Calculate totals
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalVendas = rows.reduce((s, r) => s + (r.vendas ?? r.conversions ?? 0), 0);
  const totalFaturamento = rows.reduce((s, r) => s + (r.faturamento ?? 0), 0);
  const totalLucro = rows.reduce((s, r) => s + (r.lucro ?? 0), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const avgCpa = totalVendas > 0 ? totalSpend / totalVendas : 0;
  const totalRoas = totalSpend > 0 && totalFaturamento > 0 ? totalFaturamento / totalSpend : 0;

  const footerLabel = activeTab === 'contas'
    ? `${rows.length} CONTAS`
    : activeTab === 'campanhas'
    ? `${rows.length} CAMPANHAS`
    : activeTab === 'conjuntos'
    ? `${rows.length} CONJUNTOS`
    : `${rows.length} ANÚNCIOS`;

  function renderFooterCell(key: string) {
    switch (key) {
      case 'checkbox': return '';
      case 'status': return '';
      case 'name': return <span className="font-bold">{footerLabel}</span>;
      case 'totalSpend': return <span className="text-red-400">{formatCurrency(totalSpend)}</span>;
      case 'spend': return <span className="text-red-400">{formatCurrency(totalSpend)}</span>;
      case 'vendas': return <span className="text-blue-400 font-bold">{String(totalVendas)}</span>;
      case 'faturamento': return <span className="text-emerald-500 font-bold">{formatCurrency(totalFaturamento)}</span>;
      case 'lucro': return <span className={`font-bold ${totalLucro >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>{formatCurrency(totalLucro)}</span>;
      case 'roas_calc': {
        const color = totalRoas >= 2 ? 'text-emerald-500' : totalRoas >= 1 ? 'text-yellow-500' : totalRoas > 0 ? 'text-red-400' : 'text-muted-foreground';
        return <span className={`font-bold ${color}`}>{totalRoas > 0 ? `${totalRoas.toFixed(2)}x` : '—'}</span>;
      }
      case 'clicks': return formatNumber(totalClicks);
      case 'cpc': return formatCurrency(avgCpc);
      case 'ctr': return `${avgCtr.toFixed(2)}%`;
      case 'cpm': return formatCurrency(avgCpm);
      case 'cpa': return avgCpa > 0 ? formatCurrency(avgCpa) : '—';
      case 'cartao': return 'N/A';
      default: return '—';
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Carregando métricas...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Nenhum dado sincronizado. Clique em "Atualizar" para buscar métricas.
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/10">
            {columns.map(col => (
              <TableHead
                key={col.key}
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap px-3 py-2.5"
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => {
            const isLoss = (row.lucro ?? 0) < 0;
            return (
              <TableRow
                key={row.id}
                className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${isLoss ? 'bg-red-500/[0.03]' : ''}`}
              >
                {columns.map(col => (
                  <TableCell key={col.key} className="text-xs px-3 py-2.5 whitespace-nowrap">
                    {renderCell(col.key, row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {/* Footer totals row */}
          <TableRow className="bg-muted/40 border-t-2 border-primary/30 sticky bottom-0">
            {columns.map(col => (
              <TableCell key={col.key} className="text-xs px-3 py-3 whitespace-nowrap">
                {renderFooterCell(col.key)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
