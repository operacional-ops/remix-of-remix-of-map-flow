import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AiChatPanel } from '@/components/drx/AiChatPanel';
import { Target, Users, CalendarCheck, Plus, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type DecisionType = 'funnel_optimization' | 'delegation' | 'daily_priorities';

function useDecisions(type: DecisionType) {
  return useQuery({
    queryKey: ['drx-decisions', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drx_decision_logs')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ---- Generic Decision Section ----
function DecisionSection({
  type,
  icon: Icon,
  title,
  description,
  contextFields,
  aiContextType,
  aiPlaceholder,
}: {
  type: DecisionType;
  icon: any;
  title: string;
  description: string;
  contextFields: { key: string; label: string; placeholder: string; multiline?: boolean }[];
  aiContextType: string;
  aiPlaceholder: string;
}) {
  const queryClient = useQueryClient();
  const { data: decisions = [] } = useDecisions(type);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [newTitle, setNewTitle] = useState('');
  const [resultInput, setResultInput] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('drx_decision_logs').insert({
        type,
        title: newTitle,
        context: JSON.stringify(formData),
        options: [],
        decided_by: 'global_owner',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drx-decisions', type] });
      setShowCreate(false);
      setNewTitle('');
      setFormData({});
      toast.success('Decisão registrada!');
    },
  });

  const updateResult = useMutation({
    mutationFn: async ({ id, result }: { id: string; result: string }) => {
      const { error } = await supabase.from('drx_decision_logs').update({ result }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drx-decisions', type] });
      toast.success('Resultado registrado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drx_decision_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drx-decisions', type] });
      setSelectedDecision(null);
      toast.success('Decisão removida');
    },
  });

  const parseContext = (ctx: string) => {
    try { return JSON.parse(ctx); } catch { return {}; }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" /> {title}
            </h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Decisão</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Registrar Decisão - {title}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Título da decisão" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                {contextFields.map(field => (
                  <div key={field.key}>
                    <label className="text-sm font-medium">{field.label}</label>
                    {field.multiline ? (
                      <Textarea
                        placeholder={field.placeholder}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="min-h-[80px]"
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
                <Button onClick={() => createMutation.mutate()} disabled={!newTitle || createMutation.isPending} className="w-full">
                  Registrar Decisão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedDecision ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedDecision.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(selectedDecision.created_at).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDecision(null)}>Voltar</Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedDecision.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">📋 Contexto</h4>
                <div className="space-y-2">
                  {Object.entries(parseContext(selectedDecision.context)).map(([k, v]) => (
                    <div key={k} className="bg-muted rounded p-2">
                      <span className="text-xs font-medium text-muted-foreground capitalize">{k.replace(/_/g, ' ')}:</span>
                      <p className="text-sm">{v as string}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDecision.decision && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">✅ Decisão Tomada</h4>
                  <p className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded">{selectedDecision.decision}</p>
                </div>
              )}

              {selectedDecision.ai_analysis && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">🤖 Análise IA</h4>
                  <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-2 rounded whitespace-pre-wrap">{selectedDecision.ai_analysis}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-1">📊 Resultado</h4>
                {selectedDecision.result ? (
                  <p className="text-sm bg-muted p-2 rounded">{selectedDecision.result}</p>
                ) : (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Registre o resultado desta decisão..."
                      value={resultInput}
                      onChange={e => setResultInput(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => updateResult.mutate({ id: selectedDecision.id, result: resultInput })}
                      disabled={!resultInput}
                    >
                      Salvar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {decisions.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Icon className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>Nenhuma decisão registrada ainda.</p>
              </CardContent></Card>
            ) : decisions.map((d: any) => (
              <Card key={d.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedDecision(d)}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{d.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {d.result ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" /> Com resultado
                        </Badge>
                      ) : d.decision ? (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" /> Aguardando resultado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1" /> Pendente
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="h-[500px] lg:h-[600px]">
        <AiChatPanel
          contextType={aiContextType}
          contextData={selectedDecision ? { decision: selectedDecision, context: parseContext(selectedDecision.context) } : { all_decisions: decisions.slice(0, 10) }}
          title={`IA - ${title}`}
          placeholder={aiPlaceholder}
        />
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function MatrizDecisoes() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Matriz de Decisões</h1>
        <p className="text-muted-foreground text-sm">Tome decisões estratégicas com assistência de IA integrada</p>
      </div>

      <Tabs defaultValue="funnel" className="flex-1">
        <TabsList>
          <TabsTrigger value="funnel">
            <Target className="h-4 w-4 mr-1" /> Otimização de Funil
          </TabsTrigger>
          <TabsTrigger value="delegation">
            <Users className="h-4 w-4 mr-1" /> Delegação
          </TabsTrigger>
          <TabsTrigger value="priorities">
            <CalendarCheck className="h-4 w-4 mr-1" /> Prioridades do Dia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="mt-4">
          <DecisionSection
            type="funnel_optimization"
            icon={Target}
            title="Otimização de Funil"
            description="Qual parte do funil otimizar? Analise dados e decida com IA."
            contextFields={[
              { key: 'funnel_stage', label: 'Etapa do Funil', placeholder: 'Ex: Topo, Meio, Fundo' },
              { key: 'current_metrics', label: 'Métricas Atuais', placeholder: 'Ex: Taxa de conversão 2.5%, CPL R$15', multiline: true },
              { key: 'goal', label: 'Objetivo', placeholder: 'Ex: Aumentar conversão para 4%' },
              { key: 'context', label: 'Contexto Adicional', placeholder: 'Informações relevantes sobre o cenário atual', multiline: true },
            ]}
            aiContextType="funnel_optimization"
            aiPlaceholder="Descreva seu funil e métricas. A IA vai analisar e sugerir otimizações."
          />
        </TabsContent>

        <TabsContent value="delegation" className="mt-4">
          <DecisionSection
            type="delegation"
            icon={Users}
            title="Delegação de Funções"
            description="Qual função você pode delegar? O consultor IA vai provocar você."
            contextFields={[
              { key: 'function_name', label: 'Função a Delegar', placeholder: 'Ex: Gestão de tráfego pago' },
              { key: 'time_spent', label: 'Tempo Gasto (horas/semana)', placeholder: 'Ex: 10h' },
              { key: 'strategic_impact', label: 'Impacto Estratégico', placeholder: 'Alto / Médio / Baixo' },
              { key: 'can_be_taught', label: 'Pode ser Ensinado?', placeholder: 'Sim / Não / Parcialmente' },
              { key: 'risk', label: 'Risco de Delegar', placeholder: 'Descreva os riscos percebidos', multiline: true },
            ]}
            aiContextType="delegation"
            aiPlaceholder="Descreva a função. A IA vai questionar se você realmente precisa fazer isso."
          />
        </TabsContent>

        <TabsContent value="priorities" className="mt-4">
          <DecisionSection
            type="daily_priorities"
            icon={CalendarCheck}
            title="Prioridades do Dia"
            description="Organize suas prioridades diárias com ajuda de IA conselheira."
            contextFields={[
              { key: 'pending_tasks', label: 'Tarefas Pendentes', placeholder: 'Liste as tarefas pendentes de ontem', multiline: true },
              { key: 'ongoing_tasks', label: 'Tarefas em Andamento', placeholder: 'O que está sendo executado agora?', multiline: true },
              { key: 'running_products', label: 'Produtos Rodando', placeholder: 'Quais produtos/campanhas estão ativos?', multiline: true },
              { key: 'revenue_context', label: 'Contexto de Receita', placeholder: 'Lucro por produto, faturamento, etc.', multiline: true },
              { key: 'team_status', label: 'Status da Equipe', placeholder: 'Quem está disponível? Algum bloqueio?', multiline: true },
            ]}
            aiContextType="daily_priorities"
            aiPlaceholder="Dê contexto da operação. A IA vai ajudar a priorizar usando a Matriz de Eisenhower."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
