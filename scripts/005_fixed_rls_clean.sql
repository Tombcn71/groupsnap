-- CORRECTED COMPLETE FIX for infinite recursion in RLS policies
-- Fixed syntax errors with proper quote termination

-- === STEP 1: DISABLE RLS temporarily ===
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_backgrounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_photos DISABLE ROW LEVEL SECURITY;

-- === STEP 2: DROP ALL existing policies (corrected syntax) ===
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

DROP POLICY IF EXISTS "member_photos_select_own_group" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_select_accessible" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_insert_own" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_insert_member" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_update_own" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_delete_own" ON public.member_photos;

DROP POLICY IF EXISTS "group_backgrounds_select_group_member" ON public.group_backgrounds;
DROP POLICY IF EXISTS "group_backgrounds_insert_owner" ON public.group_backgrounds;
DROP POLICY IF EXISTS "group_backgrounds_update_owner" ON public.group_backgrounds;
DROP POLICY IF EXISTS "group_backgrounds_delete_owner" ON public.group_backgrounds;

DROP POLICY IF EXISTS "generated_photos_select_group_member" ON public.generated_photos;
DROP POLICY IF EXISTS "generated_photos_insert_owner" ON public.generated_photos;
DROP POLICY IF EXISTS "generated_photos_update_owner" ON public.generated_photos;
DROP POLICY IF EXISTS "generated_photos_delete_owner" ON public.generated_photos;
