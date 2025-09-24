-- Step 1: Drop all existing policies on group_memberships
DROP POLICY IF EXISTS "Users can view memberships of groups they can access" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can join public groups" ON public.group_memberships;
DROP POLICY IF EXISTS "Group members can leave" ON public.group_memberships;

-- Step 2: Recreate fixed policies to avoid infinite recursion

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

CREATE POLICY "Users can join public groups" ON public.group_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_memberships.group_id
      AND NOT groups.is_private
    )
  );

CREATE POLICY "Group members can leave" ON public.group_memberships
  FOR DELETE USING (user_id = auth.uid());

-- Step 3: Optionally disable and re-enable RLS to refresh policies
ALTER TABLE public.group_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- Step 4: Check for triggers or functions causing recursion (if any)
-- (User should check Supabase dashboard or provide info if needed)
