-- Complete database setup for GroupSnap
-- Run this script to create all required tables and policies

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table for photo groups
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  background_image_url TEXT,
  status TEXT DEFAULT 'collecting' CHECK (status IN ('collecting', 'processing', 'completed')),
  generated_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table for group membership
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'uploaded', 'confirmed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, email)
);

-- Create member_photos table for individual user photos in groups
CREATE TABLE IF NOT EXISTS public.member_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  image_url TEXT NOT NULL,
  original_filename TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_photos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Groups policies
CREATE POLICY "groups_select_own_or_member" ON public.groups FOR SELECT 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id AND user_id = auth.uid()
    ) OR
    true -- Allow public viewing for join links
  );
CREATE POLICY "groups_insert_own" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "groups_update_own" ON public.groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "groups_delete_own" ON public.groups FOR DELETE USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "group_members_select_public" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert_owner" ON public.group_members FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );
CREATE POLICY "group_members_update_own_or_owner" ON public.group_members FOR UPDATE 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );
CREATE POLICY "group_members_delete_owner" ON public.group_members FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- Member photos policies (allow join page uploads)
CREATE POLICY "member_photos_select_public" ON public.member_photos FOR SELECT USING (true);
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
  (EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id
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

-- Group backgrounds policies
CREATE POLICY "group_backgrounds_select_public" ON public.group_backgrounds FOR SELECT USING (true);
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

-- Generated photos policies
CREATE POLICY "generated_photos_select_public" ON public.generated_photos FOR SELECT USING (true);
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
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_invited_at ON public.group_members(invited_at);
CREATE INDEX IF NOT EXISTS idx_member_photos_group_id ON public.member_photos(group_id);
CREATE INDEX IF NOT EXISTS idx_member_photos_user_id ON public.member_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_member_photos_display_name ON public.member_photos(group_id, display_name);
CREATE INDEX IF NOT EXISTS idx_group_backgrounds_group_id ON public.group_backgrounds(group_id);
CREATE INDEX IF NOT EXISTS idx_generated_photos_group_id ON public.generated_photos(group_id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', null)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
