-- Fresh SQL Schema for StudyConnect Groups Section
-- This file contains all necessary tables, indexes, policies, and triggers for the groups functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Groups table
CREATE TABLE groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Group memberships table
CREATE TABLE group_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group messages table
CREATE TABLE group_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  message TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group resources table
CREATE TABLE group_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_url TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX idx_group_messages_created_at ON group_messages(created_at DESC);
CREATE INDEX idx_group_resources_group_id ON group_resources(group_id);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_resources ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view public groups" ON groups
  FOR SELECT USING (NOT is_private);

CREATE POLICY "Users can view groups they are members of" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_memberships.group_id = groups.id
      AND group_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Group creators and admins can update groups" ON groups
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_memberships.group_id = groups.id
      AND group_memberships.user_id = auth.uid()
      AND group_memberships.role = 'admin'
    )
  );

-- Group memberships policies (FIXED - no recursion)
CREATE POLICY "Users can view own memberships" ON group_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view memberships of accessible groups" ON group_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_memberships.group_id
      AND (
        NOT groups.is_private OR
        groups.created_by = auth.uid()
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

-- Group messages policies
CREATE POLICY "Users can view messages of groups they can access" ON group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_messages.group_id
      AND (
        NOT groups.is_private OR
        groups.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_memberships
          WHERE group_memberships.group_id = groups.id
          AND group_memberships.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Group members can send messages" ON group_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_memberships.group_id = group_messages.group_id
      AND group_memberships.user_id = auth.uid()
    )
  );

-- Group resources policies
CREATE POLICY "Users can view resources of groups they can access" ON group_resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_resources.group_id
      AND (
        NOT groups.is_private OR
        groups.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_memberships
          WHERE group_memberships.group_id = groups.id
          AND group_memberships.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Group members can upload resources" ON group_resources
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_memberships.group_id = group_resources.group_id
      AND group_memberships.user_id = auth.uid()
    )
  );

-- Functions and triggers

-- Function to automatically add creator as admin when creating a group
CREATE OR REPLACE FUNCTION add_group_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_memberships (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for adding creator as admin
CREATE TRIGGER add_creator_as_admin
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION add_group_creator_as_admin();

-- Raw SQL queries for common operations (commented out - use the API endpoints instead)

-- Create a new group
-- INSERT INTO groups (name, description, is_private, created_by)
-- VALUES ('Group Name', 'Group Description', false, 'user-uuid');

-- Get all groups (public and user's groups)
-- SELECT g.*, gm.role
-- FROM groups g
-- LEFT JOIN group_memberships gm ON g.id = gm.group_id AND gm.user_id = 'user-uuid'
-- WHERE NOT g.is_private OR gm.user_id IS NOT NULL
-- ORDER BY g.created_at DESC;

-- Join a group
-- INSERT INTO group_memberships (group_id, user_id, role)
-- VALUES ('group-uuid', 'user-uuid', 'member');

-- Leave a group
-- DELETE FROM group_memberships
-- WHERE group_id = 'group-uuid' AND user_id = 'user-uuid';

-- Get group members
-- SELECT gm.*, p.username, p.full_name
-- FROM group_memberships gm
-- JOIN profiles p ON gm.user_id = p.id
-- WHERE gm.group_id = 'group-uuid';

-- Send a message to a group
-- INSERT INTO group_messages (group_id, user_id, username, message)
-- VALUES ('group-uuid', 'user-uuid', 'username', 'Hello world!');

-- Get group messages
-- SELECT gm.*, p.username, p.full_name
-- FROM group_messages gm
-- JOIN profiles p ON gm.user_id = p.id
-- WHERE gm.group_id = 'group-uuid'
-- ORDER BY gm.created_at ASC;

-- Upload a resource to a group
-- INSERT INTO group_resources (group_id, uploaded_by, resource_url, description)
-- VALUES ('group-uuid', 'user-uuid', 'https://example.com/file.pdf', 'Study material');

-- Get group resources
-- SELECT gr.*, p.username
-- FROM group_resources gr
-- JOIN profiles p ON gr.uploaded_by = p.id
-- WHERE gr.group_id = 'group-uuid'
-- ORDER BY gr.uploaded_at DESC;

-- NOTE: Use the API endpoints instead of raw SQL queries:
-- - POST /api/groups (create group)
-- - GET /api/groups (list groups)
-- - POST /api/groups/[id]/join (join group)
-- - POST /api/groups/[id]/leave (leave group)
-- - GET /api/groups/[id]/members (get members)
-- - GET /api/groups/[id]/messages (get messages)
-- - POST /api/groups/[id]/messages (send message)
