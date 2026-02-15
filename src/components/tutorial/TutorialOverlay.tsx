import { useState, useEffect, useCallback, useRef } from 'react';
import { X, BookOpen, ChevronRight, ChevronLeft, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

type PointerDirection = 'left' | 'right' | 'down' | 'up' | 'none';
type TooltipPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center' | 'bottom-center';

interface TutorialStep {
  /** Short bold headline */
  title: string;
  /** 1-2 sentence max */
  tip: string;
  /** CSS selector for element to highlight (optional) */
  highlightSelector?: string;
  /** Arrow direction pointing at the element */
  pointer: PointerDirection;
  /** Where the tooltip card sits on screen */
  position: TooltipPosition;
  /** Navigate to this route when step activates */
  route?: string;
  /** Credential hint shown as a badge */
  badge?: string;
}

// ─── ADMIN TUTORIAL ───
const ADMIN_STEPS: TutorialStep[] = [
  {
    title: '👋 Vamos começar!',
    tip: 'Tutorial rápido e prático. Você vai aprender clicando.',
    pointer: 'none',
    position: 'center',
  },
  {
    title: '🏢 Escolha o Workspace',
    tip: 'Clique aqui para selecionar sua operação.',
    highlightSelector: '[data-tutorial="workspace-selector"]',
    pointer: 'left',
    position: 'bottom-left',
    route: '/workspaces',
  },
  {
    title: '📺 Painel DRX',
    tip: 'Acesse o Kanban e Inbox aqui.',
    highlightSelector: '[data-tutorial="painel-drx"]',
    pointer: 'left',
    position: 'bottom-left',
    route: '/painel-drx',
    badge: 'Login: nome+adm | Senha: DRX2026@',
  },
  {
    title: '📊 Dashboard Operação',
    tip: 'KPIs em tempo real: ROAS, Lucro, Vendas, Gastos.',
    highlightSelector: '[data-tutorial="dashboard-operacao"]',
    pointer: 'left',
    position: 'bottom-left',
    route: '/dashboard-operacao',
  },
  {
    title: '📈 DRX Analytics',
    tip: 'Funil de Vendas, Unit Economics e Mapa de Calor.',
    highlightSelector: '[data-tutorial="drx-analytics"]',
    pointer: 'left',
    position: 'bottom-left',
    route: '/drx-analytics',
  },
  {
    title: '📨 Chamados',
    tip: 'Envie chamados para a equipe e diretoria.',
    highlightSelector: '[data-tutorial="chamados"]',
    pointer: 'left',
    position: 'bottom-left',
    route: '/chamados',
  },
  {
    title: '🔀 Fluxogramas',
    tip: 'Crie processos e POPs com IA integrada.',
    highlightSelector: '[data-tutorial="fluxogramas"]',
    pointer: 'left',
    position: 'bottom-left',
    route: '/fluxogramas',
  },
  {
    title: '🎯 Matriz de Decisões',
    tip: 'IA consultora com dados reais do seu workspace.',
    highlightSelector: '[data-tutorial="matriz-decisoes"]',
    pointer: 'left',
    position: 'bottom-left',
    route: '/matriz-decisoes',
  },
  {
    title: '🎉 Pronto!',
    tip: 'Agora é com você. Reabra pelo botão "Tutorial" na sidebar.',
    pointer: 'none',
    position: 'center',
  },
];

// ─── OPERATOR TUTORIAL ───
const OPERATOR_STEPS: TutorialStep[] = [
  {
    title: '👋 Olá!',
    tip: 'Tutorial rápido — aprenda fazendo!',
    pointer: 'none',
    position: 'center',
  },
  {
    title: '📋 Barra Lateral',
    tip: 'Sua navegação principal. Explore os menus aqui.',
    highlightSelector: '[data-sidebar="sidebar"]',
    pointer: 'left',
    position: 'bottom-left',
  },
  {
    title: '📺 Painel DRX',
    tip: 'Clique aqui para acessar o Kanban.',
    highlightSelector: '[data-tutorial="painel-drx"]',
    pointer: 'left',
    position: 'bottom-left',
    route: '/painel-drx',
    badge: 'Login: nome+adm | Senha: DRX2026@',
  },
  {
    title: '📌 Kanban',
    tip: 'A Fazer → Fazendo → Feito. Mova tarefas com ◀ ▶.',
    pointer: 'down',
    position: 'top-right',
  },
  {
    title: '➕ Criar Tarefa',
    tip: 'Clique em "+ Adicionar Tarefa" na coluna A FAZER.',
    pointer: 'down',
    position: 'top-right',
  },
  {
    title: '📨 Inbox',
    tip: 'Envie mensagens para a diretoria na aba Inbox.',
    pointer: 'down',
    position: 'top-left',
  },
  {
    title: '🎯 Matriz Decisões',
    tip: 'Consulte a IA para aprender sobre processos.',
    highlightSelector: '[data-tutorial="matriz-decisoes"]',
    pointer: 'left',
    position: 'bottom-left',
    route: '/matriz-decisoes',
  },
  {
    title: '🎉 Pronto!',
    tip: 'Login: nome+adm | Senha: DRX2026@\nBom trabalho!',
    pointer: 'none',
    position: 'center',
  },
];

const ADMIN_STORAGE_KEY = 'drx_admin_tutorial_v2';

// ─── Animated pointer arrow ───
function PointerArrow({ direction }: { direction: PointerDirection }) {
  if (direction === 'none') return null;

  const icons: Record<string, React.ReactNode> = {
    left: <ArrowLeftIcon className="h-8 w-8" />,
    right: <ChevronRight className="h-8 w-8" />,
    down: <ArrowDown className="h-8 w-8" />,
    up: <ArrowUp className="h-8 w-8" />,
  };

  const animClass: Record<string, string> = {
    left: 'animate-[bounce-left_1s_infinite]',
    right: 'animate-[bounce-right_1s_infinite]',
    down: 'animate-bounce',
    up: 'animate-[bounce-up_1s_infinite]',
  };

  return (
    <div className={`text-primary drop-shadow-lg ${animClass[direction]}`}>
      {icons[direction]}
    </div>
  );
}

// ─── Position classes ───
function getPositionClasses(pos: TooltipPosition): string {
  switch (pos) {
    case 'bottom-left': return 'top-20 left-72 md:left-80';
    case 'bottom-right': return 'top-20 right-6';
    case 'top-left': return 'bottom-20 left-72 md:left-80';
    case 'top-right': return 'bottom-20 right-6';
    case 'bottom-center': return 'bottom-24 left-1/2 -translate-x-1/2';
    case 'center':
    default: return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  }
}

function getArrowPositionClasses(pos: TooltipPosition, pointer: PointerDirection): string {
  if (pointer === 'left') return 'absolute -left-12 top-1/2 -translate-y-1/2';
  if (pointer === 'right') return 'absolute -right-12 top-1/2 -translate-y-1/2';
  if (pointer === 'down') return 'absolute left-1/2 -translate-x-1/2 -bottom-12';
  if (pointer === 'up') return 'absolute left-1/2 -translate-x-1/2 -top-12';
  return 'hidden';
}

export function TutorialOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number }>({ x: 0, y: 0, ox: 0, oy: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: userRole } = useUserRole();

  const isLimitedMember = userRole?.isLimitedMember ?? false;
  const steps = isLimitedMember ? OPERATOR_STEPS : ADMIN_STEPS;

  // Reset drag offset when step changes
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
  }, [currentStep]);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't drag if clicking a button
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: dragOffset.x, oy: dragOffset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [dragOffset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setDragOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    if (userRole === undefined) return;
    if (isLimitedMember) {
      setShowAskDialog(true);
    } else {
      const completed = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!completed) setShowAskDialog(true);
    }
  }, [userRole, isLimitedMember]);

  useEffect(() => {
    const handler = () => {
      setCurrentStep(0);
      setShowAskDialog(true);
    };
    window.addEventListener('drx-open-tutorial', handler);
    return () => window.removeEventListener('drx-open-tutorial', handler);
  }, []);

  // Highlight target element
  useEffect(() => {
    if (!isOpen) return;
    const step = steps[currentStep];
    if (!step?.highlightSelector) return;

    const el = document.querySelector(step.highlightSelector) as HTMLElement | null;
    if (el) {
      el.style.position = 'relative';
      el.style.zIndex = '101';
      el.style.boxShadow = '0 0 0 4px hsl(var(--primary) / 0.5), 0 0 20px hsl(var(--primary) / 0.3)';
      el.style.borderRadius = '8px';
      el.style.transition = 'box-shadow 0.3s ease';
    }

    return () => {
      if (el) {
        el.style.zIndex = '';
        el.style.boxShadow = '';
        el.style.borderRadius = '';
      }
    };
  }, [isOpen, currentStep, steps]);

  // Navigate to step route
  useEffect(() => {
    if (!isOpen) return;
    const step = steps[currentStep];
    if (step?.route && location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [isOpen, currentStep, steps, navigate, location.pathname]);

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
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // ─── Ask Dialog ───
  if (showAskDialog) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-background/95 border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-scale-in">
          <div className="p-6 text-center">
            <span className="text-4xl block mb-3">{isLimitedMember ? '👋' : '🚀'}</span>
            <h2 className="text-lg font-bold text-foreground mb-1">
              {isLimitedMember ? 'Tutorial rápido?' : 'Tour guiado?'}
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              {isLimitedMember
                ? 'Aprenda a usar o sistema em poucos cliques.'
                : 'Veja todos os módulos da operação em ação.'}
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleSkipTutorial} className="flex-1 text-muted-foreground">
                Pular
              </Button>
              <Button onClick={handleStartTutorial} className="flex-1 gap-1.5">
                Vamos lá <ChevronRight className="h-4 w-4" />
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
  const isCenter = step.position === 'center';
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Semi-transparent overlay — click-through disabled */}
      <div className="fixed inset-0 z-[99] bg-black/30 pointer-events-none" />

      {/* Floating tooltip card */}
      <div
        ref={cardRef}
        className={`fixed z-[102] ${getPositionClasses(step.position)} ${isDragging.current ? '' : 'transition-all duration-300 ease-out'}`}
        style={{
          maxWidth: isCenter ? '340px' : '300px',
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
          cursor: 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className={`relative bg-background/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-scale-in ${isCenter ? 'p-6 text-center' : 'p-4'}`}>
          {/* Pointer arrow */}
          <div className={getArrowPositionClasses(step.position, step.pointer)}>
            <PointerArrow direction={step.pointer} />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Content */}
          <div className={isCenter ? '' : 'pr-6'}>
            <h3 className="text-base font-bold text-foreground mb-1">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{step.tip}</p>
          </div>

          {/* Badge (credentials) */}
          {step.badge && (
            <div className="mt-2 inline-block bg-primary/10 text-primary text-[10px] font-mono px-2 py-1 rounded-md">
              {step.badge}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
            {/* Progress dots */}
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-4 bg-primary'
                      : i < currentStep
                        ? 'w-1.5 bg-primary/40'
                        : 'w-1.5 bg-muted-foreground/20'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="h-7 px-3 text-xs gap-1"
              >
                {isLast ? 'Concluir ✅' : 'Próximo'}
                {!isLast && <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
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
