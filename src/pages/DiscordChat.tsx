import { useEffect, useRef } from 'react';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DiscordChat() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create the widgetbot iframe directly
    const iframe = document.createElement('iframe');
    iframe.src = 'https://e.widgetbot.io/channels/1469439424147488953/1469439425195806844';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.style.borderRadius = '0.5rem';
    iframe.allow = 'clipboard-write; fullscreen';
    containerRef.current.appendChild(iframe);

    return () => {
      iframe.remove();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-0px)] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 h-14 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#5865F2]/10">
            <MessageCircle className="h-5 w-5 text-[#5865F2]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Discord DRX</h1>
            <p className="text-xs text-muted-foreground">Comunicação em tempo real com a equipe</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => window.open('https://discord.gg/lovable-dev', '_blank')}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir no Discord
        </Button>
      </div>

      {/* Discord Embed */}
      <div className="flex-1 p-4">
        <Card className="h-full border-border/50 overflow-hidden">
          <CardContent className="p-0 h-full">
            <div ref={containerRef} className="w-full h-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
