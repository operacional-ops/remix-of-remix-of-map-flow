import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  Home, Layers, MessageSquare, Users, FileText, BarChart3,
  Zap, Settings, Sun, Moon, Monitor, BookOpen, DollarSign,
  Inbox, GitBranch, Target, Activity, LogOut, FolderTree
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useUnreadChannels } from '@/hooks/useChatUnread';
import { cn } from '@/lib/utils';

interface DockItem {
  title: string;
  url?: string;
  icon: React.ElementType;
  onClick?: () => void;
  badge?: boolean;
  separator?: boolean;
}

const BASE_SIZE = 42;
const MAX_SIZE = 62;
const MAGNIFY_RANGE = 150;

export function BottomDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { data: userRole } = useUserRole();
  const { data: unreadChannels } = useUnreadChannels();
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const isAdmin = userRole?.isAdmin ?? false;
  const isLimitedMember = userRole?.isLimitedMember ?? false;
  const hasUnread = unreadChannels && unreadChannels.length > 0;

  const items: DockItem[] = [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Tudo', url: '/everything', icon: Layers },
    { title: 'Workspaces', url: '/workspaces', icon: FolderTree },
    { title: '', icon: Home, separator: true },
    { title: 'Chat', url: '/chat', icon: MessageSquare, badge: !!hasUnread },
    { title: 'Discord', url: '/discord', icon: MessageSquare },
    { title: 'Equipes', url: '/teams', icon: Users },
    { title: 'Documentos', url: '/documents', icon: FileText },
    { title: 'Painéis', url: '/dashboards', icon: BarChart3 },
    ...(isAdmin ? [{ title: 'Automações', url: '/automations', icon: Zap }] : []),
    { title: '', icon: Home, separator: true },
    ...(!isLimitedMember ? [
      { title: 'Painel DRX', url: '/painel-drx', icon: Monitor },
      { title: 'Expert\'s', url: '/command-center', icon: BookOpen },
      { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
    ] : []),
    { title: 'Chamados', url: '/chamados', icon: Inbox },
    { title: 'Fluxogramas', url: '/fluxogramas', icon: GitBranch },
    { title: 'Matriz', url: '/matriz-decisoes', icon: Target },
    ...(!isLimitedMember ? [
      { title: 'Operação', url: '/dashboard-operacao', icon: Activity },
      { title: 'Analytics', url: '/drx-analytics', icon: BarChart3 },
    ] : []),
    { title: '', icon: Home, separator: true },
    ...(isAdmin ? [{ title: 'Config', url: '/settings', icon: Settings }] : []),
    {
      title: theme === 'dark' ? 'Modo Claro' : 'Modo Escuro',
      icon: theme === 'dark' ? Sun : Moon,
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    { title: 'Sair', icon: LogOut, onClick: signOut },
  ];

  // Filter out separators for ref indexing, but keep for rendering
  const nonSepItems = items.filter(i => !i.separator);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setMouseX(e.clientX);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setMouseX(null);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const getScale = useCallback((el: HTMLButtonElement | null): number => {
    if (mouseX === null || !el) return 1;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(mouseX - center);
    if (dist > MAGNIFY_RANGE) return 1;
    const ratio = 1 - dist / MAGNIFY_RANGE;
    // Smooth cosine interpolation for macOS-like feel
    const smooth = (1 - Math.cos(ratio * Math.PI)) / 2;
    return 1 + ((MAX_SIZE - BASE_SIZE) / BASE_SIZE) * smooth;
  }, [mouseX]);

  let refIdx = 0;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="pointer-events-auto flex items-end gap-[3px] px-3 py-2 rounded-2xl border border-border/30 bg-background/70 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
      >
        {items.map((item, i) => {
          if (item.separator) {
            return (
              <div
                key={`sep-${i}`}
                className="w-px h-8 bg-border/30 mx-1 self-center flex-shrink-0"
              />
            );
          }
          const currentRefIdx = refIdx++;
          const isActive = !!item.url && (
            item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url)
          );
          return (
            <DockIcon
              key={item.title + i}
              item={item}
              isActive={isActive}
              getScale={getScale}
              ref={(el) => { itemRefs.current[currentRefIdx] = el; }}
              onClick={() => {
                if (item.onClick) item.onClick();
                else if (item.url) navigate(item.url);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

import { forwardRef } from 'react';

const DockIcon = forwardRef<HTMLButtonElement, {
  item: DockItem;
  isActive: boolean;
  getScale: (el: HTMLButtonElement | null) => number;
  onClick: () => void;
}>(({ item, isActive, getScale, onClick }, ref) => {
  const innerRef = useRef<HTMLButtonElement | null>(null);
  const [scale, setScale] = useState(1);
  const Icon = item.icon;

  const setRefs = useCallback((el: HTMLButtonElement | null) => {
    innerRef.current = el;
    if (typeof ref === 'function') ref(el);
  }, [ref]);

  // Recalculate scale whenever getScale changes (which means mouseX changed)
  useEffect(() => {
    const newScale = getScale(innerRef.current);
    setScale(newScale);
  }, [getScale]);

  const size = BASE_SIZE * scale;
  const iconSize = 18 * scale;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          ref={setRefs}
          onClick={onClick}
          className={cn(
            "relative flex items-center justify-center rounded-xl flex-shrink-0",
            "transition-colors duration-200",
            "hover:bg-accent/15",
            isActive && "bg-primary/10"
          )}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transition: 'width 0.3s cubic-bezier(0.25, 1, 0.5, 1), height 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <Icon
            className={cn(
              isActive ? "text-primary" : "text-muted-foreground",
              "transition-colors duration-200"
            )}
            style={{
              width: `${iconSize}px`,
              height: `${iconSize}px`,
              transition: 'width 0.3s cubic-bezier(0.25, 1, 0.5, 1), height 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          />
          {item.badge && (
            <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
          )}
          {isActive && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-medium bg-popover/90 backdrop-blur-sm">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
});

DockIcon.displayName = 'DockIcon';
