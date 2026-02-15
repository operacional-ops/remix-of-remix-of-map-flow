
-- Create table for raw PAYT transaction data
CREATE TABLE public.payt_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id),
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  product_name TEXT,
  product_code TEXT,
  payment_method TEXT,
  amount NUMERIC(14,4) NOT NULL DEFAULT 0,
  commission NUMERIC(14,4) DEFAULT 0,
  net_amount NUMERIC(14,4) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payt_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies - workspace members can read
CREATE POLICY "Workspace members can view PAYT transactions"
ON public.payt_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = payt_transactions.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Service role can insert (from edge function)
CREATE POLICY "Service role can insert PAYT transactions"
ON public.payt_transactions
FOR INSERT
WITH CHECK (true);

-- Service role can update
CREATE POLICY "Service role can update PAYT transactions"
ON public.payt_transactions
FOR UPDATE
USING (true);

-- Index for performance
CREATE INDEX idx_payt_transactions_workspace ON public.payt_transactions(workspace_id);
CREATE INDEX idx_payt_transactions_status ON public.payt_transactions(status);
CREATE INDEX idx_payt_transactions_paid_at ON public.payt_transactions(paid_at);
CREATE INDEX idx_payt_transactions_transaction_id ON public.payt_transactions(transaction_id);

-- Trigger for updated_at
CREATE TRIGGER update_payt_transactions_updated_at
BEFORE UPDATE ON public.payt_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payt_transactions;
