import { useState } from 'react';
import { Facebook, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UtmifySidebarProps {
  activeView: 'resumo' | 'meta';
  onViewChange: (view: 'resumo' | 'meta') => void;
}

export default function UtmifySidebar({ activeView, onViewChange }: UtmifySidebarProps) {
  const [expanded, setExpanded] = useState(true);

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
          {/* Esteira de Otimização - expandable */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-md mx-1"
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="truncate flex-1 text-left">Esteira de O...</span>
            {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          </button>

          {expanded && (
            <div className="ml-4 space-y-0.5">
              {/* Resumo */}
              <button
                onClick={() => onViewChange('resumo')}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-md mx-1',
                  activeView === 'resumo'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">Resumo</span>
              </button>

              {/* Meta */}
              <button
                onClick={() => onViewChange('meta')}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-md mx-1',
                  activeView === 'meta'
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Facebook className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">Meta</span>
              </button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
