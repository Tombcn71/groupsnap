-- Fix member_photos table to work with both authenticated and unauthenticated users

-- Add email column and make user_id nullable
ALTER TABLE public.member_photos 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Make user_id nullable since join page users don't have user_id
ALTER TABLE public.member_photos 
ALTER COLUMN user_id DROP NOT NULL;

-- Update unique constraint to handle both scenarios
ALTER TABLE public.member_photos DROP CONSTRAINT IF EXISTS member_photos_group_id_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS member_photos_unique_per_group 
ON public.member_photos (group_id, COALESCE(user_id::text, email));

-- Add additional columns that upload API is trying to use
ALTER TABLE public.member_photos 
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Update RLS policies to work with email-based access
DROP POLICY IF EXISTS "member_photos_select_own_group" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_insert_own" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_update_own" ON public.member_photos;
DROP POLICY IF EXISTS "member_photos_delete_own" ON public.member_photos;

-- New policies that work with both user_id and email
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
    -- Allow if user is authenticated and is group member
    (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = member_photos.group_id AND user_id = auth.uid()
    )) OR
    -- Allow if user is group owner
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    ) OR
    -- Allow if email matches invited member (for join page uploads)
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

-- Show final schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'member_photos' AND table_schema = 'public'
ORDER BY ordinal_position;
