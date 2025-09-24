-- Supabase Schema for StudyConnect Groups and Communities

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (assuming it exists, but including for completeness)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  country TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group memberships table
CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group messages table
CREATE TABLE IF NOT EXISTS group_messages (
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
CREATE TABLE IF NOT EXISTS group_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_url TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community messages table
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  country TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gifts table for rewards system
CREATE TABLE IF NOT EXISTS gifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_resources_group_id ON group_resources(group_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_country ON community_messages(country);
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at DESC);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

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

-- Group memberships policies
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

-- Fix infinite recursion in group_memberships select policy by excluding self-reference
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

-- Community messages policies
CREATE POLICY "Anyone can view community messages" ON community_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post community messages" ON community_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Gifts policies
CREATE POLICY "Anyone can view gifts" ON gifts
  FOR SELECT USING (true);

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
