
-- Add file columns to documents table
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS file_type text,
  ADD COLUMN IF NOT EXISTS file_size bigint;

-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-uploads', 'document-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for document-uploads bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-uploads');

CREATE POLICY "Anyone can view document uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'document-uploads');

CREATE POLICY "Users can delete own document uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'document-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
