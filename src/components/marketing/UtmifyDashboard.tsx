import { useState } from 'react';
import { RefreshCw, TrendingUp, Eye, MousePointerClick, DollarSign, Target, Megaphone, BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFacebookMetrics, useFacebookCampaignInsights, useSyncFacebookMetrics } from '@/hooks/useFacebookMetrics';
import { FacebookConnection } from '@/hooks/useFacebookConnections';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import FacebookLoginButton from './FacebookLoginButton';
import AccountSelector from './AccountSelector';

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(val: number) {
  return val.toLocaleString('pt-BR');
}

function CampaignStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-600',
    paused: 'bg-yellow-500/20 text-yellow-600',
    deleted: 'bg-destructive/20 text-destructive',
    archived: 'bg-muted text-muted-foreground',
  };
  const labels: Record<string, string> = {
    active: 'Ativo',
    paused: 'Pausado',
    deleted: 'Deletado',
    archived: 'Arquivado',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  );
}

interface UtmifyDashboardProps {
  connection: FacebookConnection | null;
}

export default function UtmifyDashboard({ connection }: UtmifyDashboardProps) {
  const { activeWorkspace } = useWorkspace();
  const { data: metrics, isLoading } = useFacebookMetrics(activeWorkspace?.id);
  const { data: campaigns, isLoading: loadingCampaigns } = useFacebookCampaignInsights(activeWorkspace?.id);
  const syncMutation = useSyncFacebookMetrics();
  const [datePreset, setDatePreset] = useState('maximum');
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const selectedAccounts = connection?.selected_account_ids || [];

  const handleSyncAll = () => {
    if (!connection || selectedAccounts.length === 0) {
      toast.error('Selecione ao menos uma conta de anúncio');
      setShowAccountSelector(true);
      return;
    }

    selectedAccounts.forEach(accountId => {
      syncMutation.mutate({
        accountId,
        workspaceId: activeWorkspace?.id,
        accessToken: connection.access_token,
        datePreset,
      });
    });
  };

  // Account-level summary
  const totalSpend = metrics?.reduce((s, m) => s + Number(m.spend), 0) || 0;
  const totalImpressions = metrics?.reduce((s, m) => s + Number(m.impressions), 0) || 0;
  const totalClicks = metrics?.reduce((s, m) => s + Number(m.clicks), 0) || 0;
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const totalCampaignSpend = campaigns?.reduce((s, c) => s + Number(c.spend), 0) || 0;
  const totalConversions = campaigns?.reduce((s, c) => s + Number(c.conversions), 0) || 0;
  const avgCpm = campaigns && campaigns.length > 0
    ? campaigns.reduce((s, c) => s + Number(c.cpm), 0) / campaigns.length : 0;
  const avgCpc = totalClicks > 0 ? totalCampaignSpend / totalClicks : 0;

  const summaryCards = [
    { title: 'Gasto Total', value: formatCurrency(totalSpend), icon: DollarSign, color: 'text-red-500' },
    { title: 'Impressões', value: formatNumber(totalImpressions), icon: Eye, color: 'text-blue-500' },
    { title: 'Cliques', value: formatNumber(totalClicks), icon: MousePointerClick, color: 'text-emerald-500' },
    { title: 'CTR Médio', value: `${avgCtr.toFixed(2)}%`, icon: TrendingUp, color: 'text-amber-500' },
    { title: 'CPM Médio', value: formatCurrency(avgCpm), icon: Megaphone, color: 'text-purple-500' },
    { title: 'CPC Médio', value: formatCurrency(avgCpc), icon: Target, color: 'text-cyan-500' },
  ];

  // Group campaigns by campaign_id
  const campaignMap = new Map<string, {
    campaign_name: string;
    campaign_id: string;
    status: string;
    objective: string;
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    ctr: number;
    cpm: number;
    cpc: number;
    cpa: number;
    conversions: number;
    roas: number;
  }>();

  campaigns?.forEach(c => {
    const key = c.campaign_id;
    const existing = campaignMap.get(key);
    if (existing) {
      existing.spend += Number(c.spend);
      existing.impressions += Number(c.impressions);
      existing.clicks += Number(c.clicks);
      existing.reach += Number(c.reach);
      existing.conversions += Number(c.conversions);
      existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0;
      existing.cpm = existing.impressions > 0 ? (existing.spend / existing.impressions) * 1000 : 0;
      existing.cpc = existing.clicks > 0 ? existing.spend / existing.clicks : 0;
      existing.cpa = existing.conversions > 0 ? existing.spend / existing.conversions : 0;
      existing.roas = Number(c.roas) || existing.roas;
      existing.status = c.status || existing.status;
    } else {
      campaignMap.set(key, {
        campaign_name: c.campaign_name || 'Sem nome',
        campaign_id: c.campaign_id,
        status: c.status || 'unknown',
        objective: c.objective || '',
        spend: Number(c.spend),
        impressions: Number(c.impressions),
        clicks: Number(c.clicks),
        reach: Number(c.reach),
        ctr: Number(c.ctr),
        cpm: Number(c.cpm),
        cpc: Number(c.cpc),
        cpa: Number(c.cpa),
        conversions: Number(c.conversions),
        roas: Number(c.roas),
      });
    }
  });

  const aggregatedCampaigns = Array.from(campaignMap.values()).sort((a, b) => b.spend - a.spend);

  if (!connection) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold">Conecte seu Facebook</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Para visualizar métricas de campanhas, conecte seu perfil do Facebook. 
              Cada gestor pode conectar seu próprio perfil e selecionar as contas que gerencia.
            </p>
          </div>
          <FacebookLoginButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FacebookLoginButton />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAccountSelector(!showAccountSelector)}
            className="text-xs"
          >
            {selectedAccounts.length} conta(s) · Gerenciar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
              <SelectItem value="last_14d">Últimos 14 dias</SelectItem>
              <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
              <SelectItem value="this_month">Este mês</SelectItem>
              <SelectItem value="last_month">Mês passado</SelectItem>
              <SelectItem value="maximum">Máximo</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={handleSyncAll}
            disabled={syncMutation.isPending || selectedAccounts.length === 0}
            className="gap-2"
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Account selector (collapsible) */}
      {showAccountSelector && (
        <AccountSelector
          connection={connection}
          onAccountsSelected={() => setShowAccountSelector(false)}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map(card => (
          <Card key={card.title} className="bg-muted/30">
            <CardContent className="p-3 flex items-center gap-2">
              <card.icon className={`h-6 w-6 ${card.color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{card.title}</p>
                <p className="text-sm font-bold truncate">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign table */}
      {aggregatedCampaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Campanhas ({aggregatedCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-3">Campanha</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">Status</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">Gastos</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">CPM</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">CPC</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">CTR</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">Impressões</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">Cliques</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">Alcance</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">Conv.</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">CPA</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap px-2">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedCampaigns.map(c => (
                    <TableRow key={c.campaign_id} className="hover:bg-muted/30">
                      <TableCell className="text-xs px-3 max-w-[220px] truncate font-medium" title={c.campaign_name}>
                        {c.campaign_name}
                      </TableCell>
                      <TableCell className="px-2"><CampaignStatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-xs px-2 whitespace-nowrap">{formatCurrency(c.spend)}</TableCell>
                      <TableCell className="text-xs px-2 whitespace-nowrap">{formatCurrency(c.cpm)}</TableCell>
                      <TableCell className="text-xs px-2 whitespace-nowrap">{formatCurrency(c.cpc)}</TableCell>
                      <TableCell className="text-xs px-2 whitespace-nowrap">{c.ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-xs px-2 whitespace-nowrap">{formatNumber(c.impressions)}</TableCell>
                      <TableCell className="text-xs px-2 whitespace-nowrap">{formatNumber(c.clicks)}</TableCell>
                      <TableCell className="text-xs px-2 whitespace-nowrap">{formatNumber(c.reach)}</TableCell>
                      <TableCell className="text-xs px-2 whitespace-nowrap">{c.conversions}</TableCell>
                      <TableCell className="text-xs px-2 whitespace-nowrap">{formatCurrency(c.cpa)}</TableCell>
                      <TableCell className={`text-xs px-2 whitespace-nowrap font-medium ${c.roas >= 2 ? 'text-emerald-500' : c.roas >= 1 ? 'text-yellow-500' : 'text-destructive'}`}>
                        {c.roas.toFixed(2)}x
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {(isLoading || loadingCampaigns) && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando métricas...
        </div>
      )}

      {!isLoading && !loadingCampaigns && aggregatedCampaigns.length === 0 && selectedAccounts.length > 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum dado sincronizado. Clique em "Sincronizar" para buscar métricas das contas selecionadas.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
