-- FIRST: Create all missing tables before fixing RLS policies

-- Create member_photos table for individual user photos in groups
CREATE TABLE IF NOT EXISTS public.member_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_backgrounds table for background images
CREATE TABLE IF NOT EXISTS public.group_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_photos table for AI generated group photos
CREATE TABLE IF NOT EXISTS public.generated_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt_used TEXT,
  generation_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing joined_at column to group_members table if it doesn't exist
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_photos_group_id ON public.member_photos(group_id);
CREATE INDEX IF NOT EXISTS idx_member_photos_user_id ON public.member_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_group_backgrounds_group_id ON public.group_backgrounds(group_id);
CREATE INDEX IF NOT EXISTS idx_generated_photos_group_id ON public.generated_photos(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_joined_at ON public.group_members(joined_at);
