-- SECOND: Fix RLS policies AFTER tables exist

-- === STEP 1: DISABLE RLS temporarily ===
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_backgrounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_photos DISABLE ROW LEVEL SECURITY;

-- === STEP 2: DROP ALL existing problematic policies ===
DROP POLICY IF EXISTS "groups_select_own_or_member" ON public.groups;
DROP POLICY IF EXISTS "groups_select_simple" ON public.groups;
DROP POLICY IF EXISTS "groups_insert_own" ON public.groups;
DROP POLICY IF EXISTS "groups_update_own" ON public.groups;
DROP POLICY IF EXISTS "groups_delete_own" ON public.groups;

DROP POLICY IF EXISTS "group_members_select_own_group" ON public.group_members;
DROP POLICY IF EXISTS "group_members_select_accessible" ON public.group_members;
DROP POLICY IF EXISTS "group_members_insert_own_group" ON public.group_members;
DROP POLICY IF EXISTS "group_members_insert_by_owner" ON public.group_members;
DROP POLICY IF EXISTS "group_members_update_own_or_owner" ON public.group_members;
DROP POLICY IF EXISTS "group_members_update_accessible" ON public.group_members;
DROP POLICY IF EXISTS "group_members_delete_own_group" ON public.group_members;
DROP POLICY IF EXISTS "group_members_delete_by_owner" ON public.group_members;

-- === STEP 3: CREATE SIMPLE, NON-RECURSIVE POLICIES ===

-- GROUPS table - simple owner-only policies (NO RECURSION)
CREATE POLICY "groups_select_owner_only" ON public.groups FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "groups_insert_authenticated" ON public.groups FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "groups_update_owner_only" ON public.groups FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "groups_delete_owner_only" ON public.groups FOR DELETE 
  USING (auth.uid() = owner_id);

-- GROUP_MEMBERS table - simple policies (NO RECURSION)
CREATE POLICY "group_members_select_own" ON public.group_members FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "group_members_insert_any" ON public.group_members FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "group_members_update_own" ON public.group_members FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "group_members_delete_any" ON public.group_members FOR DELETE 
  USING (true);

-- MEMBER_PHOTOS table - simple policies
CREATE POLICY "member_photos_select_own" ON public.member_photos FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "member_photos_insert_own" ON public.member_photos FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "member_photos_update_own" ON public.member_photos FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "member_photos_delete_own" ON public.member_photos FOR DELETE 
  USING (user_id = auth.uid());

-- GROUP_BACKGROUNDS table - allow access for now
CREATE POLICY "group_backgrounds_select_any" ON public.group_backgrounds FOR SELECT 
  USING (true);

CREATE POLICY "group_backgrounds_insert_any" ON public.group_backgrounds FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "group_backgrounds_update_any" ON public.group_backgrounds FOR UPDATE 
  USING (true);

CREATE POLICY "group_backgrounds_delete_any" ON public.group_backgrounds FOR DELETE 
  USING (true);

-- GENERATED_PHOTOS table - allow access for now
CREATE POLICY "generated_photos_select_any" ON public.generated_photos FOR SELECT 
  USING (true);

CREATE POLICY "generated_photos_insert_any" ON public.generated_photos FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "generated_photos_update_any" ON public.generated_photos FOR UPDATE 
  USING (true);

CREATE POLICY "generated_photos_delete_any" ON public.generated_photos FOR DELETE 
  USING (true);

-- === STEP 4: RE-ENABLE RLS ===
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_photos ENABLE ROW LEVEL SECURITY;
