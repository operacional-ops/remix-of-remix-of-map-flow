import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
  route?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '1. Selecione um Workspace',
    description: 'Ao acessar o sistema, selecione ou crie um Workspace na barra lateral. O Workspace representa a operação que você deseja gerenciar. Todos os dados (tasks, dashboards, métricas) ficam isolados por workspace.',
    icon: '🏢',
    route: '/workspaces',
  },
  {
    title: '2. Navegue pelos Módulos',
    description: 'Use a barra lateral para acessar Chat, Equipes, Documentos, Painéis e Automações. Cada módulo organiza uma parte da sua operação. O item "Tudo" mostra todas as tarefas de todos os espaços.',
    icon: '📋',
    route: '/',
  },
  {
    title: '3. Painel DRX (Legado)',
    description: 'O Painel DRX integra o sistema legado com Kanban e gestão de membros. Faça login com seu nome + "adm" (ex: ailtonadm) e a senha universal DRX2026@. Gerencie tarefas e acompanhe o time por lá.',
    icon: '📺',
    route: '/painel-drx',
  },
  {
    title: '4. Dashboard Operação',
    description: 'Visualize KPIs da operação: ROAS, Lucro, Vendas e Gastos em tempo real. Acompanhe gráficos de Receita vs Gastos e evolução do ROAS. Requer dados cadastrados no Controle Operacional.',
    icon: '📊',
    route: '/dashboard-operacao',
  },
  {
    title: '5. DRX Analytics',
    description: 'Análise avançada de marketing: cards de KPI, ROI por fonte de tráfego e Deep Dive com Funil de Vendas, Unit Economics (CPA, Ticket Médio, Margem) e Mapa de Calor de horários de pico.',
    icon: '📈',
    route: '/drx-analytics',
  },
  {
    title: '6. Fluxogramas de Processos',
    description: 'Crie e visualize fluxogramas da operação, documente processos e POPs. Use o chatbot de IA para consultar e criar novos processos rapidamente.',
    icon: '🔀',
    route: '/fluxogramas',
  },
  {
    title: '7. Matriz de Decisões',
    description: 'Consultoria estratégica data-driven: a IA analisa seus dados reais de performance (ROAS, CPA, Receita) para validar ou desafiar suas decisões. Inclui alertas automáticos para métricas fora do padrão.',
    icon: '🎯',
    route: '/matriz-decisoes',
  },
  {
    title: '8. Chamados Internos',
    description: 'Envie e gerencie chamados entre membros do time. Acompanhe o status de cada solicitação e mantenha a comunicação organizada dentro da operação.',
    icon: '📩',
    route: '/chamados',
  },
  {
    title: '9. Configurações (Admin)',
    description: 'Administradores podem gerenciar usuários, status personalizados, tags, templates de espaço, APIs e webhooks. Acesse pelo ícone de engrenagem na barra lateral.',
    icon: '⚙️',
    route: '/settings',
  },
];

const STORAGE_KEY = 'drx_tutorial_completed';

export function TutorialOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener('drx-open-tutorial', handler);
    return () => window.removeEventListener('drx-open-tutorial', handler);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
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
    const step = TUTORIAL_STEPS[currentStep];
    if (step.route) {
      navigate(step.route);
    }
  };

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Tutorial DRX Central</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-4xl">{step.icon}</span>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </div>

          {step.route && (
            <Button variant="outline" size="sm" onClick={handleGoToRoute} className="mb-2">
              Ir para esta página →
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} de {TUTORIAL_STEPS.length}
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
              {isLast ? 'Concluir' : 'Avançar'} {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {TUTORIAL_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TutorialTrigger() {
  const handleOpen = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleOpen} className="gap-1.5 text-xs">
      <BookOpen className="h-3.5 w-3.5" /> Tutorial
    </Button>
  );
}
