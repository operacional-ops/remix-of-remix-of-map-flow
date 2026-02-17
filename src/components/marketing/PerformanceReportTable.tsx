import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtNum(val: number) {
  return val.toLocaleString('pt-BR');
}

export interface PerformanceRow {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  cpm: number;
  ctr: number;
  cpc: number;
  purchases: number;
  cpp: number;
  roas: number;
}

interface Props {
  rows: PerformanceRow[];
  isLoading?: boolean;
}

export default function PerformanceReportTable({ rows, isLoading }: Props) {
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalImpr = rows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + (r.impressions > 0 ? r.impressions * (r.ctr / 100) : 0), 0);
  const totalPurchases = rows.reduce((s, r) => s + r.purchases, 0);
  const avgCpm = totalImpr > 0 ? (totalSpend / totalImpr) * 1000 : 0;
  const avgCtr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCpp = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const totalPurchaseValue = rows.reduce((s, r) => s + (r.roas * r.spend), 0);
  const totalRoas = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Carregando relatório...</div>;
  }

  if (rows.length === 0) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Nenhum dado disponível. Sincronize suas contas primeiro.</div>;
  }

  return (
    <ScrollArea className="flex-1 border border-border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/10">
            {['CAMPANHA', 'GASTO', 'IMPR.', 'CPM', 'CTR', 'CPC', 'VENDAS (PIXEL)', 'CPA (PIXEL)', 'ROAS (PIXEL)'].map(h => (
              <TableHead key={h} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap px-3 py-2.5">{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
              <TableCell className="text-xs px-3 py-2.5 font-medium truncate max-w-[220px]">{r.name}</TableCell>
              <TableCell className="text-xs px-3 py-2.5 text-red-400 whitespace-nowrap">{fmt(r.spend)}</TableCell>
              <TableCell className="text-xs px-3 py-2.5 whitespace-nowrap">{fmtNum(r.impressions)}</TableCell>
              <TableCell className="text-xs px-3 py-2.5 whitespace-nowrap">{fmt(r.cpm)}</TableCell>
              <TableCell className="text-xs px-3 py-2.5 whitespace-nowrap">{r.ctr.toFixed(2)}%</TableCell>
              <TableCell className="text-xs px-3 py-2.5 whitespace-nowrap">{fmt(r.cpc)}</TableCell>
              <TableCell className="text-xs px-3 py-2.5 whitespace-nowrap">
                <span className="text-blue-400 font-semibold">{r.purchases}</span>
              </TableCell>
              <TableCell className="text-xs px-3 py-2.5 whitespace-nowrap">{r.cpp > 0 ? fmt(r.cpp) : '—'}</TableCell>
              <TableCell className="text-xs px-3 py-2.5 whitespace-nowrap">
                <span className={`font-semibold ${r.roas >= 2 ? 'text-emerald-500' : r.roas >= 1 ? 'text-yellow-500' : r.roas > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {r.roas > 0 ? `${r.roas.toFixed(2)}x` : '—'}
                </span>
              </TableCell>
            </TableRow>
          ))}
          {/* Totals */}
          <TableRow className="bg-muted/40 border-t-2 border-primary/30 sticky bottom-0">
            <TableCell className="text-xs px-3 py-3 font-bold">{rows.length} CAMPANHAS</TableCell>
            <TableCell className="text-xs px-3 py-3 text-red-400 font-bold whitespace-nowrap">{fmt(totalSpend)}</TableCell>
            <TableCell className="text-xs px-3 py-3 whitespace-nowrap">{fmtNum(totalImpr)}</TableCell>
            <TableCell className="text-xs px-3 py-3 whitespace-nowrap">{fmt(avgCpm)}</TableCell>
            <TableCell className="text-xs px-3 py-3 whitespace-nowrap">{avgCtr.toFixed(2)}%</TableCell>
            <TableCell className="text-xs px-3 py-3 whitespace-nowrap">{fmt(avgCpc)}</TableCell>
            <TableCell className="text-xs px-3 py-3 whitespace-nowrap"><span className="text-blue-400 font-bold">{totalPurchases}</span></TableCell>
            <TableCell className="text-xs px-3 py-3 whitespace-nowrap">{avgCpp > 0 ? fmt(avgCpp) : '—'}</TableCell>
            <TableCell className="text-xs px-3 py-3 whitespace-nowrap">
              <span className={`font-bold ${totalRoas >= 2 ? 'text-emerald-500' : totalRoas >= 1 ? 'text-yellow-500' : totalRoas > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {totalRoas > 0 ? `${totalRoas.toFixed(2)}x` : '—'}
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
