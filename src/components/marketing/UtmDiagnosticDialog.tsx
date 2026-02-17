import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PaytTransaction } from '@/hooks/usePaytTransactions';

interface UtmDiagnosticDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: PaytTransaction[];
}

interface DiagnosticResult {
  name: string;
  campaign: string | null;
  utmId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  status: 'ok' | 'warning' | 'error';
  issues: string[];
}

function analyzeTransactions(transactions: PaytTransaction[]): DiagnosticResult[] {
  return transactions.slice(0, 100).map(t => {
    const payload = t.raw_payload as any;
    const qp = payload?.link?.query_params || {};
    const sources = payload?.link?.sources || {};
    
    const utmId = qp.utm_id || null;
    const utmSource = qp.utm_source || sources.utm_source || null;
    const utmCampaign = qp.utm_campaign || sources.utm_campaign || null;
    const utmMedium = qp.utm_medium || sources.utm_medium || null;

    const issues: string[] = [];
    if (!utmId) issues.push('utm_id ausente');
    if (!utmSource) issues.push('utm_source ausente');
    if (!utmCampaign) issues.push('utm_campaign ausente');
    if (!utmMedium) issues.push('utm_medium ausente');

    const status = issues.length === 0 ? 'ok' : issues.length <= 1 ? 'warning' : 'error';

    return {
      name: t.customer_name || t.transaction_id,
      campaign: utmCampaign,
      utmId,
      utmSource,
      utmMedium,
      status,
      issues,
    };
  });
}

export default function UtmDiagnosticDialog({ open, onOpenChange, transactions }: UtmDiagnosticDialogProps) {
  const results = analyzeTransactions(transactions);
  const okCount = results.filter(r => r.status === 'ok').length;
  const warnCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Diagnóstico UTM
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-xs text-muted-foreground">
          Analise suas transações recentes e identifique quais não possuem configuração correta de parâmetros UTM.
        </p>

        <div className="grid grid-cols-3 gap-3 my-3">
          <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-lg font-bold text-emerald-500">{okCount}</p>
              <p className="text-[10px] text-muted-foreground">Corretos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-lg font-bold text-yellow-500">{warnCount}</p>
              <p className="text-[10px] text-muted-foreground">Avisos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20">
            <XCircle className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-lg font-bold text-red-500">{errorCount}</p>
              <p className="text-[10px] text-muted-foreground">Sem UTM</p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-1.5">
            {results.map((r, i) => (
              <div key={i} className={`flex items-start gap-2 p-2 rounded text-xs border ${
                r.status === 'ok' ? 'border-emerald-500/20 bg-emerald-500/5' :
                r.status === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5' :
                'border-red-500/20 bg-red-500/5'
              }`}>
                {r.status === 'ok' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" /> :
                 r.status === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" /> :
                 <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.name}</p>
                  {r.campaign && <p className="text-muted-foreground truncate">{r.campaign}</p>}
                  {r.issues.length > 0 && (
                    <p className="text-red-400 mt-0.5">{r.issues.join(' · ')}</p>
                  )}
                </div>
              </div>
            ))}
            {results.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma transação para diagnosticar.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
