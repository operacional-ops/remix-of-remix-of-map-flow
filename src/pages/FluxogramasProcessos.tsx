import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AiChatPanel } from '@/components/drx/AiChatPanel';
import { GitBranch, FileText, Plus, Search, Bot, ChevronRight, ArrowRight, CheckCircle, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ---- Flowcharts Tab ----
function FlowchartsSection() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSteps, setNewSteps] = useState<{ label: string; type: string }[]>([
    { label: '', type: 'step' },
  ]);
  const [metricsInput, setMetricsInput] = useState('');

  const { data: flowcharts = [] } = useQuery({
    queryKey: ['drx-flowcharts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drx_flowcharts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('drx_flowcharts').insert({
        title: newTitle,
        description: newDesc,
        flowchart_data: { steps: newSteps.filter(s => s.label) },
        created_by: 'global_owner',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drx-flowcharts'] });
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
      setNewSteps([{ label: '', type: 'step' }]);
      toast.success('Fluxograma criado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drx_flowcharts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drx-flowcharts'] });
      setSelectedFlow(null);
      toast.success('Fluxograma removido');
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Fluxogramas</h2>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Fluxograma</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Criar Fluxograma</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Título do fluxograma" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <Textarea placeholder="Descrição" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Etapas do fluxo:</p>
                  {newSteps.map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder={`Etapa ${i + 1}`}
                        value={step.label}
                        onChange={e => {
                          const copy = [...newSteps];
                          copy[i].label = e.target.value;
                          setNewSteps(copy);
                        }}
                      />
                      <select
                        className="border rounded px-2 text-sm bg-background"
                        value={step.type}
                        onChange={e => {
                          const copy = [...newSteps];
                          copy[i].type = e.target.value;
                          setNewSteps(copy);
                        }}
                      >
                        <option value="step">Etapa</option>
                        <option value="decision">Decisão</option>
                        <option value="end">Fim</option>
                      </select>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setNewSteps([...newSteps, { label: '', type: 'step' }])}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar etapa
                  </Button>
                </div>
                <Button onClick={() => createMutation.mutate()} disabled={!newTitle || createMutation.isPending} className="w-full">
                  Criar Fluxograma
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedFlow ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedFlow.title}</CardTitle>
                  <CardDescription>{selectedFlow.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFlow(null)}>Voltar</Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedFlow.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(selectedFlow.flowchart_data as any)?.steps?.map((step: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    {step.type === 'decision' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    ) : step.type === 'end' ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                    <div className={`flex-1 p-3 rounded-lg border ${
                      step.type === 'decision' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
                      step.type === 'end' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                      'bg-muted'
                    }`}>
                      <span className="text-sm font-medium">{step.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {step.type === 'decision' ? 'Decisão' : step.type === 'end' ? 'Fim' : 'Etapa'}
                      </Badge>
                    </div>
                    {i < ((selectedFlow.flowchart_data as any)?.steps?.length ?? 0) - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">📊 Preencher Métricas para Análise IA</h3>
                <Textarea
                  placeholder="Cole aqui suas métricas reais (ex: taxa de conversão, tempo médio, volume de leads...)"
                  value={metricsInput}
                  onChange={e => setMetricsInput(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flowcharts.length === 0 ? (
              <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">
                <GitBranch className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>Nenhum fluxograma ainda. Crie o primeiro!</p>
              </CardContent></Card>
            ) : flowcharts.map((f: any) => (
              <Card key={f.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedFlow(f)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription className="text-xs">{f.description || 'Sem descrição'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{(f.flowchart_data as any)?.steps?.length || 0} etapas</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="h-[500px] lg:h-full">
        <AiChatPanel
          contextType="flowchart_analysis"
          contextData={selectedFlow ? { flowchart: selectedFlow, metrics: metricsInput } : undefined}
          title="IA - Análise de Fluxograma"
          placeholder="Selecione um fluxograma e preencha métricas para análise com IA"
        />
      </div>
    </div>
  );
}

// ---- Processes Tab ----
function ProcessesSection() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('geral');
  const [newContent, setNewContent] = useState('');
  const [search, setSearch] = useState('');
  const [chatMode, setChatMode] = useState<'qa' | 'creator'>('qa');

  const { data: processes = [] } = useQuery({
    queryKey: ['drx-processes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drx_processes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('drx_processes').insert({
        title: newTitle,
        category: newCategory,
        content: newContent,
        created_by: 'global_owner',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drx-processes'] });
      setShowCreate(false);
      setNewTitle('');
      setNewContent('');
      toast.success('Processo criado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drx_processes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drx-processes'] });
      setSelectedProcess(null);
      toast.success('Processo removido');
    },
  });

  const filtered = processes.filter((p: any) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(processes.map((p: any) => p.category))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold">Processos & Procedimentos</h2>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Processo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Criar Processo</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Título do processo" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                  <option value="geral">Geral</option>
                  <option value="vendas">Vendas</option>
                  <option value="marketing">Marketing</option>
                  <option value="operacoes">Operações</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="rh">RH</option>
                  <option value="produto">Produto</option>
                </select>
                <Textarea placeholder="Conteúdo do processo (passo a passo, regras, etc.)" value={newContent} onChange={e => setNewContent(e.target.value)} className="min-h-[200px]" />
                <Button onClick={() => createMutation.mutate()} disabled={!newTitle || createMutation.isPending} className="w-full">
                  Criar Processo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar processos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {selectedProcess ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="mb-2">{selectedProcess.category}</Badge>
                  <CardTitle>{selectedProcess.title}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedProcess(null)}>Voltar</Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedProcess.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {selectedProcess.content || 'Sem conteúdo registrado.'}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{cat}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filtered.filter((p: any) => p.category === cat).map((p: any) => (
                    <Card key={p.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedProcess(p)}>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm">{p.title}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>Nenhum processo encontrado.</p>
              </CardContent></Card>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 h-[500px] lg:h-full flex flex-col">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${chatMode === 'qa' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
            onClick={() => setChatMode('qa')}
          >
            <Bot className="h-3 w-3 inline mr-1" /> Tirar Dúvidas
          </button>
          <button
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${chatMode === 'creator' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
            onClick={() => setChatMode('creator')}
          >
            <FileText className="h-3 w-3 inline mr-1" /> Criar Processo
          </button>
        </div>
        <div className="flex-1">
          <AiChatPanel
            key={chatMode}
            contextType={chatMode === 'qa' ? 'process_qa' : 'process_creator'}
            contextData={selectedProcess ? { process: selectedProcess } : { all_processes: processes.map((p: any) => ({ title: p.title, category: p.category })) }}
            title={chatMode === 'qa' ? 'IA - Dúvidas sobre Processos' : 'IA - Criar Procedimento'}
            placeholder={chatMode === 'qa' ? 'Pergunte sobre qualquer processo da empresa...' : 'Descreva o procedimento que deseja criar...'}
          />
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function FluxogramasProcessos() {
  return (
    <div className="p-6 space-y-6 h-full">
      <div>
        <h1 className="text-2xl font-bold">Fluxogramas & Processos</h1>
        <p className="text-muted-foreground text-sm">Gerencie fluxogramas, processos e tire dúvidas com IA</p>
      </div>

      <Tabs defaultValue="flowcharts" className="flex-1">
        <TabsList>
          <TabsTrigger value="flowcharts">
            <GitBranch className="h-4 w-4 mr-1" /> Fluxogramas
          </TabsTrigger>
          <TabsTrigger value="processes">
            <FileText className="h-4 w-4 mr-1" /> Processos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="flowcharts" className="mt-4">
          <FlowchartsSection />
        </TabsContent>
        <TabsContent value="processes" className="mt-4">
          <ProcessesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
