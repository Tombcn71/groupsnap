-- Fix RLS policies to allow join page uploads

-- Add display_name column first
ALTER TABLE public.member_photos 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create index for faster lookup  
CREATE INDEX IF NOT EXISTS idx_member_photos_display_name 
ON public.member_photos(group_id, display_name);

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "member_photos_insert_group_member" ON public.member_photos;

-- Create new policy that allows join page uploads
CREATE POLICY "member_photos_insert_anyone" ON public.member_photos FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and is group member
  (auth.uid() IS NOT NULL AND user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = member_photos.group_id AND user_id = auth.uid()
  )) OR
  -- Allow if user is group owner (for dashboard uploads)
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id AND owner_id = auth.uid()
  )) OR
  -- Allow join page uploads (no auth required, just valid group)
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id
  ))
);

-- Also update select policy to allow viewing uploaded photos
DROP POLICY IF EXISTS "member_photos_select_group_member" ON public.member_photos;

CREATE POLICY "member_photos_select_anyone_in_group" ON public.member_photos FOR SELECT 
USING (
  -- Allow if user is authenticated and part of group
  (auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = member_photos.group_id AND user_id = auth.uid()
    )
  )) OR
  -- Allow public viewing for valid groups (needed for join page to show count)
  (EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id
  ))
);
