"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Camera, Upload, Sparkles, AlertCircle, Check, X, UserPlus } from "lucide-react"
import Link from "next/link"
import { PhotoUploadSection } from "@/components/photo-upload-section"
import { BackgroundUploadSection } from "@/components/background-upload-section"
import { MemberPhotosGrid } from "@/components/member-photos-grid"
import { GeneratePhotoButton } from "@/components/generate-photo-button"
import { GeneratedPhotosSection } from "@/components/generated-photos-section"
import { InviteMembersDialog } from "@/components/invite-members-dialog"

interface GroupPageClientProps {
  user: any
  group: any
  members: any[]
  backgrounds: any[]
  generatedPhotos: any[]
  isOwner: boolean
  isMember: boolean
}

export function GroupPageClient({ 
  user, 
  group, 
  members, 
  backgrounds, 
  generatedPhotos, 
  isOwner, 
  isMember 
}: GroupPageClientProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "collecting":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
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
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          {/* Invite Members Button - Only for owners */}
          {isOwner && group.status === "collecting" && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Members
            </Button>
          )}
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
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
              <p className="text-sm text-muted-foreground">Total invited</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{membersWithPhotos}</div>
              <p className="text-sm text-muted-foreground">Members with photos</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Backgrounds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{backgrounds?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Background images</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generatedPhotos?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Group photos</p>
            </CardContent>
          </Card>
        </div>

        {/* Generation Requirements */}
        {group.status === "collecting" && (
          <Card className="mb-8 border-amber-200/50 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/50">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-5 w-5 mr-2" />
                Generation Requirements
              </CardTitle>
              <CardDescription className="text-amber-600 dark:text-amber-400">
                Complete these requirements to generate your group photo
              </CardDescription>
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
                    At least 2 member photos ({membersWithPhotos} available)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {hasBackground ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  <span className={hasBackground ? "text-green-600" : "text-muted-foreground"}>
                    At least 1 background image ({backgrounds?.length || 0} available)
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
                AI will create a stunning group photo by intelligently composing everyone into your chosen background using Nano Banana.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">What happens next:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Nano Banana analyzes each member's photo</li>
                      <li>• Matches lighting and perspective perfectly</li>
                      <li>• Seamlessly composes everyone into the background</li>
                      <li>• Creates a photorealistic group photo</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Generation details:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Members: {membersWithPhotos}</li>
                      <li>• Background: {backgrounds?.[0]?.name || "Selected scene"}</li>
                      <li>• AI Model: Gemini 2.5 Flash + Nano Banana</li>
                      <li>• Processing time: ~30-60 seconds</li>
                    </ul>
                  </div>
                </div>
                <GeneratePhotoButton groupId={group.id} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Upload Section */}
        <div className="mb-8">
          <PhotoUploadSection
            groupId={group.id}
            userId={user.id}
            userPhoto={members?.find((m) => m.user_id === user.id)?.member_photos?.[0]}
          />
        </div>

        {/* Background Upload Section */}
        {isOwner && (
          <div className="mb-8">
            <BackgroundUploadSection groupId={group.id} backgrounds={backgrounds || []} />
          </div>
        )}

        {/* Member Photos Grid */}
        <div className="mb-8">
          <MemberPhotosGrid members={members || []} />
        </div>

        {/* Generated Photos */}
        <GeneratedPhotosSection generatedPhotos={generatedPhotos || []} groupName={group.name} />
      </main>

      {/* Invite Members Dialog */}
      <InviteMembersDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        groupId={group.id}
        groupName={group.name}
      />
    </>
  )
}
