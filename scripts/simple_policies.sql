-- Enable RLS and create simple policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_photos ENABLE ROW LEVEL SECURITY;

-- Simple policies that allow everything for now
CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_group_members" ON public.group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_member_photos" ON public.member_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_group_backgrounds" ON public.group_backgrounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_generated_photos" ON public.generated_photos FOR ALL USING (true) WITH CHECK (true);
