-- Add display_name column to member_photos for simple join link matching

-- Add display_name column
ALTER TABLE public.member_photos 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_member_photos_display_name 
ON public.member_photos(group_id, display_name);
