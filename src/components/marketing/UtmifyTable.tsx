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
}

function StatusToggle({ status }: { status?: string }) {
  if (!status) return null;
  const isActive = status === 'active' || status === 'ACTIVE';
  return <Switch checked={isActive} className="scale-75" />;
}

const contasColumns = [
  { key: 'name', label: 'CONTA' },
  { key: 'totalSpend', label: 'TOTAL GASTO ⓘ' },
  { key: 'spend', label: 'GASTOS' },
  { key: 'vendas', label: 'VENDAS' },
  { key: 'faturamento', label: 'FATURAMENTO ⓘ' },
  { key: 'lucro', label: 'LUCRO ⓘ' },
  { key: 'clicks', label: 'CLIQUES ⓘ' },
  { key: 'cpc', label: 'CPC ⓘ' },
  { key: 'ctr', label: 'CTR' },
  { key: 'cpm', label: 'CPM' },
  { key: 'cartao', label: 'CARTÃO ⓘ' },
];

const campaignColumns = [
  { key: 'checkbox', label: '' },
  { key: 'status', label: 'STATUS' },
  { key: 'name', label: 'CAMPANHA' },
  { key: 'spend', label: 'GASTOS' },
  { key: 'vendas', label: 'VENDAS' },
  { key: 'faturamento', label: 'FATURAMENTO ⓘ' },
  { key: 'lucro', label: 'LUCRO ⓘ' },
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
      return formatCurrency(row.spend);
    case 'vendas':
      return String(row.vendas ?? row.conversions ?? 0);
    case 'faturamento':
      return formatCurrency(row.faturamento ?? 0);
    case 'lucro':
      return <span className={`${(row.lucro ?? 0) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>{formatCurrency(row.lucro ?? 0)}</span>;
    case 'clicks':
      return formatNumber(row.clicks);
    case 'cpc':
      return formatCurrency(row.cpc);
    case 'ctr':
      return `${row.ctr.toFixed(2)}%`;
    case 'cpm':
      return formatCurrency(row.cpm);
    case 'cpa':
      return formatCurrency(row.cpa ?? 0);
    case 'cartao':
      return row.cartao || 'N/A';
    case 'reach':
      return formatNumber(row.reach ?? 0);
    default:
      return '—';
  }
}

export default function UtmifyTable({ rows, activeTab, isLoading }: UtmifyTableProps) {
  const columns = columnsByTab[activeTab] || contasColumns;

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

  const footerLabel = activeTab === 'contas'
    ? `${rows.length} CONTAS`
    : activeTab === 'campanhas'
    ? `${rows.length} CAMPANHAS`
    : activeTab === 'conjuntos'
    ? `${rows.length} CONJUNTOS`
    : `${rows.length} ANÚNCIOS`;

  function renderFooterCell(key: string) {
    switch (key) {
      case 'checkbox': return 'N/A';
      case 'status': return 'N/A';
      case 'name': return footerLabel;
      case 'totalSpend': return formatCurrency(totalSpend);
      case 'spend': return formatCurrency(totalSpend);
      case 'vendas': return String(totalVendas);
      case 'faturamento': return formatCurrency(totalFaturamento);
      case 'lucro': return <span className={totalLucro >= 0 ? 'text-emerald-500' : 'text-destructive'}>{formatCurrency(totalLucro)}</span>;
      case 'clicks': return formatNumber(totalClicks);
      case 'cpc': return formatCurrency(avgCpc);
      case 'ctr': return `${avgCtr.toFixed(2)}%`;
      case 'cpm': return formatCurrency(avgCpm);
      case 'cpa': return formatCurrency(avgCpa);
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
          <TableRow className="border-b border-border bg-transparent">
            {columns.map(col => (
              <TableHead
                key={col.key}
                className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap px-3 py-3"
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id} className="border-b border-border/50 hover:bg-muted/20">
              {columns.map(col => (
                <TableCell key={col.key} className="text-xs px-3 py-3 whitespace-nowrap">
                  {renderCell(col.key, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {/* Footer totals row */}
          <TableRow className="bg-muted/30 border-t-2 border-border font-semibold">
            {columns.map(col => (
              <TableCell key={col.key} className="text-xs px-3 py-3 whitespace-nowrap font-bold">
                {renderFooterCell(col.key)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
