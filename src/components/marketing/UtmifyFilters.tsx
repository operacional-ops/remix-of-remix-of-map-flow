import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight, Settings, ArrowUp, Sparkles, ChevronDown } from 'lucide-react';

interface UtmifyFiltersProps {
  activeTab: string;
  nameFilter: string;
  onNameFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  datePreset: string;
  onDatePresetChange: (v: string) => void;
  accountFilter: string;
  onAccountFilterChange: (v: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  totalItems?: number;
  accounts?: [string, string][]; // [[account_id, account_name], ...]
}

export default function UtmifyFilters({
  activeTab,
  nameFilter,
  onNameFilterChange,
  statusFilter,
  onStatusFilterChange,
  datePreset,
  onDatePresetChange,
  accountFilter,
  onAccountFilterChange,
  onSync,
  isSyncing,
  totalItems,
  accounts = [],
}: UtmifyFiltersProps) {
  const labelMap: Record<string, string> = {
    contas: 'Nome da Conta',
    campanhas: 'Nome da Campanha',
    conjuntos: 'Nome do Conjunto',
    anuncios: 'Nome do Anúncio',
  };

  const statusLabelMap: Record<string, string> = {
    contas: 'Status da Conta',
    campanhas: 'Status da Campanha',
    conjuntos: 'Status do Conjunto',
    anuncios: 'Status do Anúncio',
  };

  return (
    <div className="space-y-3">
      {/* Toolbar row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Settings className="h-4 w-4" /></button>
          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ArrowUp className="h-4 w-4" /></button>
          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Sparkles className="h-4 w-4" /></button>
          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ChevronDown className="h-4 w-4" /></button>
          <span className="ml-3 px-3 py-1 bg-emerald-500/20 text-emerald-500 text-xs font-medium rounded-full flex items-center gap-1">
            ✓ Todas as vendas trackeadas
          </span>
        </div>
        <div className="flex items-center gap-3">
          {totalItems !== undefined && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>1-100 de {totalItems}</span>
              <button className="p-1 rounded hover:bg-muted"><ChevronLeft className="h-3.5 w-3.5" /></button>
              <button className="p-1 rounded hover:bg-muted"><ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          )}
          <span className="text-xs text-muted-foreground">Atualizado agora mesmo</span>
          <Button size="sm" onClick={onSync} disabled={isSyncing} className="gap-2 bg-primary hover:bg-primary/90">
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-5 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{labelMap[activeTab]}</label>
          <Input
            placeholder="Filtrar por nome"
            value={nameFilter}
            onChange={e => onNameFilterChange(e.target.value)}
            className="h-9 text-sm bg-card border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{statusLabelMap[activeTab]}</label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-9 text-sm bg-card border-border">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
            Período de Visualização <span className="text-muted-foreground/50">ⓘ</span>
          </label>
          <Select value={datePreset} onValueChange={onDatePresetChange}>
            <SelectTrigger className="h-9 text-sm bg-card border-border">
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
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Conta de Anúncio</label>
          <Select value={accountFilter} onValueChange={onAccountFilterChange}>
            <SelectTrigger className="h-9 text-sm bg-card border-border">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Produto</label>
          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="h-9 text-sm bg-card border-border">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
