-- Migration to fix group_memberships RLS policy to avoid infinite recursion

DROP POLICY IF EXISTS "Users can view memberships of groups they can access" ON group_memberships;

CREATE POLICY "Users can view memberships of groups they can access" ON group_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_memberships.group_id
      AND (
        NOT groups.is_private OR
        groups.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_memberships gm
          WHERE gm.group_id = groups.id
          AND gm.user_id = auth.uid()
          AND gm.id != group_memberships.id
        )
      )
    )
  );
