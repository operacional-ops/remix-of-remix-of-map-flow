
-- LIVRO CAIXA (Cash Book)
CREATE TABLE public.financial_cashbook (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAÍDA')),
  nivel1 TEXT NOT NULL,
  nivel2 TEXT,
  historico TEXT,
  valor NUMERIC(15,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  banco_cartao TEXT,
  saldo_acumulado NUMERIC(15,2),
  observacoes TEXT,
  workspace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.financial_cashbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only operacional user can manage cashbook"
ON public.financial_cashbook FOR ALL
USING (auth.uid() = 'ebf8bfe5-490d-40ae-a6cd-a37ed430f069'::uuid)
WITH CHECK (auth.uid() = 'ebf8bfe5-490d-40ae-a6cd-a37ed430f069'::uuid);

-- CONTAS A PAGAR (Payables)
CREATE TABLE public.financial_payables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vencimento DATE NOT NULL,
  dias_vencer INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  nivel1 TEXT NOT NULL,
  nivel2 TEXT,
  fornecedor TEXT,
  historico TEXT,
  valor NUMERIC(15,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  banco_cartao TEXT,
  observacoes TEXT,
  workspace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.financial_payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only operacional user can manage payables"
ON public.financial_payables FOR ALL
USING (auth.uid() = 'ebf8bfe5-490d-40ae-a6cd-a37ed430f069'::uuid)
WITH CHECK (auth.uid() = 'ebf8bfe5-490d-40ae-a6cd-a37ed430f069'::uuid);

-- ORÇAMENTO MENSAL (Monthly Budget)
CREATE TABLE public.financial_budget (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT,
  nivel1 TEXT NOT NULL,
  nivel2 TEXT,
  jan NUMERIC(15,2) DEFAULT 0,
  fev NUMERIC(15,2) DEFAULT 0,
  mar NUMERIC(15,2) DEFAULT 0,
  abr NUMERIC(15,2) DEFAULT 0,
  mai NUMERIC(15,2) DEFAULT 0,
  jun NUMERIC(15,2) DEFAULT 0,
  jul NUMERIC(15,2) DEFAULT 0,
  ago NUMERIC(15,2) DEFAULT 0,
  "set" NUMERIC(15,2) DEFAULT 0,
  "out" NUMERIC(15,2) DEFAULT 0,
  nov NUMERIC(15,2) DEFAULT 0,
  dez NUMERIC(15,2) DEFAULT 0,
  total_anual NUMERIC(15,2) DEFAULT 0,
  workspace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.financial_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only operacional user can manage budget"
ON public.financial_budget FOR ALL
USING (auth.uid() = 'ebf8bfe5-490d-40ae-a6cd-a37ed430f069'::uuid)
WITH CHECK (auth.uid() = 'ebf8bfe5-490d-40ae-a6cd-a37ed430f069'::uuid);

-- CSV UPLOADS TRACKING
CREATE TABLE public.financial_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  sheet_type TEXT NOT NULL,
  rows_imported INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.financial_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only operacional user can manage uploads"
ON public.financial_uploads FOR ALL
USING (auth.uid() = 'ebf8bfe5-490d-40ae-a6cd-a37ed430f069'::uuid)
WITH CHECK (auth.uid() = 'ebf8bfe5-490d-40ae-a6cd-a37ed430f069'::uuid);
