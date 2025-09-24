-- Fix member_photos table schema step by step

-- Step 1: Add email column
ALTER TABLE public.member_photos 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Add missing columns
ALTER TABLE public.member_photos 
ADD COLUMN IF NOT EXISTS original_filename TEXT;

ALTER TABLE public.member_photos 
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Step 3: Make user_id nullable
ALTER TABLE public.member_photos 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Drop the old constraint
ALTER TABLE public.member_photos 
DROP CONSTRAINT IF EXISTS member_photos_group_id_user_id_key;

-- Step 5: Create new unique index
CREATE UNIQUE INDEX IF NOT EXISTS member_photos_unique_per_group 
ON public.member_photos (group_id, COALESCE(user_id::text, email));

-- Step 6: Update RLS policies
DROP POLICY IF EXISTS "member_photos_select_own_group" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_insert_own" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_update_own" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_delete_own" ON public.member_photos;

-- Step 7: Create new RLS policies
CREATE POLICY "member_photos_select_group_member" ON public.member_photos FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id AND owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = member_photos.group_id AND 
          (user_id = auth.uid() OR email = member_photos.email)
  )
);

CREATE POLICY "member_photos_insert_group_member" ON public.member_photos FOR INSERT 
WITH CHECK (
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = member_photos.group_id AND user_id = auth.uid()
  )) OR
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id AND owner_id = auth.uid()
  ) OR
  (email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = member_photos.group_id AND email = member_photos.email
  ))
);

CREATE POLICY "member_photos_update_own_or_owner" ON public.member_photos FOR UPDATE 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "member_photos_delete_own_or_owner" ON public.member_photos FOR DELETE 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id AND owner_id = auth.uid()
  )
);
