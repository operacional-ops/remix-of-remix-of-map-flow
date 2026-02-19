import { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import KpiGrid from '@/components/intelligence/KpiGrid';
import InvestmentReturnChart from '@/components/intelligence/InvestmentReturnChart';
import CampaignTable from '@/components/intelligence/CampaignTable';
import FacebookLoginButton from '@/components/marketing/FacebookLoginButton';
import { useFacebookConnection } from '@/hooks/useFacebookConnections';
import { useSyncFacebookMetrics } from '@/hooks/useFacebookMetrics';
import AccountSelector from '@/components/marketing/AccountSelector';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <Skeleton className="h-[300px] rounded-lg" />
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  );
}

export default function DashboardOperacao() {
  const { activeWorkspace } = useWorkspace();
  const [datePreset, setDatePreset] = useState('last_30d');
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const { data: fbConnection } = useFacebookConnection(activeWorkspace?.id);
  const syncMutation = useSyncFacebookMetrics();
  const queryClient = useQueryClient();
  const connection = fbConnection || null;
  const selectedAccounts = connection?.selected_account_ids || [];

  const { data, isLoading, error, refetch } = useDashboardData(activeWorkspace?.id, datePreset);

  const handleSync = async () => {
    if (!connection || selectedAccounts.length === 0) {
      toast.error('Conecte seu Facebook e selecione contas primeiro');
      setShowAccountSelector(true);
      return;
    }
    const results = await Promise.allSettled(
      selectedAccounts.map(acctId =>
        syncMutation.mutateAsync({
          accountId: acctId,
          workspaceId: activeWorkspace?.id,
          accessToken: connection.access_token,
          datePreset,
          skipInvalidation: true,
        })
      )
    );
    queryClient.invalidateQueries({ queryKey: ['facebook_metrics'] });
    queryClient.invalidateQueries({ queryKey: ['facebook_campaign_insights'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });

    const failed = results.filter(r => r.status === 'rejected');
    const succeeded = results.filter(r => r.status === 'fulfilled');
    if (failed.length > 0) toast.error(`${failed.length} conta(s) falharam`);
    if (succeeded.length > 0) toast.success(`${succeeded.length} conta(s) sincronizada(s)!`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">DRX Intelligence</h1>
          <p className="text-[11px] text-muted-foreground">Meta Ads + PayT · Dashboard Unificado</p>
        </div>
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

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-4">
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Período</label>
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="h-8 text-xs bg-card border-border w-[160px]">
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
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={handleSync} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar Meta
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {(error as any)?.type === 'DENIED' ? 'Acesso negado' : 'Erro ao carregar dados'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {(error as any)?.type === 'DENIED'
                ? 'Você não tem permissão para acessar este workspace.'
                : (error as any)?.message || 'Erro desconhecido'}
            </p>
            <Button size="sm" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <p className="text-sm">Sem dados para a data selecionada</p>
            <p className="text-xs">Sincronize os dados do Meta Ads e conecte o PayT.</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <KpiGrid kpis={data.kpis} />
            <InvestmentReturnChart campaigns={data.campaigns} />
            <CampaignTable campaigns={data.campaigns} />
            <p className="text-[10px] text-muted-foreground text-right">
              Gerado em: {new Date(data.generated_at).toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
