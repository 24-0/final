-- Migration script to create group_memberships table and related triggers/policies

CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

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
        )
      )
    )
  );

CREATE POLICY "Users can join public groups" ON group_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_memberships.group_id
      AND NOT groups.is_private
    )
  );

CREATE POLICY "Group members can leave" ON group_memberships
  FOR DELETE USING (user_id = auth.uid());
