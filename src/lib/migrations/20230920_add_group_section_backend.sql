-- Migration script to create tables and constraints for the group section backend

-- Groups table (already exists, included here for completeness)
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Group memberships table (already exists, included here for completeness)
CREATE TABLE IF NOT EXISTS public.group_memberships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  group_id uuid,
  user_id uuid,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['member'::text, 'admin'::text])),
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT group_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT group_memberships_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Group messages table (already exists, included here for completeness)
CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  group_id uuid,
  user_id uuid,
  username text NOT NULL,
  message text,
  file_url text,
  file_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT group_messages_pkey PRIMARY KEY (id),
  CONSTRAINT group_messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Enable Row Level Security on group_memberships and group_messages
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Policies for group_memberships
DROP POLICY IF EXISTS "Users can view memberships of groups they can access" ON public.group_memberships;
CREATE POLICY "Users can view memberships of groups they can access" ON public.group_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_memberships.group_id
      AND (
        NOT groups.is_private OR
        groups.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.group_memberships gm
          WHERE gm.group_id = groups.id
          AND gm.user_id = auth.uid()
          AND gm.id != group_memberships.id
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can join public groups" ON public.group_memberships;
CREATE POLICY "Users can join public groups" ON public.group_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_memberships.group_id
      AND NOT groups.is_private
    )
  );

DROP POLICY IF EXISTS "Group members can leave" ON public.group_memberships;
CREATE POLICY "Group members can leave" ON public.group_memberships
  FOR DELETE USING (user_id = auth.uid());

-- Policies for group_messages
DROP POLICY IF EXISTS "Users can view messages of groups they belong to" ON public.group_messages;
CREATE POLICY "Users can view messages of groups they belong to" ON public.group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_memberships
      WHERE group_memberships.group_id = group_messages.group_id
      AND group_memberships.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add messages to groups they belong to" ON public.group_messages;
CREATE POLICY "Users can add messages to groups they belong to" ON public.group_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_memberships
      WHERE group_memberships.group_id = group_messages.group_id
      AND group_memberships.user_id = auth.uid()
    )
  );
