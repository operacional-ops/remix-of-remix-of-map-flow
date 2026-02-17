import { useState, useMemo } from 'react';
import { BarChart3, Grid3X3, Layers, Image } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useFacebookConnection } from '@/hooks/useFacebookConnections';
import { useFacebookMetrics, useFacebookCampaignInsights, useFacebookAdsetInsights, useFacebookAdInsights, useSyncFacebookMetrics } from '@/hooks/useFacebookMetrics';
import UtmifySidebar from '@/components/marketing/UtmifySidebar';
import UtmifyFilters from '@/components/marketing/UtmifyFilters';
import UtmifyTable, { type UtmifyRow } from '@/components/marketing/UtmifyTable';
import ResumoView from '@/components/marketing/ResumoView';
import FacebookLoginButton from '@/components/marketing/FacebookLoginButton';
import AccountSelector from '@/components/marketing/AccountSelector';
import { toast } from 'sonner';
import { usePaytSalesBreakdown, matchSalesToCampaign, matchSalesViaParentCampaign } from '@/hooks/useUnifiedMetrics';

export default function DashboardOperacao() {
  const { activeWorkspace } = useWorkspace();
  const { data: fbConnection } = useFacebookConnection(activeWorkspace?.id);
  const syncMutation = useSyncFacebookMetrics();

  const [sidebarView, setSidebarView] = useState<'resumo' | 'meta'>('resumo');
  const [activeTab, setActiveTab] = useState('contas');
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('last_30d');
  const [accountFilter, setAccountFilter] = useState('all');
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const connection = fbConnection || null;
  const selectedAccounts = connection?.selected_account_ids || [];

  // Build filter params — changes trigger automatic refetch via queryKey
  const filterParams = useMemo(() => ({
    workspaceId: activeWorkspace?.id,
    datePreset,
    accountId: accountFilter,
  }), [activeWorkspace?.id, datePreset, accountFilter]);

  const { data: metrics, isLoading: metricsLoading } = useFacebookMetrics(filterParams);
  const { data: campaigns, isLoading: campaignsLoading } = useFacebookCampaignInsights(filterParams);
  const { data: adsets } = useFacebookAdsetInsights(filterParams);
  const { data: ads } = useFacebookAdInsights(filterParams);

  // Unfiltered query to always populate the accounts dropdown
  const allAccountsParams = useMemo(() => ({
    workspaceId: activeWorkspace?.id,
    datePreset: 'maximum',
    accountId: 'all',
  }), [activeWorkspace?.id]);
  const { data: allMetricsForAccounts } = useFacebookMetrics(allAccountsParams);

  // PAYT sales breakdown for the same date range
  const { breakdown: paytBreakdown } = usePaytSalesBreakdown(datePreset);

  const handleSync = async () => {
    if (!connection || selectedAccounts.length === 0) {
      toast.error('Conecte seu Facebook e selecione contas primeiro');
      setShowAccountSelector(true);
      return;
    }
    for (const acctId of selectedAccounts) {
      try {
        await syncMutation.mutateAsync({
          accountId: acctId,
          workspaceId: activeWorkspace?.id,
          accessToken: connection.access_token,
          datePreset,
        });
      } catch (err) {
        console.error(`Sync failed for ${acctId}:`, err);
      }
    }
  };

  // Derive unique accounts from the UNFILTERED metrics (so dropdown always shows all accounts)
  const uniqueAccounts = useMemo(() => {
    const map = new Map<string, string>();
    (allMetricsForAccounts || []).forEach((m: any) => {
      if (m.account_id && !map.has(m.account_id)) {
        map.set(m.account_id, m.account_name || m.account_id);
      }
    });
    return Array.from(map.entries());
  }, [allMetricsForAccounts]);

  // ========= Build table rows =========
  const buildContasRows = (): UtmifyRow[] => {
    const contasMap = new Map<string, UtmifyRow>();
    (metrics || []).forEach((m: any) => {
      const key = m.account_id;
      const existing = contasMap.get(key);
      if (existing) {
        existing.spend += Number(m.spend);
        existing.clicks += Number(m.clicks);
        existing.impressions += Number(m.impressions);
      } else {
        contasMap.set(key, {
          id: key, name: m.account_name || m.account_id,
          spend: Number(m.spend), totalSpend: 0, clicks: Number(m.clicks),
          impressions: Number(m.impressions), cpc: 0, ctr: 0, cpm: 0,
          vendas: 0, faturamento: 0, lucro: 0,
        });
      }
    });
    // Inject total PAYT sales for contas level
    const totalPaytVendas = paytBreakdown.totalVendas;
    const totalPaytFaturamento = paytBreakdown.totalFaturamento;
    const rows = Array.from(contasMap.values());
    const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
    return rows.map(r => {
      // Distribute PAYT sales proportionally by spend share
      const spendShare = totalSpend > 0 ? r.spend / totalSpend : 0;
      const vendas = Math.round(totalPaytVendas * spendShare);
      const faturamento = totalPaytFaturamento * spendShare;
      return {
        ...r, totalSpend: r.spend,
        ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
        cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
        cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
        vendas,
        faturamento,
        lucro: faturamento - r.spend,
      };
    });
  };

  const buildGenericRows = (data: any[], idField: string, nameField: string): UtmifyRow[] => {
    const map = new Map<string, UtmifyRow & { campaign_id?: string }>();
    data.forEach(c => {
      const key = c[idField];
      const existing = map.get(key);
      if (existing) {
        existing.spend += Number(c.spend);
        existing.clicks += Number(c.clicks);
        existing.impressions += Number(c.impressions);
        existing.conversions = (existing.conversions ?? 0) + Number(c.conversions);
        existing.reach = (existing.reach ?? 0) + Number(c.reach);
      } else {
        map.set(key, {
          id: key, name: c[nameField] || 'Sem nome', status: c.status || 'unknown',
          spend: Number(c.spend), clicks: Number(c.clicks), impressions: Number(c.impressions),
          cpc: 0, ctr: 0, cpm: 0, cpa: 0, conversions: Number(c.conversions),
          reach: Number(c.reach), roas: Number(c.roas), vendas: 0,
          faturamento: 0, lucro: 0,
          campaign_id: c.campaign_id,
        });
      }
    });

    // Build per-campaign spend totals for proportional distribution at adset/ad level
    const campaignSpendMap = new Map<string, number>();
    if (idField !== 'campaign_id') {
      Array.from(map.values()).forEach(r => {
        if (r.campaign_id) {
          campaignSpendMap.set(r.campaign_id, (campaignSpendMap.get(r.campaign_id) || 0) + r.spend);
        }
      });
    }

    return Array.from(map.values()).map(r => {
      let vendas = 0;
      let faturamento = 0;

      if (idField === 'campaign_id') {
        // Direct match via utm_id
        const paytMatch = matchSalesToCampaign(r.id, paytBreakdown.byCampaignId);
        vendas = paytMatch.vendas || (r.conversions ?? 0);
        faturamento = paytMatch.faturamento;
      } else {
        // For adsets/ads: distribute parent campaign's PAYT sales proportionally by spend
        const parentMatch = matchSalesViaParentCampaign(r.campaign_id, paytBreakdown.byCampaignId);
        if (parentMatch.vendas > 0 && r.campaign_id) {
          const totalCampaignSpend = campaignSpendMap.get(r.campaign_id) || 1;
          const spendShare = r.spend / totalCampaignSpend;
          vendas = Math.round(parentMatch.vendas * spendShare);
          faturamento = parentMatch.faturamento * spendShare;
        } else {
          vendas = r.conversions ?? 0;
        }
      }

      return {
        ...r,
        ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
        cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
        cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
        cpa: vendas > 0 ? r.spend / vendas : 0,
        vendas,
        faturamento,
        lucro: faturamento - r.spend,
      };
    }).sort((a, b) => b.spend - a.spend);
  };

  const rowsByTab: Record<string, UtmifyRow[]> = {
    contas: buildContasRows(),
    campanhas: buildGenericRows(campaigns || [], 'campaign_id', 'campaign_name'),
    conjuntos: buildGenericRows(adsets || [], 'adset_id', 'adset_name'),
    anuncios: buildGenericRows(ads || [], 'ad_id', 'ad_name'),
  };

  const currentRows = rowsByTab[activeTab] || [];
  const filteredRows = currentRows.filter(r => {
    if (nameFilter && !r.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex h-full">
      <UtmifySidebar activeView={sidebarView} onViewChange={setSidebarView} />

      {sidebarView === 'resumo' ? (
        <ResumoView
          metrics={metrics}
          campaigns={campaigns}
          isLoading={syncMutation.isPending}
          onSync={handleSync}
          isSyncing={syncMutation.isPending}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
        />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Meta Ads</h1>
            <div className="flex items-center gap-3">
              <FacebookLoginButton />
              {connection && (
                <button
                  onClick={() => setShowAccountSelector(!showAccountSelector)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {selectedAccounts.length} conta(s)
                </button>
              )}
            </div>
          </div>

          {showAccountSelector && connection && (
            <div className="px-6 py-3 border-b border-border">
              <AccountSelector connection={connection} onAccountsSelected={() => setShowAccountSelector(false)} />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="bg-transparent p-0 h-auto gap-0 w-full grid grid-cols-4">
                <TabsTrigger value="contas" className="data-[state=active]:bg-card data-[state=active]:border-primary data-[state=active]:text-primary border border-border rounded-none rounded-tl-lg px-6 py-3 text-sm gap-2">
                  <BarChart3 className="h-4 w-4" /> Contas
                </TabsTrigger>
                <TabsTrigger value="campanhas" className="data-[state=active]:bg-card data-[state=active]:border-primary data-[state=active]:text-primary border border-border rounded-none px-6 py-3 text-sm gap-2">
                  <Grid3X3 className="h-4 w-4" /> Campanhas
                </TabsTrigger>
                <TabsTrigger value="conjuntos" className="data-[state=active]:bg-card data-[state=active]:border-primary data-[state=active]:text-primary border border-border rounded-none px-6 py-3 text-sm gap-2">
                  <Layers className="h-4 w-4" /> Conjuntos
                </TabsTrigger>
                <TabsTrigger value="anuncios" className="data-[state=active]:bg-card data-[state=active]:border-primary data-[state=active]:text-primary border border-border rounded-none rounded-tr-lg px-6 py-3 text-sm gap-2">
                  <Image className="h-4 w-4" /> Anúncios
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 space-y-4">
              <UtmifyFilters
                activeTab={activeTab}
                nameFilter={nameFilter}
                onNameFilterChange={setNameFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                datePreset={datePreset}
                onDatePresetChange={setDatePreset}
                accountFilter={accountFilter}
                onAccountFilterChange={setAccountFilter}
                onSync={handleSync}
                isSyncing={syncMutation.isPending}
                totalItems={activeTab !== 'contas' ? filteredRows.length : undefined}
                accounts={uniqueAccounts}
              />

              {['contas', 'campanhas', 'conjuntos', 'anuncios'].map(tab => (
                <TabsContent key={tab} value={tab} className="flex-1 overflow-hidden mt-0">
                  <UtmifyTable rows={filteredRows} activeTab={tab} isLoading={syncMutation.isPending} />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
