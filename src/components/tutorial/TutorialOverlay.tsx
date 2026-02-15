import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, BookOpen, MousePointer, LogIn, LayoutGrid, Plus, ArrowRight, MessageSquare, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
  highlight?: string;
}

const ADMIN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '1. Selecione um Workspace',
    description: 'Ao acessar o sistema, selecione ou crie um Workspace na barra lateral. O Workspace representa a operação que você deseja gerenciar. Todos os dados ficam isolados por workspace.',
    icon: <span className="text-4xl">🏢</span>,
    route: '/workspaces',
  },
  {
    title: '2. Navegue pelos Módulos',
    description: 'Use a barra lateral para acessar Chat, Equipes, Documentos, Painéis e Automações. O item "Tudo" mostra todas as tarefas de todos os espaços.',
    icon: <span className="text-4xl">📋</span>,
    route: '/',
  },
  {
    title: '3. Painel DRX (Legado)',
    description: 'O Painel DRX integra o sistema legado com Kanban e gestão de membros. Faça login com seu nome + "adm" (ex: ailtonadm) e a senha universal DRX2026@.',
    icon: <span className="text-4xl">📺</span>,
    route: '/painel-drx',
  },
  {
    title: '4. Dashboard Operação',
    description: 'Visualize KPIs da operação: ROAS, Lucro, Vendas e Gastos em tempo real. Acompanhe gráficos de Receita vs Gastos e evolução do ROAS.',
    icon: <span className="text-4xl">📊</span>,
    route: '/dashboard-operacao',
  },
  {
    title: '5. DRX Analytics',
    description: 'Análise avançada de marketing: cards de KPI, ROI por fonte de tráfego e Deep Dive com Funil de Vendas, Unit Economics e Mapa de Calor.',
    icon: <span className="text-4xl">📈</span>,
    route: '/drx-analytics',
  },
  {
    title: '6. Fluxogramas de Processos',
    description: 'Crie e visualize fluxogramas da operação, documente processos e POPs. Use o chatbot de IA para consultar e criar novos processos.',
    icon: <span className="text-4xl">🔀</span>,
    route: '/fluxogramas',
  },
  {
    title: '7. Matriz de Decisões',
    description: 'Consultoria estratégica data-driven: a IA analisa dados de performance para validar ou desafiar suas decisões.',
    icon: <span className="text-4xl">🎯</span>,
    route: '/matriz-decisoes',
  },
  {
    title: '8. Configurações (Admin)',
    description: 'Administradores podem gerenciar usuários, status, tags, templates, APIs e webhooks.',
    icon: <span className="text-4xl">⚙️</span>,
    route: '/settings',
  },
];

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
    highlight: 'sidebar',
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
    description: 'Agora você sabe navegar pelo DRX Central! Lembre-se:\n\n• Login do Painel: seu nome + "adm"\n• Senha: DRX2026@\n• Use o Kanban para gerenciar tarefas\n• Consulte a Matriz de Decisões para dúvidas\n\nVocê pode refazer este tutorial a qualquer momento pelo botão "Tutorial" na barra lateral.',
    icon: <span className="text-4xl">🎉</span>,
  },
];

const STORAGE_KEY = 'drx_tutorial_completed';
const OPERATOR_STORAGE_KEY = 'drx_operator_tutorial_completed';

export function TutorialOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: userRole } = useUserRole();

  const isLimitedMember = userRole?.isLimitedMember ?? false;
  const steps = isLimitedMember ? OPERATOR_TUTORIAL_STEPS : ADMIN_TUTORIAL_STEPS;
  const storageKey = isLimitedMember ? OPERATOR_STORAGE_KEY : STORAGE_KEY;

  // Show ask dialog on first load for limited members
  useEffect(() => {
    if (userRole === undefined) return;
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      if (isLimitedMember) {
        setShowAskDialog(true);
      } else {
        setIsOpen(true);
      }
    }
  }, [userRole, storageKey, isLimitedMember]);

  // Listen for manual re-open
  useEffect(() => {
    const handler = () => {
      setCurrentStep(0);
      if (isLimitedMember) {
        setShowAskDialog(true);
      } else {
        setIsOpen(true);
      }
    };
    window.addEventListener('drx-open-tutorial', handler);
    return () => window.removeEventListener('drx-open-tutorial', handler);
  }, [isLimitedMember]);

  const handleClose = () => {
    setIsOpen(false);
    setShowAskDialog(false);
    localStorage.setItem(storageKey, 'true');
  };

  const handleStartTutorial = () => {
    setShowAskDialog(false);
    setCurrentStep(0);
    setIsOpen(true);
  };

  const handleSkipTutorial = () => {
    setShowAskDialog(false);
    localStorage.setItem(storageKey, 'true');
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

  // Ask dialog for operators
  if (showAskDialog) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Olá! Bem-vindo ao DRX Central 👋</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Parece que é sua primeira vez aqui. Deseja fazer um tutorial rápido para aprender a usar o sistema?
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleStartTutorial} className="w-full gap-2 h-12 text-base">
                <BookOpen className="h-5 w-5" />
                Sim, quero aprender!
              </Button>
              <Button variant="ghost" onClick={handleSkipTutorial} className="w-full text-muted-foreground">
                Não, já sei usar
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
              {isLimitedMember ? 'Tutorial do Operador' : 'Tutorial DRX Central'}
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
