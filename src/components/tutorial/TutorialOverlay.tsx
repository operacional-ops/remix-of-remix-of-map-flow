import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, BookOpen, MousePointer, LogIn, LayoutGrid, Plus, ArrowRight, MessageSquare, HelpCircle, BarChart3, GitBranch, Target, Settings, Briefcase, TrendingUp, Layers, Send, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
}

// ─── ADMIN TUTORIAL: DRX Operações completo ───
const ADMIN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '🏢 Passo 1: Selecione seu Workspace',
    description: 'Antes de tudo, selecione um Workspace na barra lateral. Cada workspace representa uma operação diferente (ex: LITHIUM, PRODUTO X).\n\nVocê pode ter várias operações rodando ao mesmo tempo — basta criar um novo workspace para cada uma. Todos os dados (métricas, analytics, decisões) ficam isolados por workspace.',
    icon: <Briefcase className="h-10 w-10 text-primary" />,
    route: '/workspaces',
  },
  {
    title: '📺 Passo 2: Painel DRX (Kanban)',
    description: 'Acesse "Painel DRX" na barra lateral. Faça login com:\n\n• Login: seu nome + "adm" (ex: ailtonadm)\n• Senha: DRX2026@\n\nVocê verá o Kanban com 3 colunas (A Fazer, Fazendo, Feito). Crie tarefas com "+", mova com as setas ◀ ▶ e use o Inbox para comunicação.',
    icon: <LayoutGrid className="h-10 w-10 text-blue-500" />,
    route: '/painel-drx',
  },
  {
    title: '📊 Passo 3: Dashboard Operação',
    description: 'Vá em "DRX Operações" → "Dashboard Operação". Aqui você monitora em tempo real:\n\n• ROAS da operação\n• Lucro bruto\n• Volume de vendas\n• Gastos com tráfego\n\nOs gráficos mostram Receita vs Gastos e a evolução do ROAS ao longo do tempo.',
    icon: <BarChart3 className="h-10 w-10 text-emerald-500" />,
    route: '/dashboard-operacao',
  },
  {
    title: '📈 Passo 4: DRX Analytics',
    description: 'Em "DRX Operações" → "Analytics", você encontra a análise avançada de marketing:\n\n• Cards de KPI (Receita, Gastos, Lucro, ROAS, Vendas)\n• Funil de Vendas: Impressões → Cliques → Checkout → Compras\n• Unit Economics: CPA, Ticket Médio e Margem de Contribuição\n• Mapa de Calor: horários de pico para otimizar orçamento',
    icon: <TrendingUp className="h-10 w-10 text-violet-500" />,
    route: '/drx-analytics',
  },
  {
    title: '🗂️ Passo 5: Controle Operacional',
    description: 'No Dashboard Operação, gerencie seus bancos de dados por produto. Você pode:\n\n• Cadastrar produtos (ex: LITHIUM)\n• Importar métricas via CSV (substitui o Airtable)\n• Visualizar a tabela de alta densidade com todas as métricas\n• Excluir produtos e métricas em cascata',
    icon: <Layers className="h-10 w-10 text-orange-500" />,
    route: '/dashboard-operacao',
  },
  {
    title: '📨 Passo 6: Chamados',
    description: 'Em "DRX Operações" → "Chamados", você pode enviar chamados para a equipe e a diretoria. Funciona como um canal de comunicação interna para solicitar suporte, reportar problemas e acompanhar resoluções.',
    icon: <Send className="h-10 w-10 text-cyan-500" />,
    route: '/chamados',
  },
  {
    title: '🔀 Passo 7: Fluxogramas de Processos',
    description: 'Em "DRX Operações" → "Fluxogramas", crie e visualize fluxogramas da operação:\n\n• Documente cada etapa do processo (POPs)\n• Adicione métricas aos nós do fluxograma\n• Use o chatbot de IA integrado para consultar processos\n• Identifique gargalos e otimize o fluxo operacional',
    icon: <GitBranch className="h-10 w-10 text-pink-500" />,
    route: '/fluxogramas',
  },
  {
    title: '🎯 Passo 8: Matriz de Decisões',
    description: 'Em "Matriz Decisões", a IA atua como consultora estratégica usando seus dados reais:\n\n• Análise de Funil: otimize conversões\n• Delegação: priorize tarefas com Eisenhower\n• Alertas automáticos: ROAS < 1.5 ou CPA alto\n\nPor workspace — cada operação tem sua própria análise. Crie workspaces separados para analisar cada produto.',
    icon: <Brain className="h-10 w-10 text-yellow-500" />,
    route: '/matriz-decisoes',
  },
  {
    title: '⚙️ Passo 9: Configurações',
    description: 'Em "Configurações", gerencie:\n\n• Usuários e permissões\n• Status personalizados e templates\n• Tags do workspace\n• APIs e Webhooks\n• Templates de espaço e automações',
    icon: <Settings className="h-10 w-10 text-muted-foreground" />,
    route: '/settings',
  },
  {
    title: '✅ Tutorial Concluído!',
    description: 'Agora você domina o DRX Central! Dicas finais:\n\n• Selecione o workspace antes de ver dados\n• Cada workspace = uma operação independente\n• A Matriz de Decisões usa dados reais do workspace ativo\n• Use Fluxogramas + Chamados para organizar processos\n\nVocê pode refazer o tutorial pelo botão "Tutorial" na barra lateral.',
    icon: <span className="text-4xl">🎉</span>,
  },
];

// ─── OPERATOR TUTORIAL: Painel DRX + Kanban ───
const OPERATOR_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Bem-vindo ao DRX Central! 👋',
    description: 'Este tutorial vai te guiar pelas funcionalidades que você tem acesso. Siga os passos para aprender a navegar pelo sistema e usar o Painel DRX como um profissional.',
    icon: <BookOpen className="h-10 w-10 text-primary" />,
  },
  {
    title: 'Passo 1: A Barra Lateral',
    description: 'No lado esquerdo você encontra a barra lateral de navegação. Ela contém todos os módulos que você pode acessar: Início, Chat, Equipes, Documentos e os módulos DRX.',
    icon: <LayoutGrid className="h-10 w-10 text-blue-500" />,
  },
  {
    title: 'Passo 2: Acesse o Painel DRX',
    description: 'Na seção "DRX Operações" da barra lateral, clique em "Chamados" para enviar mensagens à diretoria. Para acessar o quadro de tarefas completo, vá ao menu "Painel DRX" (se disponível para seu perfil).',
    icon: <MousePointer className="h-10 w-10 text-green-500" />,
    route: '/chamados',
  },
  {
    title: 'Passo 3: Login no Painel DRX',
    description: 'Ao entrar no Painel DRX, você verá a tela de login. Escolha seu perfil na lista de membros. No campo "Login", digite seu nome + "adm" (exemplo: gabrieladm). No campo "Senha", digite: DRX2026@',
    icon: <LogIn className="h-10 w-10 text-yellow-500" />,
  },
  {
    title: 'Passo 4: O Kanban - Seu Quadro de Tarefas',
    description: 'Após fazer login, você verá o Kanban — um quadro dividido em 3 colunas:\n\n• A FAZER → Tarefas pendentes\n• FAZENDO → Tarefas em andamento\n• FEITO → Tarefas concluídas\n\nAs tarefas fluem da esquerda para a direita conforme você progride.',
    icon: <LayoutGrid className="h-10 w-10 text-purple-500" />,
  },
  {
    title: 'Passo 5: Criar uma Nova Tarefa',
    description: 'Na coluna "A FAZER", clique no botão "+ Adicionar Tarefa". Preencha o título, a descrição detalhada e um link (se necessário). Clique em "Salvar" para criar a tarefa no quadro.',
    icon: <Plus className="h-10 w-10 text-emerald-500" />,
  },
  {
    title: 'Passo 6: Mover Tarefas',
    description: 'Para mover uma tarefa entre colunas, use as setas (◀ ▶) que aparecem ao passar o mouse sobre a tarefa. Seta para a direita avança o status, seta para a esquerda volta.',
    icon: <ArrowRight className="h-10 w-10 text-orange-500" />,
  },
  {
    title: 'Passo 7: Inbox - Enviar Mensagens',
    description: 'Na aba "Inbox" dentro do Painel DRX, você pode enviar mensagens para a diretoria. Digite sua mensagem e envie. A diretoria responderá diretamente no sistema, e você verá a resposta quando voltar.',
    icon: <MessageSquare className="h-10 w-10 text-cyan-500" />,
  },
  {
    title: 'Passo 8: Matriz de Decisões',
    description: 'Na barra lateral, acesse "Matriz Decisões" para consultar a IA sobre dúvidas processuais, estratégias e aprender sobre os processos da operação. Use para aprimorar seus conhecimentos e reduzir erros.',
    icon: <HelpCircle className="h-10 w-10 text-pink-500" />,
    route: '/matriz-decisoes',
  },
  {
    title: '✅ Tutorial Concluído!',
    description: 'Agora você sabe navegar pelo DRX Central! Lembre-se:\n\n• Login do Painel: seu nome + "adm"\n• Senha: DRX2026@\n• Use o Kanban para gerenciar tarefas\n• Consulte a Matriz de Decisões para dúvidas\n\nO tutorial aparecerá novamente no próximo login para sua conveniência.',
    icon: <span className="text-4xl">🎉</span>,
  },
];

const ADMIN_STORAGE_KEY = 'drx_admin_tutorial_completed';

export function TutorialOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();

  const isLimitedMember = userRole?.isLimitedMember ?? false;
  const steps = isLimitedMember ? OPERATOR_TUTORIAL_STEPS : ADMIN_TUTORIAL_STEPS;

  // Operator: ALWAYS show ask dialog on mount (no localStorage)
  // Admin: show once, then persist
  useEffect(() => {
    if (userRole === undefined) return;

    if (isLimitedMember) {
      // Always show for operators (9 users share this login)
      setShowAskDialog(true);
    } else {
      const completed = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!completed) {
        setShowAskDialog(true);
      }
    }
  }, [userRole, isLimitedMember]);

  // Listen for manual re-open
  useEffect(() => {
    const handler = () => {
      setCurrentStep(0);
      setShowAskDialog(true);
    };
    window.addEventListener('drx-open-tutorial', handler);
    return () => window.removeEventListener('drx-open-tutorial', handler);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setShowAskDialog(false);
    if (!isLimitedMember) {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    }
  };

  const handleStartTutorial = () => {
    setShowAskDialog(false);
    setCurrentStep(0);
    setIsOpen(true);
  };

  const handleSkipTutorial = () => {
    setShowAskDialog(false);
    if (!isLimitedMember) {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGoToRoute = () => {
    const step = steps[currentStep];
    if (step.route) {
      navigate(step.route);
    }
  };

  // Ask dialog (both roles)
  if (showAskDialog) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {isLimitedMember ? 'Olá! Bem-vindo ao DRX Central 👋' : 'Tutorial DRX Operações 🚀'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {isLimitedMember
                ? 'Deseja fazer um tutorial rápido para aprender a usar o sistema?'
                : 'Quer aprender a usar todos os módulos de operação? Workspaces, Analytics, Fluxogramas, Matriz de Decisões e mais.'
              }
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleStartTutorial} className="w-full gap-2 h-12 text-base">
                <BookOpen className="h-5 w-5" />
                {isLimitedMember ? 'Sim, quero aprender!' : 'Iniciar Tutorial'}
              </Button>
              <Button variant="ghost" onClick={handleSkipTutorial} className="w-full text-muted-foreground">
                {isLimitedMember ? 'Não, já sei usar' : 'Pular por agora'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              {isLimitedMember ? 'Tutorial do Operador' : 'Tutorial DRX Operações'}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0">{step.icon}</div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{step.description}</p>
            </div>
          </div>

          {step.route && (
            <Button variant="outline" size="sm" onClick={handleGoToRoute} className="mb-2 gap-1">
              Ir para esta página <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground font-medium">
            {currentStep + 1} de {steps.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1"
            >
              {isLast ? '✅ Concluir' : 'Avançar'} {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-4">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TutorialTrigger() {
  const handleOpen = () => {
    window.dispatchEvent(new Event('drx-open-tutorial'));
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleOpen} className="gap-1.5 text-xs">
      <BookOpen className="h-3.5 w-3.5" /> Tutorial
    </Button>
  );
}
