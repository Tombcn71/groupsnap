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
  UNIQUE(group_id, email)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

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
    )
  );
CREATE POLICY "groups_insert_own" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "groups_update_own" ON public.groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "groups_delete_own" ON public.groups FOR DELETE USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "group_members_select_own_group" ON public.group_members FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );
CREATE POLICY "group_members_insert_own_group" ON public.group_members FOR INSERT 
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
CREATE POLICY "group_members_delete_own_group" ON public.group_members FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND owner_id = auth.uid()
    )
  );

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
