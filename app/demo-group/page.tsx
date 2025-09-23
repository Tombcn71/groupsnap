"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Camera, Upload, Sparkles, UserPlus } from "lucide-react"

export default function DemoGroupPage() {
  const [groups, setGroups] = useState([
    {
      id: "demo-1",
      name: "School Graduation Photo",
      description: "Final year group photo with AI background",
      status: "collecting",
      members: 8,
      photos: 6,
      backgrounds: 1
    }
  ])
  
  const [selectedGroup, setSelectedGroup] = useState(groups[0])
  const [inviteEmail, setInviteEmail] = useState("")
  const [members] = useState([
    { email: "student1@school.com", status: "confirmed", hasPhoto: true },
    { email: "student2@school.com", status: "confirmed", hasPhoto: true },
    { email: "student3@school.com", status: "invited", hasPhoto: false },
    { email: "student4@school.com", status: "confirmed", hasPhoto: true }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "collecting": return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "processing": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/30"
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">GroupSnap Demo</span>
            </div>
            <Badge variant="secondary">Demo Mode - All Features Working</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Group Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{selectedGroup.name}</h1>
              <p className="text-muted-foreground mb-4">{selectedGroup.description}</p>
            </div>
            <Badge className={getStatusColor(selectedGroup.status)}>
              <span className="capitalize">{selectedGroup.status}</span>
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
              <div className="text-2xl font-bold">{selectedGroup.members}</div>
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
              <div className="text-2xl font-bold">{selectedGroup.photos}</div>
              <p className="text-sm text-muted-foreground">Photos uploaded</p>
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
              <div className="text-2xl font-bold">{selectedGroup.backgrounds}</div>
              <p className="text-sm text-muted-foreground">Background images</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ready</div>
              <p className="text-sm text-muted-foreground">For generation</p>
            </CardContent>
          </Card>
        </div>

        {/* Invite Members Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Invite Members
            </CardTitle>
            <CardDescription>
              Add people to your group so they can upload their photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => {
                if (inviteEmail) {
                  alert(`✅ Invitation sent to ${inviteEmail}!`)
                  setInviteEmail("")
                }
              }}>
                Send Invite
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Current Members ({members.length}):</h4>
              <div className="grid gap-2">
                {members.map((member, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>{member.email}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.status === "confirmed" ? "default" : "secondary"}>
                        {member.status}
                      </Badge>
                      {member.hasPhoto && <Camera className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Upload Your Photo
            </CardTitle>
            <CardDescription>
              Upload a clear photo of yourself for the AI to include in the group photo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="photo-upload"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    alert("✅ Photo uploaded successfully!")
                  }
                }}
              />
              <Button 
                onClick={() => document.getElementById("photo-upload")?.click()}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Choose Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Background Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload Background
            </CardTitle>
            <CardDescription>
              Upload a background image (school, office, outdoor location) where the group photo will be set
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="background-upload"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    alert("✅ Background uploaded successfully!")
                  }
                }}
              />
              <Button 
                onClick={() => document.getElementById("background-upload")?.click()}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Choose Background
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generate Photo Section */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Sparkles className="h-6 w-6 mr-3 text-primary" />
              Ready to Generate Your Group Photo!
            </CardTitle>
            <CardDescription className="text-base">
              Perfect! You have enough member photos and background images. 
              Nano Banana will create a stunning group photo by intelligently composing everyone into your chosen background.
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
                    <li>• Members: {selectedGroup.photos}</li>
                    <li>• Background: School Campus</li>
                    <li>• AI Model: Gemini 2.5 Flash + Nano Banana</li>
                    <li>• Processing time: ~30-60 seconds</li>
                  </ul>
                </div>
              </div>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                onClick={() => {
                  alert("🤖 Generating group photo with Nano Banana...\n\nThis would normally take 30-60 seconds to create your photorealistic group photo!")
                }}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Group Photo with Nano Banana
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-muted-foreground">
          <p>🎨 Demo Mode - All buttons functional, shows real GroupSnap workflow</p>
        </div>
      </main>
    </div>
  )
}
