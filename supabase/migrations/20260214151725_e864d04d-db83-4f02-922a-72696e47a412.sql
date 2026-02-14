
-- Products table (each product like LITHIUM)
CREATE TABLE public.operational_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE
);

ALTER TABLE public.operational_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products" ON public.operational_products
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert products" ON public.operational_products
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update products" ON public.operational_products
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete products" ON public.operational_products
  FOR DELETE USING (auth.uid() = created_by);

-- Daily metrics table (mirrors the Airtable CSV columns)
CREATE TABLE public.operational_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.operational_products(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  contas_produto TEXT NOT NULL,
  status TEXT DEFAULT 'Testando',
  gastos NUMERIC(12,2) DEFAULT 0,
  cpm NUMERIC(12,2) DEFAULT 0,
  cpc NUMERIC(12,2) DEFAULT 0,
  conv_funil NUMERIC(8,4) DEFAULT 0,
  qnt_vendas INTEGER DEFAULT 0,
  ticket_medio NUMERIC(12,2) DEFAULT 0,
  cpa NUMERIC(12,2) DEFAULT 0,
  resultado NUMERIC(12,2) DEFAULT 0,
  lucro_bruto NUMERIC(12,2) DEFAULT 0,
  roas NUMERIC(8,2) DEFAULT 0,
  margem NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

ALTER TABLE public.operational_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view metrics" ON public.operational_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert metrics" ON public.operational_metrics
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update metrics" ON public.operational_metrics
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete metrics" ON public.operational_metrics
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_operational_products_updated_at
  BEFORE UPDATE ON public.operational_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
