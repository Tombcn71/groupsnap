-- Fix infinite recursion in RLS policies for groups table

-- First, drop the problematic policy
DROP POLICY IF EXISTS "groups_select_own_or_member" ON public.groups;

-- Create a simpler, non-recursive policy for groups selection
CREATE POLICY "groups_select_simple" ON public.groups FOR SELECT 
  USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT gm.user_id 
      FROM public.group_members gm 
      WHERE gm.group_id = groups.id
    )
  );

-- Also fix the group_members policies to avoid recursion
DROP POLICY IF EXISTS "group_members_select_own_group" ON public.group_members;

CREATE POLICY "group_members_select_accessible" ON public.group_members FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    auth.uid() IN (
      SELECT g.owner_id 
      FROM public.groups g 
      WHERE g.id = group_id
    )
  );

-- Fix group_members insert policy to be simpler
DROP POLICY IF EXISTS "group_members_insert_own_group" ON public.group_members;

CREATE POLICY "group_members_insert_by_owner" ON public.group_members FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT g.owner_id 
      FROM public.groups g 
      WHERE g.id = group_id
    )
  );

-- Fix group_members update policy
DROP POLICY IF EXISTS "group_members_update_own_or_owner" ON public.group_members;

CREATE POLICY "group_members_update_accessible" ON public.group_members FOR UPDATE 
  USING (
    user_id = auth.uid() OR 
    auth.uid() IN (
      SELECT g.owner_id 
      FROM public.groups g 
      WHERE g.id = group_id
    )
  );

-- Fix group_members delete policy
DROP POLICY IF EXISTS "group_members_delete_own_group" ON public.group_members;

CREATE POLICY "group_members_delete_by_owner" ON public.group_members FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT g.owner_id 
      FROM public.groups g 
      WHERE g.id = group_id
    )
  );

-- Also fix the member_photos policies to avoid potential recursion
DROP POLICY IF EXISTS "member_photos_select_own_group" ON public.member_photos;

CREATE POLICY "member_photos_select_accessible" ON public.member_photos FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    auth.uid() IN (
      SELECT g.owner_id 
      FROM public.groups g 
      WHERE g.id = group_id
    ) OR
    auth.uid() IN (
      SELECT gm.user_id 
      FROM public.group_members gm 
      WHERE gm.group_id = group_id
    )
  );

-- Fix member_photos insert policy
DROP POLICY IF EXISTS "member_photos_insert_own" ON public.member_photos;

CREATE POLICY "member_photos_insert_member" ON public.member_photos FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND
    auth.uid() IN (
      SELECT gm.user_id 
      FROM public.group_members gm 
      WHERE gm.group_id = group_id
    )
  );
