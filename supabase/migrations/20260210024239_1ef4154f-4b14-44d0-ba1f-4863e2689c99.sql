-- Remove duplicate workspace-level statuses, keeping the oldest of each name
DELETE FROM statuses
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY workspace_id, scope_type, name 
      ORDER BY created_at ASC
    ) as rn
    FROM statuses
    WHERE scope_type = 'workspace'
  ) sub
  WHERE rn > 1
);