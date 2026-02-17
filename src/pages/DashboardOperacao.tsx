import { useState } from 'react';
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

export default function DashboardOperacao() {
  const { activeWorkspace } = useWorkspace();
  const { data: fbConnection } = useFacebookConnection(activeWorkspace?.id);
  const { data: metrics, isLoading: loadingMetrics } = useFacebookMetrics(activeWorkspace?.id);
  const { data: campaigns, isLoading: loadingCampaigns } = useFacebookCampaignInsights(activeWorkspace?.id);
  const { data: adsets, isLoading: loadingAdsets } = useFacebookAdsetInsights(activeWorkspace?.id);
  const { data: ads, isLoading: loadingAds } = useFacebookAdInsights(activeWorkspace?.id);
  const syncMutation = useSyncFacebookMetrics();

  const [sidebarView, setSidebarView] = useState<'resumo' | 'meta'>('resumo');
  const [activeTab, setActiveTab] = useState('contas');
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('last_28d');
  const [accountFilter, setAccountFilter] = useState('all');
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const connection = fbConnection || null;
  const selectedAccounts = connection?.selected_account_ids || [];

  const handleSync = async () => {
    if (!connection || selectedAccounts.length === 0) {
      toast.error('Conecte seu Facebook e selecione contas primeiro');
      setShowAccountSelector(true);
      return;
    }
    // Sync accounts sequentially to avoid Meta API rate limits
    for (const accountId of selectedAccounts) {
      try {
        await syncMutation.mutateAsync({
          accountId,
          workspaceId: activeWorkspace?.id,
          accessToken: connection.access_token,
          datePreset,
        });
      } catch (err) {
        // Error toast already handled by mutation onError, continue with next account
        console.error(`Sync failed for ${accountId}:`, err);
      }
    }
  };

  const isLoading = loadingMetrics || loadingCampaigns || loadingAdsets || loadingAds;

  // ========= Build table rows for each tab =========
  const buildContasRows = (): UtmifyRow[] => {
    const contasMap = new Map<string, UtmifyRow>();
    metrics?.forEach(m => {
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
    return Array.from(contasMap.values()).map(r => ({
      ...r, totalSpend: r.spend,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
      cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
    }));
  };

  const buildCampaignRows = (): UtmifyRow[] => {
    const map = new Map<string, UtmifyRow>();
    campaigns?.forEach(c => {
      const key = c.campaign_id;
      const existing = map.get(key);
      if (existing) {
        existing.spend += Number(c.spend); existing.clicks += Number(c.clicks);
        existing.impressions += Number(c.impressions);
        existing.conversions = (existing.conversions ?? 0) + Number(c.conversions);
        existing.reach = (existing.reach ?? 0) + Number(c.reach);
      } else {
        map.set(key, {
          id: key, name: c.campaign_name || 'Sem nome', status: c.status || 'unknown',
          spend: Number(c.spend), clicks: Number(c.clicks), impressions: Number(c.impressions),
          cpc: 0, ctr: 0, cpm: 0, cpa: 0, conversions: Number(c.conversions),
          reach: Number(c.reach), roas: Number(c.roas), vendas: Number(c.conversions),
          faturamento: 0, lucro: 0,
        });
      }
    });
    return Array.from(map.values()).map(r => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
      cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
      cpa: (r.conversions ?? 0) > 0 ? r.spend / (r.conversions ?? 1) : 0,
      vendas: r.conversions ?? 0,
    })).sort((a, b) => b.spend - a.spend);
  };

  const buildAdsetRows = (): UtmifyRow[] => {
    const map = new Map<string, UtmifyRow>();
    adsets?.forEach((c: any) => {
      const key = c.adset_id;
      const existing = map.get(key);
      if (existing) {
        existing.spend += Number(c.spend); existing.clicks += Number(c.clicks);
        existing.impressions += Number(c.impressions);
        existing.conversions = (existing.conversions ?? 0) + Number(c.conversions);
        existing.reach = (existing.reach ?? 0) + Number(c.reach);
      } else {
        map.set(key, {
          id: key, name: c.adset_name || 'Sem nome', status: c.status || 'unknown',
          spend: Number(c.spend), clicks: Number(c.clicks), impressions: Number(c.impressions),
          cpc: 0, ctr: 0, cpm: 0, cpa: 0, conversions: Number(c.conversions),
          reach: Number(c.reach), roas: Number(c.roas), vendas: Number(c.conversions),
          faturamento: 0, lucro: 0,
        });
      }
    });
    return Array.from(map.values()).map(r => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
      cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
      cpa: (r.conversions ?? 0) > 0 ? r.spend / (r.conversions ?? 1) : 0,
      vendas: r.conversions ?? 0,
    })).sort((a, b) => b.spend - a.spend);
  };

  const buildAdRows = (): UtmifyRow[] => {
    const map = new Map<string, UtmifyRow>();
    ads?.forEach((c: any) => {
      const key = c.ad_id;
      const existing = map.get(key);
      if (existing) {
        existing.spend += Number(c.spend); existing.clicks += Number(c.clicks);
        existing.impressions += Number(c.impressions);
        existing.conversions = (existing.conversions ?? 0) + Number(c.conversions);
        existing.reach = (existing.reach ?? 0) + Number(c.reach);
      } else {
        map.set(key, {
          id: key, name: c.ad_name || 'Sem nome', status: c.status || 'unknown',
          spend: Number(c.spend), clicks: Number(c.clicks), impressions: Number(c.impressions),
          cpc: 0, ctr: 0, cpm: 0, cpa: 0, conversions: Number(c.conversions),
          reach: Number(c.reach), roas: Number(c.roas), vendas: Number(c.conversions),
          faturamento: 0, lucro: 0,
        });
      }
    });
    return Array.from(map.values()).map(r => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
      cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
      cpa: (r.conversions ?? 0) > 0 ? r.spend / (r.conversions ?? 1) : 0,
      vendas: r.conversions ?? 0,
    })).sort((a, b) => b.spend - a.spend);
  };

  const rowsByTab: Record<string, UtmifyRow[]> = {
    contas: buildContasRows(),
    campanhas: buildCampaignRows(),
    conjuntos: buildAdsetRows(),
    anuncios: buildAdRows(),
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
          isLoading={isLoading}
          onSync={handleSync}
          isSyncing={syncMutation.isPending}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
        />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Top header */}
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

          {/* Tabs */}
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
              />

              {['contas', 'campanhas', 'conjuntos', 'anuncios'].map(tab => (
                <TabsContent key={tab} value={tab} className="flex-1 overflow-hidden mt-0">
                  <UtmifyTable rows={filteredRows} activeTab={tab} isLoading={isLoading} />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
