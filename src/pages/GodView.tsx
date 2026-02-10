import { useState, useMemo } from 'react';
import { Eye, LayoutGrid, ListTodo, MousePointerClick, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TEAM_DATA, getOperationalTeam, getBoardMembers } from '@/data/drx-team';
import { useAllTasks } from '@/hooks/useAllTasks';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function GodView() {
  const { activeWorkspace } = useWorkspace();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'supervision' | 'overview'>('supervision');

  const teamMembers = getOperationalTeam();
  const boardMembers = getBoardMembers();
  const allMembers = [...boardMembers, ...teamMembers];

  const selectedMember = selectedMemberId ? TEAM_DATA.find(m => m.id === selectedMemberId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">God View</h1>
              <p className="text-sm text-muted-foreground">Supervisão completa da equipe DRX</p>
            </div>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'supervision' | 'overview')}>
            <TabsList>
              <TabsTrigger value="supervision" className="gap-2">
                <LayoutGrid className="h-4 w-4" /> Supervisão
              </TabsTrigger>
              <TabsTrigger value="overview" className="gap-2">
                <Activity className="h-4 w-4" /> Visão Geral
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'supervision' ? (
          <div className="space-y-4">
            {/* Team Grid */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Diretoria & Estratégia</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {boardMembers.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isSelected={selectedMemberId === member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Time Operacional</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {teamMembers.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isSelected={selectedMemberId === member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                  />
                ))}
              </div>
            </div>

            {/* Selected Member Detail */}
            <Card className="flex-1">
              <CardContent className="p-6">
                {selectedMember ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                      <div className={`w-10 h-10 ${selectedMember.color} rounded-full flex items-center justify-center text-sm font-bold text-white`}>
                        {selectedMember.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedMember.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedMember.role}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      Para ver as tarefas deste membro, acesse a visão <strong>"Tudo"</strong> e filtre por responsável. 
                      A integração com o kanban completo do MAP Flow permite acompanhar o fluxo em tempo real.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MousePointerClick className="h-12 w-12 mb-3 opacity-30" />
                    <p>Selecione um colaborador acima para auditar.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Overview Mode */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMembers.map(member => (
                <Card key={member.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 ${member.color} rounded-full flex items-center justify-center text-sm font-bold text-white`}>
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{member.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                      </div>
                      <Badge variant={member.isDirector ? 'default' : 'secondary'} className="text-[10px]">
                        {member.isDirector ? 'Diretoria' : 'Operacional'}
                      </Badge>
                    </div>
                    <Progress value={0} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-1">Sem tarefas vinculadas ainda</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member, isSelected, onClick }: { member: typeof TEAM_DATA[0]; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border text-left transition-all w-full ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 ${member.color} rounded-full flex items-center justify-center text-[10px] font-bold text-white`}>
          {member.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate">{member.name}</div>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground truncate">{member.role}</div>
    </button>
  );
}
