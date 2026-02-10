-- 1. Remover trigger duplicado
DROP TRIGGER IF EXISTS on_workspace_created_create_default_statuses ON public.workspaces;

-- 2. Remover statuses duplicados (manter o mais antigo de cada nome/workspace/scope)
DELETE FROM statuses
WHERE id NOT IN (
  SELECT DISTINCT ON (workspace_id, name, scope_type, scope_id)
    id
  FROM statuses
  ORDER BY workspace_id, name, scope_type, scope_id, created_at ASC
);