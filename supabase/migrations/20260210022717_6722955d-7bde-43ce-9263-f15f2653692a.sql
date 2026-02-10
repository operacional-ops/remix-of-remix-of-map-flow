
-- 1. Recriar trigger handle_new_user em auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Criar profile para usuario existente
INSERT INTO profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);

-- 3. Separar trigger do workspace
CREATE OR REPLACE FUNCTION public.set_workspace_creator()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  NEW.created_by_user_id := auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_workspace_creator_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;

CREATE TRIGGER on_workspace_before_insert
  BEFORE INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION set_workspace_creator();

CREATE TRIGGER on_workspace_after_insert
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION add_workspace_creator_member();
