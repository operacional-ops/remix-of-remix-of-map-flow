
-- Table to store per-user Facebook connections (access tokens + selected ad accounts)
CREATE TABLE public.facebook_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  fb_user_id TEXT NOT NULL,
  fb_user_name TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  selected_account_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.facebook_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own connections
CREATE POLICY "Users can view their own FB connections"
  ON public.facebook_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FB connections"
  ON public.facebook_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FB connections"
  ON public.facebook_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FB connections"
  ON public.facebook_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER update_facebook_connections_updated_at
  BEFORE UPDATE ON public.facebook_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
