import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { DashboardCampaign } from '@/hooks/useDashboardData';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function num(val: number) {
  return val.toLocaleString('pt-BR');
}

function RoasBadge({ roas }: { roas: number | null }) {
  if (roas === null || roas === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  const variant = roas >= 2 ? 'default' : roas >= 1 ? 'secondary' : 'destructive';
  const className = roas >= 2
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    : roas >= 1
      ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
      : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';

  return <Badge variant="outline" className={className}>{roas.toFixed(2)}x</Badge>;
}

export default function CampaignTable({ campaigns }: { campaigns: DashboardCampaign[] }) {
  if (campaigns.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-2">Campanhas</p>
          <p className="text-xs text-muted-foreground text-center py-8">Sem dados para a data selecionada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground mb-3">Campanhas ({campaigns.length})</p>
        <ScrollArea className="max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Campanha</TableHead>
                <TableHead className="text-xs text-right">Investimento</TableHead>
                <TableHead className="text-xs text-right">Impressões</TableHead>
                <TableHead className="text-xs text-right">Cliques</TableHead>
                <TableHead className="text-xs text-right">Vendas Reais</TableHead>
                <TableHead className="text-xs text-right">Aprovadas</TableHead>
                <TableHead className="text-xs text-right">Faturamento</TableHead>
                <TableHead className="text-xs text-right">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c, i) => (
                <TableRow key={c.campaign_id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                  <TableCell className="text-xs font-medium max-w-[200px] truncate" title={c.campaign_name}>
                    {c.campaign_name}
                  </TableCell>
                  <TableCell className="text-xs text-right">{fmt(c.meta.spend)}</TableCell>
                  <TableCell className="text-xs text-right">{num(c.meta.impressions)}</TableCell>
                  <TableCell className="text-xs text-right">{num(c.meta.clicks)}</TableCell>
                  <TableCell className="text-xs text-right">{c.payt.vendas_totais}</TableCell>
                  <TableCell className="text-xs text-right">{c.payt.vendas_aprovadas}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(c.payt.faturamento_aprovado)}</TableCell>
                  <TableCell className="text-xs text-right"><RoasBadge roas={c.roas} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
