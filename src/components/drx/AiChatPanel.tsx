import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDrxAiChat } from '@/hooks/useDrxAiChat';

interface AiChatPanelProps {
  contextType: string;
  contextData?: any;
  placeholder?: string;
  title?: string;
}

export function AiChatPanel({ contextType, contextData, placeholder, title }: AiChatPanelProps) {
  const { messages, isLoading, sendMessage, clearMessages } = useDrxAiChat(contextType, contextData);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">{title || 'Assistente IA DRX'}</span>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearMessages} className="h-7 w-7">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm text-center gap-2">
            <Bot className="h-8 w-8 opacity-40" />
            <p>{placeholder || 'Faça uma pergunta para o assistente IA...'}</p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <Bot className="h-5 w-5 text-primary mt-1 flex-shrink-0" />}
              <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && <User className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-2">
              <Bot className="h-5 w-5 text-primary mt-1" />
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t flex gap-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="min-h-[40px] max-h-[120px] resize-none text-sm"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="flex-shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
