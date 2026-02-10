import { useState } from 'react';
import { Inbox, Send, AlertTriangle, Reply, CheckCircle, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TEAM_DATA } from '@/data/drx-team';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Chamado {
  id: string;
  fromMemberId: string;
  fromMemberName: string;
  content: string;
  reply: string | null;
  status: 'open' | 'replied';
  createdAt: Date;
}

export default function TeamChamados() {
  const { user } = useAuth();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [newContent, setNewContent] = useState('');
  const [selectedFrom, setSelectedFrom] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'replied'>('all');

  const handleSend = () => {
    if (!newContent.trim() || !selectedFrom) return;

    const member = TEAM_DATA.find(m => m.id === selectedFrom);
    if (!member) return;

    const newChamado: Chamado = {
      id: crypto.randomUUID(),
      fromMemberId: selectedFrom,
      fromMemberName: member.name,
      content: newContent,
      reply: null,
      status: 'open',
      createdAt: new Date(),
    };

    setChamados(prev => [newChamado, ...prev]);
    setNewContent('');
    toast.success('Chamado registrado com sucesso!');
  };

  const handleReply = (chamadoId: string) => {
    if (!replyText.trim()) return;
    setChamados(prev =>
      prev.map(c =>
        c.id === chamadoId
          ? { ...c, reply: replyText, status: 'replied' as const }
          : c
      )
    );
    setReplyText('');
    setReplyingId(null);
    toast.success('Resposta enviada!');
  };

  const filteredChamados = chamados.filter(c => {
    if (filter === 'open') return c.status === 'open';
    if (filter === 'replied') return c.status === 'replied';
    return true;
  });

  const openCount = chamados.filter(c => c.status === 'open').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Inbox className="h-6 w-6 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold">Central de Chamados</h1>
              <p className="text-sm text-muted-foreground">
                Sistema de comunicação entre time e diretoria
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {openCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {openCount} pendentes
              </Badge>
            )}
            <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'open' | 'replied')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Pendentes</SelectItem>
                <SelectItem value="replied">Respondidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* New Chamado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4" /> Novo Chamado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedFrom} onValueChange={setSelectedFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="De quem é o chamado?" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_DATA.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 ${m.color} rounded-full flex items-center justify-center text-[9px] font-bold text-white`}>
                          {m.avatar}
                        </div>
                        {m.name} — {m.role}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Descreva o incidente, insight ou bloqueio..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
              />
              <Button onClick={handleSend} disabled={!newContent.trim() || !selectedFrom} className="w-full">
                <AlertTriangle className="h-4 w-4 mr-2" /> Registrar Chamado
              </Button>
            </CardContent>
          </Card>

          {/* Chamados List */}
          {filteredChamados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum chamado {filter === 'open' ? 'pendente' : filter === 'replied' ? 'respondido' : ''} ainda.</p>
            </div>
          ) : (
            filteredChamados.map(chamado => {
              const member = TEAM_DATA.find(m => m.id === chamado.fromMemberId);
              return (
                <Card key={chamado.id} className={chamado.status === 'open' ? 'border-yellow-500/30' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 ${member?.color || 'bg-muted'} rounded-full flex items-center justify-center text-[10px] font-bold text-white`}>
                          {member?.avatar || '?'}
                        </div>
                        <div>
                          <span className="font-bold text-sm">{chamado.fromMemberName}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {chamado.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <Badge variant={chamado.status === 'open' ? 'outline' : 'secondary'} className="text-[10px] gap-1">
                        {chamado.status === 'open' ? (
                          <><Clock className="h-3 w-3" /> Pendente</>
                        ) : (
                          <><CheckCircle className="h-3 w-3" /> Respondido</>
                        )}
                      </Badge>
                    </div>

                    <p className="text-sm bg-muted/50 p-3 rounded-lg mb-3">{chamado.content}</p>

                    {chamado.reply && (
                      <div className="border-l-2 border-primary p-3 rounded-r-lg bg-primary/5 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3 text-primary" />
                          <span className="text-xs font-bold text-primary">Diretoria</span>
                        </div>
                        <p className="text-sm">{chamado.reply}</p>
                      </div>
                    )}

                    {chamado.status === 'open' && (
                      replyingId === chamado.id ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Sua resposta..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleReply(chamado.id)}
                          />
                          <Button size="sm" onClick={() => handleReply(chamado.id)}>Enviar</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setReplyingId(null); setReplyText(''); }}>Cancelar</Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingId(chamado.id)}
                          className="text-primary gap-1"
                        >
                          <Reply className="h-3 w-3" /> Responder
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
