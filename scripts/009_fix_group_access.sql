-- Fix RLS policies so group owners can see their group members and data

-- === FIX GROUP_MEMBERS POLICIES ===
DROP POLICY IF EXISTS "group_members_select_own" ON public.group_members;

-- Allow both: users to see their own memberships AND group owners to see all members
CREATE POLICY "group_members_select_own_or_owner" ON public.group_members FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    group_id IN (
      SELECT id FROM public.groups WHERE owner_id = auth.uid()
    )
  );

-- === FIX MEMBER_PHOTOS POLICIES ===
DROP POLICY IF EXISTS "member_photos_select_own" ON public.member_photos;

-- Allow users to see their own photos AND group owners to see all photos in their groups
CREATE POLICY "member_photos_select_own_or_group_owner" ON public.member_photos FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    group_id IN (
      SELECT id FROM public.groups WHERE owner_id = auth.uid()
    )
  );

-- === FIX GROUP_BACKGROUNDS POLICIES ===
-- Group owners and members should see backgrounds
DROP POLICY IF EXISTS "group_backgrounds_select_any" ON public.group_backgrounds;

CREATE POLICY "group_backgrounds_select_group_access" ON public.group_backgrounds FOR SELECT 
  USING (
    group_id IN (
      SELECT id FROM public.groups WHERE owner_id = auth.uid()
    ) OR
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

-- === FIX GENERATED_PHOTOS POLICIES ===
-- Group owners and members should see generated photos
DROP POLICY IF EXISTS "generated_photos_select_any" ON public.generated_photos;

CREATE POLICY "generated_photos_select_group_access" ON public.generated_photos FOR SELECT 
  USING (
    group_id IN (
      SELECT id FROM public.groups WHERE owner_id = auth.uid()
    ) OR
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );
