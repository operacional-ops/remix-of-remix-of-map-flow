import { useState, useEffect } from 'react';
import { Check, Building2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { FacebookConnection, useUpdateSelectedAccounts } from '@/hooks/useFacebookConnections';

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  business_name?: string;
}

const STATUS_MAP: Record<number, string> = {
  1: 'Ativo',
  2: 'Desativado',
  3: 'Não Publicado',
  7: 'Pendente Revisão',
  8: 'Pendente Fechamento',
  9: 'Em Período de Carência',
  100: 'Fechamento Pendente',
  101: 'Fechado',
  201: 'Qualquer Ativo',
  202: 'Qualquer Fechado',
};

interface AccountSelectorProps {
  connection: FacebookConnection;
  onAccountsSelected?: (accountIds: string[]) => void;
}

export default function AccountSelector({ connection, onAccountsSelected }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(connection.selected_account_ids || []));
  const updateAccounts = useUpdateSelectedAccounts();

  const fetchAccounts = async () => {
    if (!connection.access_token) return;
    setLoading(true);
    try {
      const resp = await fetch(
        `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id,account_status,currency,business_name&access_token=${connection.access_token}&limit=100`
      );
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      setAccounts(data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao buscar contas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [connection.access_token]);

  const toggleAccount = (accountId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };

  const handleSave = () => {
    const ids = Array.from(selected);
    updateAccounts.mutate(
      { connectionId: connection.id, accountIds: ids },
      {
        onSuccess: () => {
          toast.success(`${ids.length} conta(s) selecionada(s)`);
          onAccountsSelected?.(ids);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            Contas de Anúncio
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAccounts} disabled={loading} className="gap-1.5 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateAccounts.isPending || selected.size === 0} className="gap-1.5 text-xs">
              <Check className="h-3.5 w-3.5" />
              Salvar ({selected.size})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Buscando contas...
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma conta de anúncio encontrada neste perfil.
          </p>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {accounts.map(acc => (
                <label
                  key={acc.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected.has(acc.id) ? 'border-blue-500/50 bg-blue-500/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={selected.has(acc.id)}
                    onCheckedChange={() => toggleAccount(acc.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {acc.account_id} · {acc.currency} · {STATUS_MAP[acc.account_status] || 'Desconhecido'}
                    </p>
                    {acc.business_name && (
                      <p className="text-xs text-muted-foreground">Business: {acc.business_name}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
