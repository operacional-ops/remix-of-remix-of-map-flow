
ALTER TABLE public.operational_metrics
  ALTER COLUMN conv_funil TYPE numeric(14,4),
  ALTER COLUMN roas TYPE numeric(14,4),
  ALTER COLUMN margem TYPE numeric(14,4);
