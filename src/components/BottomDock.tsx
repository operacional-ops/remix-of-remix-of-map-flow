import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  Home, Layers, MessageSquare, Users, FileText, BarChart3,
  Zap, Settings, Sun, Moon, Monitor, BookOpen, DollarSign,
  Inbox, GitBranch, Target, Activity, LogOut, FolderTree, Menu, X
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useUnreadChannels } from '@/hooks/useChatUnread';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface DockItem {
  title: string;
  url?: string;
  icon: React.ElementType;
  onClick?: () => void;
  badge?: boolean;
  separator?: boolean;
  group?: string;
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
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = userRole?.isAdmin ?? false;
  const isLimitedMember = userRole?.isLimitedMember ?? false;
  const hasUnread = unreadChannels && unreadChannels.length > 0;

  const allItems: DockItem[] = [
    { title: 'Início', url: '/', icon: Home, group: 'nav' },
    { title: 'Tudo', url: '/everything', icon: Layers, group: 'nav' },
    { title: 'Workspaces', url: '/workspaces', icon: FolderTree, group: 'nav' },
    { title: '', icon: Home, separator: true },
    { title: 'Chat', url: '/chat', icon: MessageSquare, badge: !!hasUnread, group: 'comm' },
    { title: 'Discord', url: '/discord', icon: MessageSquare, group: 'comm' },
    { title: 'Equipes', url: '/teams', icon: Users, group: 'comm' },
    { title: 'Documentos', url: '/documents', icon: FileText, group: 'tools' },
    { title: 'Painéis', url: '/dashboards', icon: BarChart3, group: 'tools' },
    ...(isAdmin ? [{ title: 'Automações', url: '/automations', icon: Zap, group: 'tools' }] : []),
    { title: '', icon: Home, separator: true },
    ...(!isLimitedMember ? [
      { title: 'DRX Flow', url: '/painel-drx', icon: Monitor, group: 'drx' },
      { title: 'Expert\'s', url: '/command-center', icon: BookOpen, group: 'drx' },
      { title: 'Financeiro', url: '/financeiro', icon: DollarSign, group: 'drx' },
    ] : []),
    { title: 'Chamados', url: '/chamados', icon: Inbox, group: 'ops' },
    { title: 'Fluxogramas', url: '/fluxogramas', icon: GitBranch, group: 'ops' },
    { title: 'Matriz', url: '/matriz-decisoes', icon: Target, group: 'ops' },
    ...(!isLimitedMember ? [
      { title: 'DRX UTMs', url: '/dashboard-operacao', icon: Activity, group: 'ops' },
      { title: 'DRX Payt', url: '/drx-analytics', icon: BarChart3, group: 'ops' },
    ] : []),
    { title: '', icon: Home, separator: true },
    ...(isAdmin ? [{ title: 'Config', url: '/settings', icon: Settings, group: 'system' }] : []),
    {
      title: theme === 'dark' ? 'Modo Claro' : 'Modo Escuro',
      icon: theme === 'dark' ? Sun : Moon,
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      group: 'system',
    },
    { title: 'Sair', icon: LogOut, onClick: signOut, group: 'system' },
  ];

  // Mobile: show only key items in bottom bar, rest in expandable menu
  const mobileBarItems: DockItem[] = [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Tudo', url: '/everything', icon: Layers },
    { title: 'Chat', url: '/chat', icon: MessageSquare, badge: !!hasUnread },
    { title: 'Docs', url: '/documents', icon: FileText },
    { title: 'Mais', icon: Menu, onClick: () => setMobileMenuOpen(true) },
  ];

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // --- Desktop Dock Logic ---
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
    const smooth = (1 - Math.cos(ratio * Math.PI)) / 2;
    return 1 + ((MAX_SIZE - BASE_SIZE) / BASE_SIZE) * smooth;
  }, [mouseX]);

  // --- MOBILE RENDER ---
  if (isMobile) {
    const menuItems = allItems.filter(i => !i.separator);

    return (
      <>
        {/* Mobile bottom bar - fixed 5 items */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-xl safe-area-bottom">
          <div className="flex items-center justify-around px-1 py-1.5">
            {mobileBarItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = !!item.url && (
                item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url)
              );
              return (
                <button
                  key={item.title + i}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else if (item.url) navigate(item.url);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg min-w-[52px] transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-1 ring-background" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-none">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile full-screen menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-xl flex flex-col animate-fade-scale">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <span className="font-semibold text-lg">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-accent/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable menu items */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              <div className="grid grid-cols-3 gap-2">
                {menuItems.map((item, i) => {
                  const Icon = item.icon;
                  const isActive = !!item.url && (
                    item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url)
                  );
                  return (
                    <button
                      key={item.title + i}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                          setMobileMenuOpen(false);
                        }
                        else if (item.url) {
                          navigate(item.url);
                          // closed by useEffect on pathname change
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors min-h-[72px]",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted/50 text-foreground hover:bg-accent/10 border border-transparent"
                      )}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium leading-tight text-center line-clamp-1">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // --- DESKTOP RENDER (unchanged) ---
  let refIdx = 0;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="pointer-events-auto flex items-end gap-[3px] px-3 py-2 rounded-2xl border border-border/30 bg-background/70 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
      >
        {allItems.map((item, i) => {
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
