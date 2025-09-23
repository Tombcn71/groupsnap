import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Camera, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user's groups
  const { data: groups } = await supabase
    .from("groups")
    .select(`
      *,
      group_members(count)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  // Get groups where user is a member
  const { data: memberGroups } = await supabase
    .from("group_members")
    .select(`
      *,
      groups(*)
    `)
    .eq("user_id", user.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "collecting":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "collecting":
        return <Users className="h-4 w-4" />
      case "processing":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Camera className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {profile?.full_name || user.email}</h1>
          <p className="text-muted-foreground">Manage your group photos and create new ones with AI</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Groups</CardTitle>
              <div className="text-2xl font-bold">{groups?.length || 0}</div>
            </CardHeader>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Photos</CardTitle>
              <div className="text-2xl font-bold">{groups?.filter((g) => g.status === "completed").length || 0}</div>
            </CardHeader>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              <div className="text-2xl font-bold">{groups?.filter((g) => g.status !== "completed").length || 0}</div>
            </CardHeader>
          </Card>
        </div>

        {/* My Groups Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">My Groups</h2>
            <CreateGroupDialog>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </CreateGroupDialog>
          </div>

          {groups && groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <Card key={group.id} className="border-border/50 hover:border-border transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {group.description || "No description"}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(group.status)}>
                        {getStatusIcon(group.status)}
                        <span className="ml-1 capitalize">{group.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Members</span>
                        <span>{group.group_members?.[0]?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Created</span>
                        <span>{new Date(group.created_at).toLocaleDateString()}</span>
                      </div>
                      <Link href={`/dashboard/groups/${group.id}`}>
                        <Button variant="outline" className="w-full bg-transparent">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Create your first group to start generating amazing AI-powered group photos
                </p>
                <CreateGroupDialog>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Group
                  </Button>
                </CreateGroupDialog>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Groups I'm In Section */}
        {memberGroups && memberGroups.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Groups I'm In</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memberGroups.map((membership) => {
                const group = membership.groups
                if (!group) return null

                return (
                  <Card key={group.id} className="border-border/50 hover:border-border transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {group.description || "No description"}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(group.status)}>
                          {getStatusIcon(group.status)}
                          <span className="ml-1 capitalize">{group.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>My Status</span>
                          <Badge variant="outline" className="capitalize">
                            {membership.status}
                          </Badge>
                        </div>
                        <Link href={`/dashboard/groups/${group.id}`}>
                          <Button variant="outline" className="w-full bg-transparent">
                            View Group
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
