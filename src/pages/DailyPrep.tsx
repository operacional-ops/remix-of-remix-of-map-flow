import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ShieldAlert, Ban, CheckCircle2, UserCheck, ListChecks, Check, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEAM_DATA, ROLE_DETAILS, CHECKLISTS, type TeamMember } from '@/data/drx-team';

export default function DailyPrep() {
  const navigate = useNavigate();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [checks, setChecks] = useState<Record<number, boolean>>({});

  const selectedMember = TEAM_DATA.find(m => m.id === selectedMemberId);
  const roleDetails = selectedMemberId ? ROLE_DETAILS[selectedMemberId] : null;
  const checklist = selectedMemberId ? (CHECKLISTS[selectedMemberId] || CHECKLISTS.default) : [];

  const handleCheck = (index: number) => {
    setChecks(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const allChecked = checklist.length > 0 && checklist.every((_, i) => checks[i]);

  const handleComplete = () => {
    if (selectedMemberId) {
      localStorage.setItem(`drx_prep_${selectedMemberId}`, new Date().toDateString());
      navigate('/');
    }
  };

  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    setChecks({});
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Ritual de Preparação</h1>
              <p className="text-sm text-muted-foreground">Revise sua função e complete o checklist antes de iniciar</p>
            </div>
          </div>
          <Select value={selectedMemberId} onValueChange={handleMemberChange}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Selecione um membro..." />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Diretoria</div>
              {TEAM_DATA.filter(m => m.category === 'board').map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 ${m.color} rounded-full flex items-center justify-center text-[9px] font-bold text-white`}>{m.avatar}</div>
                    {m.name}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase mt-1">Time Operacional</div>
              {TEAM_DATA.filter(m => m.category === 'team').map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 ${m.color} rounded-full flex items-center justify-center text-[9px] font-bold text-white`}>{m.avatar}</div>
                    {m.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!selectedMember ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Target className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg">Selecione um membro para visualizar sua função</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Left - Role Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Member Header */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${selectedMember.color} rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                  {selectedMember.avatar}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedMember.name}</h2>
                  <p className="text-muted-foreground">{selectedMember.role}</p>
                </div>
              </div>

              {roleDetails && (
                <>
                  {/* Mission */}
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" /> Missão da Função
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{roleDetails.mission}</p>
                    </CardContent>
                  </Card>

                  {/* Non-negotiables & Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4" /> Não Negociáveis
                        </h4>
                        <ul className="space-y-2">
                          {roleDetails.nonNegotiables.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-muted-foreground/50 mt-0.5">•</span> {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-sm font-bold text-destructive uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Ban className="h-4 w-4" /> Limites Claros
                        </h4>
                        <ul className="space-y-2">
                          {roleDetails.limits.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-muted-foreground/50 mt-0.5">•</span> {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Decisions & Behavior */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-sm font-bold text-green-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Decisões Permitidas
                        </h4>
                        <ul className="space-y-2">
                          {roleDetails.decisions.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-muted-foreground/50 mt-0.5">•</span> {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-sm font-bold text-purple-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <UserCheck className="h-4 w-4" /> Comportamento Esperado
                        </h4>
                        <ul className="space-y-2">
                          {roleDetails.behavior.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-muted-foreground/50 mt-0.5">•</span> {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>

            {/* Right - Checklist */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-green-500" /> Ritual de Preparação
                  </h3>
                  <div className="space-y-3 mb-6">
                    {checklist.map((item, index) => (
                      <label
                        key={index}
                        className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                      >
                        <Checkbox
                          checked={!!checks[index]}
                          onCheckedChange={() => handleCheck(index)}
                          className="mt-0.5"
                        />
                        <span className={`text-sm leading-snug ${checks[index] ? 'text-muted-foreground line-through' : ''}`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={handleComplete}
                    disabled={!allChecked}
                    className="w-full"
                    size="lg"
                  >
                    {allChecked ? (
                      <>
                        <Check className="h-5 w-5 mr-2" /> Preparação Concluída
                      </>
                    ) : (
                      'Complete para Desbloquear'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
