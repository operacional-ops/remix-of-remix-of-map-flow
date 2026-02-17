import { useState } from 'react';
import {
  LayoutDashboard, ChevronDown, ChevronRight, Facebook, Globe, MonitorPlay, TrendingUp,
  Link2, Plug, BookOpen, Percent, DollarSign, FileText, Bell, Settings, HelpCircle,
  Megaphone, UserCircle, Zap, Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  active?: boolean;
  children?: { label: string; active?: boolean }[];
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboards', icon: LayoutDashboard, children: [
    { label: 'Resumo' },
  ]},
  { label: 'Esteira de O...', icon: Zap, children: [
    { label: 'Resumo' },
  ]},
  { label: 'Meta', icon: Facebook, active: true },
  { label: 'Google', icon: Globe },
  { label: 'Kwai', icon: MonitorPlay },
  { label: 'TikTok', icon: TrendingUp },
  { label: 'UTMs', icon: Link2 },
  { label: 'Integrações', icon: Plug },
  { label: 'Regras', icon: BookOpen },
  { label: 'Taxas', icon: Percent },
  { label: 'Despesas', icon: DollarSign },
  { label: 'Relatórios', icon: FileText },
  { label: 'Notificaçõ...', icon: Bell },
  { label: 'Esteira de N...', icon: Share2 },
];

const bottomItems: SidebarItem[] = [
  { label: 'Assinatura', icon: Settings },
  { label: 'Minha conta', icon: UserCircle },
  { label: 'Avançado', icon: Settings },
  { label: 'Indique e Ganhe 10%', icon: Megaphone },
  { label: 'Suporte', icon: HelpCircle },
];

export default function UtmifySidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['Esteira de O...']);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const renderItem = (item: SidebarItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const Icon = item.icon;

    return (
      <div key={item.label}>
        <button
          onClick={() => hasChildren ? toggleExpand(item.label) : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-md mx-1',
            item.active
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate flex-1 text-left">{item.label}</span>
          {hasChildren && (
            isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="ml-7 space-y-0.5 mt-0.5">
            {item.children!.map(child => (
              <button
                key={child.label}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors',
                  child.active
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {child.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[200px] bg-card border-r border-border flex flex-col shrink-0 h-full">
      {/* Logo area */}
      <div className="p-4 border-b border-border flex items-center gap-2">
        <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">U</span>
        </div>
        <span className="text-sm font-bold text-foreground">utmify</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2 space-y-0.5">
          {sidebarItems.map(renderItem)}
        </div>
        <div className="border-t border-border mt-2 pt-2 space-y-0.5">
          {bottomItems.map(renderItem)}
        </div>
      </ScrollArea>
    </div>
  );
}
