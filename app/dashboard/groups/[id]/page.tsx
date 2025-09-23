import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { GroupPageClient } from "@/components/group-page-client"

interface GroupPageProps {
  params: {
    id: string
  }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Get group details
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select(`
      *,
      profiles!groups_owner_id_fkey(full_name, email)
    `)
    .eq("id", params.id)
    .single()

  if (groupError || !group) {
    redirect("/dashboard")
  }

  // Check if user is owner or member
  const { data: membership } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", params.id)
    .eq("user_id", user.id)
    .single()

  const isOwner = group.owner_id === user.id
  const isMember = !!membership

  if (!isOwner && !isMember) {
    redirect("/dashboard")
  }

  // Get all group members with their photos
  const { data: members } = await supabase
    .from("group_members")
    .select(`
      *,
      profiles(full_name, email),
      member_photos(*)
    `)
    .eq("group_id", params.id)
    .order("created_at", { ascending: true })

  // Get background images
  const { data: backgrounds } = await supabase
    .from("group_backgrounds")
    .select("*")
    .eq("group_id", params.id)
    .order("created_at", { ascending: false })

  // Get generated photos
  const { data: generatedPhotos } = await supabase
    .from("generated_photos")
    .select("*")
    .eq("group_id", params.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <GroupPageClient
        user={user}
        group={group}
        members={members || []}
        backgrounds={backgrounds || []}
        generatedPhotos={generatedPhotos || []}
        isOwner={isOwner}
        isMember={isMember}
      />
    </div>
  )
}
