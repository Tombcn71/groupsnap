-- Debug: Check what data is actually being returned

-- Test 1: Check if groups table has data and is accessible
SELECT 
  id, 
  name, 
  owner_id, 
  status,
  created_at
FROM public.groups 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 2: Check current user's access
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- Test 3: Check group_members table
SELECT 
  id,
  group_id,
  user_id,
  email,
  status,
  created_at
FROM public.group_members 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 4: Check if RLS is causing issues - temporarily disable and test
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_backgrounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_photos DISABLE ROW LEVEL SECURITY;
