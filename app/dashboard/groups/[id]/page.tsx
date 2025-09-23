import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Camera, Upload, Sparkles, AlertCircle, Check, X } from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { PhotoUploadSection } from "@/components/photo-upload-section"
import { BackgroundUploadSection } from "@/components/background-upload-section"
import { MemberPhotosGrid } from "@/components/member-photos-grid"
import { GeneratePhotoButton } from "@/components/generate-photo-button"
import { GeneratedPhotosSection } from "@/components/generated-photos-section"

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
    .order("joined_at", { ascending: true })

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

  const totalMembers = members?.length || 0
  const membersWithPhotos = members?.filter((m) => m.member_photos && m.member_photos.length > 0).length || 0
  const hasBackground = backgrounds && backgrounds.length > 0
  const canGenerate = membersWithPhotos >= 2 && hasBackground && group.status === "collecting"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Group Info */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{group.name}</h1>
              <p className="text-muted-foreground mb-4">{group.description || "No description"}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Created by {group.profiles?.full_name || group.profiles?.email}</span>
                <span>•</span>
                <span>{new Date(group.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Badge className={getStatusColor(group.status)}>
              <span className="capitalize">{group.status}</span>
            </Badge>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Members
              </CardTitle>
              <div className="text-2xl font-bold">{totalMembers}</div>
            </CardHeader>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Photos Uploaded
              </CardTitle>
              <div className="text-2xl font-bold">
                {membersWithPhotos}/{totalMembers}
              </div>
            </CardHeader>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Backgrounds
              </CardTitle>
              <div className="text-2xl font-bold">{backgrounds?.length || 0}</div>
            </CardHeader>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Generated
              </CardTitle>
              <div className="text-2xl font-bold">{generatedPhotos?.length || 0}</div>
            </CardHeader>
          </Card>
        </div>

        {/* Generate Photo Section */}
        {canGenerate && (
          <Card className="border-border/50 mb-8 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Sparkles className="h-6 w-6 mr-3 text-primary" />
                Ready to Generate Your Group Photo!
              </CardTitle>
              <CardDescription className="text-base">
                Perfect! You have {membersWithPhotos} member photos and {backgrounds?.length} background image(s). Our
                AI will create a stunning group photo by intelligently composing everyone into your chosen background.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">What happens next:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• AI analyzes each member's photo</li>
                      <li>• Matches lighting and perspective</li>
                      <li>• Composes everyone naturally in the background</li>
                      <li>• Creates a realistic group photo</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Generation details:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Members: {membersWithPhotos}</li>
                      <li>• Background: {backgrounds?.[0]?.name || "Selected scene"}</li>
                      <li>• Processing time: ~30-60 seconds</li>
                      <li>• High-resolution output</li>
                    </ul>
                  </div>
                </div>
                <GeneratePhotoButton groupId={params.id} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requirements Check */}
        {!canGenerate && (
          <Card className="border-border/50 mb-8 border-yellow-500/30 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Requirements for Generation
              </CardTitle>
              <CardDescription>Complete these steps to generate your group photo:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {membersWithPhotos >= 2 ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  <span className={membersWithPhotos >= 2 ? "text-green-600" : "text-muted-foreground"}>
                    At least 2 member photos ({membersWithPhotos}/{totalMembers} uploaded)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {hasBackground ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  <span className={hasBackground ? "text-green-600" : "text-muted-foreground"}>
                    Background image uploaded ({backgrounds?.length || 0} available)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {group.status === "collecting" ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  <span className={group.status === "collecting" ? "text-green-600" : "text-muted-foreground"}>
                    Group is in collecting phase
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Upload Section */}
        <div className="mb-8">
          <PhotoUploadSection
            groupId={params.id}
            userId={user.id}
            userPhoto={members?.find((m) => m.user_id === user.id)?.member_photos?.[0]}
          />
        </div>

        {/* Background Upload Section */}
        {isOwner && (
          <div className="mb-8">
            <BackgroundUploadSection groupId={params.id} backgrounds={backgrounds || []} />
          </div>
        )}

        {/* Member Photos Grid */}
        <div className="mb-8">
          <MemberPhotosGrid members={members || []} />
        </div>

        {/* Generated Photos */}
        <GeneratedPhotosSection generatedPhotos={generatedPhotos || []} groupName={group.name} />
      </main>
    </div>
  )
}
