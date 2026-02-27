// Dados fixos da equipe DRX - Team Data, Role Details e Checklists

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'board' | 'team';
  avatar: string;
  color: string;
  isDirector: boolean;
}

export interface RoleDetail {
  mission: string;
  nonNegotiables: string[];
  limits: string[];
  decisions: string[];
  behavior: string[];
}

export const TEAM_DATA: TeamMember[] = [
  // --- DIRETORIA / BOARD ---
  { id: 'danillo', name: 'Ailton Danillo', role: 'Diretor de Operações (COO)', category: 'board', avatar: 'AD', color: 'bg-blue-600', isDirector: true },
  { id: 'arthur', name: 'Arthur', role: 'Head de Estratégia', category: 'board', avatar: 'AR', color: 'bg-purple-600', isDirector: true },
  { id: 'brandon', name: 'Brandon', role: 'CEO / Expansão', category: 'board', avatar: 'BR', color: 'bg-indigo-600', isDirector: true },
  { id: 'andre', name: 'Andre', role: 'Diretor Financeiro (CFO)', category: 'board', avatar: 'AN', color: 'bg-emerald-700', isDirector: true },
  
  { id: 'lucas', name: 'Lucas Rosário', role: 'Diretor de Tráfego', category: 'board', avatar: 'LR', color: 'bg-orange-600', isDirector: true },

  // --- TIME TÁTICO / OPERACIONAL ---
  { id: 'impactize', name: 'Impactize (Editor VSL)', role: 'Edição de VSL & Criativos', category: 'team', avatar: 'IM', color: 'bg-red-600', isDirector: false },
  { id: 'gabriel', name: 'Gabriel Gomes', role: 'Copywriter Pleno', category: 'team', avatar: 'GG', color: 'bg-pink-500', isDirector: false },
  
  { id: 'felipe', name: 'Felipe Origuela', role: 'Filmmaker Sênior', category: 'team', avatar: 'FO', color: 'bg-yellow-600', isDirector: false },
  { id: 'victor', name: 'Victor Navega', role: 'Editor de Vídeos', category: 'team', avatar: 'VN', color: 'bg-teal-500', isDirector: false },
  { id: 'bruno', name: 'Bruno Brittes', role: 'Social Media', category: 'team', avatar: 'BB', color: 'bg-fuchsia-500', isDirector: false },
  { id: 'evelin', name: 'Evelin', role: 'Facilities & Apoio', category: 'team', avatar: 'EV', color: 'bg-lime-600', isDirector: false },
  { id: 'caio', name: 'Caio Rangel', role: 'Operador de Infraestrutura Pleno', category: 'team', avatar: 'CR', color: 'bg-indigo-500', isDirector: false },
  { id: 'joao', name: 'João Victor Boaventura', role: 'Trainee', category: 'team', avatar: 'JV', color: 'bg-cyan-500', isDirector: false },
];

export const ROLE_DETAILS: Record<string, RoleDetail> = {
  danillo: {
    mission: "Garantir que os funis funcionem sem falhas, com estabilidade operacional, SLA cumprido e risco controlado.",
    nonNegotiables: ["Manter bom relacionamento de toda equipe.", "Manter comunicação alinhada entre tríade (Copy - Tráfego - Edição).", "Resolver gargalos operacionais com rapidez.", "Monitorar riscos operacionais (Toda Infra de Pé).", "Documentar incidentes e correções."],
    limits: ["Não decide estratégia de funil.", "Não muda promessa ou copy.", "Não altera orçamento.", "Não prioriza testes.", "Não negocia com experts."],
    decisions: ["Ajustes técnicos e operacionais.", "Pausar funil por risco operacional.", "Priorizar correções emergenciais.", "Definir rotinas operacionais."],
    behavior: ["Antecipar riscos.", "Resolver sem criar ruído.", "Manter disciplina operacional."],
  },
  arthur: {
    mission: "Ser dono do resultado econômico dos funis, definindo estratégia, prioridade e alocação de capital para maximizar crescimento.",
    nonNegotiables: ["Decidir o que nasce, o que escala e o que morre.", "Priorizar funis e testes semanalmente.", "Alocar budget por funil.", "Orquestrar Copy, Tráfego e Operações sem executar tarefas."],
    limits: ["Não escreve copy.", "Não sobe/otimiza campanhas.", "Não resolve problemas operacionais.", "Não negocia com experts/parceiros.", "Não microgerencia execução."],
    decisions: ["Criar/encerrar funil.", "Escalar/pausar funil por performance.", "Definir prioridades da semana.", "Redirecionar budget entre funis."],
    behavior: ["Trazer resultado interno para empresa.", "Definir prioridades semanais do time.", "Tomar as decisões estratégicas com base em dados."],
  },
  brandon: {
    mission: "Maximizar o valor da empresa no médio e longo prazo, garantindo expansão estratégica e relações externas sólidas.",
    nonNegotiables: ["Conduzir relacionamento com experts e parceiros.", "Liderar negociações externas.", "Buscar novas oportunidades de funis.", "Garantir governança entre estratégia, operação e expansão."],
    limits: ["Não define promessa, mecanismo ou ICP.", "Não decide criar, escalar ou matar funil.", "Não altera estratégia de tráfego ou copy.", "Não interfere na operação diária."],
    decisions: ["Escolha e negociação com experts.", "Definição de acordos comerciais.", "Posicionamento institucional.", "Iniciativas de expansão."],
    behavior: ["Pensar em empresa vendável.", "Proteger a operação de interferências externas.", "Canalizar demandas externas para o Núcleo Estratégico."],
  },
  andre: {
    mission: "Garantir clareza financeira, controle de caixa e previsibilidade econômica.",
    nonNegotiables: ["Manter fluxo de caixa atualizado (DFC).", "Garantir liquidez mínima de segurança.", "Construir DRE gerencial semanal.", "Identificar pontos de prejuízo."],
    limits: ["Não escala investimento em tráfego sozinho.", "Não bloqueia estratégia sem alinhamento.", "Não redireciona capital entre funis por conta própria."],
    decisions: ["Priorizar pagamentos dentro do orçamento.", "Sugerir redução de custos.", "Alertar necessidade de pausa por risco de caixa."],
    behavior: ["Financeiro alerta. Estratégia decide.", "Nenhuma decisão estratégica relevante acontece sem visibilidade financeira."],
  },
  lucas: {
    mission: "Maximizar o retorno sobre o investimento (ROAS) através da gestão técnica de mídia paga.",
    nonNegotiables: ["Subir, testar e otimizar campanhas.", "Executar os testes definidos pela estratégia.", "Garantir controle de CAC, ROAS e spend.", "Gerar relatórios claros."],
    limits: ["Não altera a copy sem aval.", "Não define a oferta macro (papel da estratégia)."],
    decisions: ["Estrutura de campanhas.", "Alocação de budget dentro do funil ativo.", "Pausa técnica de criativos ou campanhas."],
    behavior: ["Agir com dados, não com opinião.", "Executar rápido e documentar.", "Priorizar eficiência sobre ego."],
  },
  impactize: {
    mission: "Transformar o roteiro de vendas (Copy) em uma experiência visual hipnótica e persuasiva.",
    nonNegotiables: ["Produzir vídeos de vendas seguindo rigorosamente o script.", "Narrativa Visual (B-rolls corretos).", "Sound Design que conduza a emoção.", "Cumprimento de Prazos (Deadline).", "Revisão 100% antes da entrega."],
    limits: ["Não altera o texto da Copy.", "Não muda o Briefing (ex: trocar tensão por alegria)."],
    decisions: ["Escolha criativa das cenas.", "Estilo das transições e tipografia.", "Ajustes de áudio (mixagem).", "Sugerir mudanças visuais se o roteiro estiver lento."],
    behavior: ["Visão de Vendas (vídeo é conversão).", "Sempre entregar material revisado.", "Sigilo Absoluto dos materiais."],
  },
  gabriel: {
    mission: "Garantir a tração e a escala das ofertas através dos seus ativos de copy.",
    nonNegotiables: ["Produção semanal de ativos de copy.", "Estudo de Público e Pesquisa.", "Espionagem de Mercado (novas ofertas).", "Revisão final dos materiais."],
    limits: ["Não define o que fazer (segue demanda).", "Não sobe campanhas no gerenciador."],
    decisions: ["O 'como' criar cada ativo (liberdade criativa no texto)."],
    behavior: ["Coragem criativa para testar ideias.", "Feedback constante para melhorias.", "Resiliência Criativa (testes falham, continue)."],
  },
  felipe: {
    mission: "Elevar o padrão visual da DRX e dos Experts através de produções cinematográficas.",
    nonNegotiables: ["Captação e Edição de Conteúdo Expert.", "Gestão e manutenção de Equipamentos.", "Direção de Fotografia em gravações.", "Backup e Organização do acervo (RAW)."],
    limits: ["NÃO edita VSLs (Função da Impactize).", "NÃO interfere na estratégia de VSL.", "Não assume demanda de volume (Reels diários)."],
    decisions: ["Direção de Cena (parar se luz/som estiver ruim).", "Definir Color Grading e identidade visual.", "Veto Técnico de material ruim."],
    behavior: ["Olhar Cinematográfico.", "Disponibilidade Técnica para captações complexas.", "Guardião da memória da empresa (arquivos)."],
  },
  victor: {
    mission: "Materializar a estratégia orgânica em vídeos de alta retenção e qualidade.",
    nonNegotiables: ["Monitorar calendário orgânico diariamente.", "Executar edição completa (cortes, legendas, cor).", "Reportar problemas técnicos.", "Garantir organização no Drive."],
    limits: ["Não altera estratégia de conteúdo.", "Não aprova o próprio vídeo (função do Brandon).", "Não posta conteúdo final."],
    decisions: ["Escolha de trilhas e ritmo.", "Sugestão de ideias criativas.", "Sinalização de impedimentos."],
    behavior: ["Agilidade sem perder qualidade.", "Proatividade ao buscar referências.", "Resiliência para revisões."],
  },
  bruno: {
    mission: "Gerenciar e fortalecer a presença digital institucional, criando autoridade e desejo.",
    nonNegotiables: ["Gestão de Perfis diária.", "Planejamento de Conteúdo e Calendário.", "Social Selling (Responder Directs).", "Agendamento e Postagem correta."],
    limits: ["Não interfere nas VSLs ou Copy de Vendas.", "Não altera tom de voz sem validação.", "Não faz gestão de Tráfego Pago."],
    decisions: ["Escolha de áudios (Trends).", "Respostas de rotina.", "Sugestão de pautas (Newsjacking)."],
    behavior: ["Guardião da Marca (autenticidade).", "Agilidade (tempo real).", "Ponte com a Edição."],
  },
  evelin: {
    mission: "Garantir a fluidez operacional do escritório e da rotina dos sócios.",
    nonNegotiables: ["Gestão de Agenda (Sócios).", "Execução de Pagamentos (Cartão Corporativo).", "Facilities (Limpeza, Insumos).", "Prestação de Contas imediata (comprovantes)."],
    limits: ["Não gasta sem 'OK' do Financeiro.", "Não excede Teto Diário.", "Não empresta o cartão.", "Não negocia grandes contratos."],
    decisions: ["Solicitar Ubers para convidados.", "Compra de insumos de recorrência.", "Acionar manutenção de urgência."],
    behavior: ["Disciplina Financeira (justificar cada centavo).", "Agilidade com Comprovantes.", "Discrição e Sigilo."],
  },
  caio: {
    mission: "Garantir toda infraestrutura da operação.",
    nonNegotiables: ["Infraestrutura Web: Configuração e gestão de domínios, DNS (Cloudflare), hospedagem e servidores.", "Rastreamento (Tracking): Pixels, API de Conversão (CAPI), GTM e UTMs.", "Soluções Próprias: Desenvolvimento e otimização de soluções internas.", "Checkouts & Funis: Criar, configurar e otimizar checkouts e funis de upsell.", "Funis de Recuperação: SMS, WhatsApp e Email.", "VSL & Teste A/B: Configurar VSL na Vturb e testes A/B."],
    limits: ["Não define orçamento (proxies, domínios).", "Não cria copy (sobe a página, não cria layout/texto).", "Não negocia com gateways (exceto técnico/integração)."],
    decisions: ["Solicitação de compra de ativos de infraestrutura.", "Escolha técnica de implementação.", "Troca de servidor/hospedagem em emergência."],
    behavior: ["Mindset Preventivo: check-up em todos funis.", "Organização Extrema: acessos e mapas de pixels impecáveis.", "Agilidade na Crise: prioridade zero é colocar de volta no ar.", "Comunicação Técnica Simples: traduzir problemas técnicos para linguagem de negócio."],
  },
  joao: {
    mission: "Aprender e absorver os processos da operação, apoiando o time nas demandas diárias.",
    nonNegotiables: ["Cumprir as tarefas atribuídas com pontualidade.", "Estudar os processos e ferramentas da operação.", "Reportar dúvidas e bloqueios ao supervisor."],
    limits: ["Não toma decisões sem aprovação.", "Não altera processos existentes.", "Não acessa sistemas críticos sem supervisão."],
    decisions: ["Organização das próprias tarefas do dia.", "Sugerir melhorias observadas nos processos."],
    behavior: ["Proatividade para aprender.", "Humildade para pedir ajuda.", "Disciplina com prazos e entregas."],
  },
};

export const CHECKLISTS: Record<string, string[]> = {
  default: ["Organizar ambiente de trabalho", "Checar agenda do dia", "Definir prioridade única"],
  impactize: ["Ler Briefing/Roteiro do Marcos com atenção", "Garantir Narrativa Visual (B-rolls corretos)", "Revisão 100% de erros antes da entrega", "Validar prazo para não travar tráfego"],
  gabriel: ["Checar demandas do Marcos (Diretor)", "Estudar referências/público (15min)", "Revisar ativos de copy pendentes", "Blindar agenda para escrita focada"],
  
  felipe: ["Checar equipamentos (Bateria/Cartão)", "Organizar backup de arquivos brutos (RAW)", "Alinhar demandas com Victor Navega", "Verificar agenda de gravações institucionais"],
  victor: ["Baixar arquivos brutos do Drive/Social", "Verificar calendário de postagens com Bruno", "Organizar pastas de projetos", "Reportar problemas técnicos ao Danillo"],
  bruno: ["Responder Directs (Social Selling)", "Verificar aprovações pendentes com Brandon", "Postar Sequência de Bom Dia (Stories)", "Checar entrega dos posts agendados"],
  evelin: ["Checar agenda dos Sócios (Conflitos?)", "Conciliação bancária do dia anterior", "Verificar insumos do escritório", "Enviar comprovantes pendentes ao Andre"],
  
  lucas: ["Check de Spend diário", "Análise de ROAS matinal", "Alertas de campanhas"],
  andre: ["Verificar Saldo/Caixa", "Validar pagamentos do dia", "Atualizar DFC"],
  danillo: ["Verificar estabilidade dos sistemas", "Checar reports de risco", "Alinhar prioridades com Arthur"],
  arthur: ["Revisar performance macro (Ontem)", "Ajustar prioridades de teste", "Validar budget diário"],
  brandon: ["Verificar agenda externa", "Checar métricas de expansão", "Alinhar com parceiros chave"],
  caio: ["Check-up de estabilidade de todos os funis", "Verificar status de domínios e DNS", "Checar rastreamento (Pixels/CAPI/GTM)", "Verificar checkouts e funis de recuperação"],
  joao: ["Checar tarefas atribuídas para o dia", "Estudar processos e documentação (30min)", "Acompanhar demandas do supervisor", "Reportar progresso e dúvidas ao time"],
};

export function getTeamMember(id: string): TeamMember | undefined {
  return TEAM_DATA.find(m => m.id === id);
}

export function getBoardMembers(): TeamMember[] {
  return TEAM_DATA.filter(m => m.category === 'board');
}

export function getOperationalTeam(): TeamMember[] {
  return TEAM_DATA.filter(m => m.category === 'team');
}
