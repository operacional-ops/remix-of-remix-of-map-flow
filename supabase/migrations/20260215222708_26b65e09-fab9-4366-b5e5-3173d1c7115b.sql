
-- Auto-assign new users as limited_member in the default workspace
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_ws_id uuid := '1dc2a772-4acc-4a12-a86f-21ac77471460';
BEGIN
  -- Only add if user is not already a member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (default_ws_id, NEW.id, 'limited_member')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created_workspace_role ON public.profiles;

-- Fire after profile is created (which happens after auth.users insert via existing trigger)
CREATE TRIGGER on_auth_user_created_workspace_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_workspace_role();
