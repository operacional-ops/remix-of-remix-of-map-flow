
-- Processes table (procedures/SOPs)
CREATE TABLE public.drx_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  content TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.drx_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage processes" ON public.drx_processes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Flowcharts table
CREATE TABLE public.drx_flowcharts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  flowchart_data JSONB NOT NULL DEFAULT '{}',
  metrics_data JSONB DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.drx_flowcharts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage flowcharts" ON public.drx_flowcharts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Decision logs table (used for all matrix types)
CREATE TABLE public.drx_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('funnel_optimization', 'delegation', 'daily_priorities')),
  title TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  options JSONB DEFAULT '[]',
  ai_analysis TEXT,
  decision TEXT,
  result TEXT,
  decided_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.drx_decision_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage decisions" ON public.drx_decision_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AI chat history for context
CREATE TABLE public.drx_ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type TEXT NOT NULL,
  context_id UUID,
  messages JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.drx_ai_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage ai chats" ON public.drx_ai_chats FOR ALL TO authenticated USING (true) WITH CHECK (true);
