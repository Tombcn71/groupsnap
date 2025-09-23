-- Add missing tables for GroupSnap functionality

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

-- Add missing joined_at column to group_members table
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable Row Level Security for new tables
ALTER TABLE public.member_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_photos ENABLE ROW LEVEL SECURITY;

-- member_photos policies
CREATE POLICY "member_photos_select_own_group" ON public.member_photos FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = member_photos.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "member_photos_insert_own" ON public.member_photos FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = member_photos.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "member_photos_update_own" ON public.member_photos FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "member_photos_delete_own" ON public.member_photos FOR DELETE 
  USING (user_id = auth.uid());

-- group_backgrounds policies
CREATE POLICY "group_backgrounds_select_group_member" ON public.group_backgrounds FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_backgrounds.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "group_backgrounds_insert_owner" ON public.group_backgrounds FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "group_backgrounds_update_owner" ON public.group_backgrounds FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "group_backgrounds_delete_owner" ON public.group_backgrounds FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- generated_photos policies
CREATE POLICY "generated_photos_select_group_member" ON public.generated_photos FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = generated_photos.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "generated_photos_insert_owner" ON public.generated_photos FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "generated_photos_update_owner" ON public.generated_photos FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "generated_photos_delete_owner" ON public.generated_photos FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_photos_group_id ON public.member_photos(group_id);
CREATE INDEX IF NOT EXISTS idx_member_photos_user_id ON public.member_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_group_backgrounds_group_id ON public.group_backgrounds(group_id);
CREATE INDEX IF NOT EXISTS idx_generated_photos_group_id ON public.generated_photos(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_joined_at ON public.group_members(joined_at);
