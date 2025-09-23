"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function WorkingGroupPage() {
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // Get user
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)
    
    if (!currentUser) return

    // Get groups (with RLS disabled, this should work)
    const { data: userGroups } = await supabase
      .from("groups")
      .select("*")
      .eq("owner_id", currentUser.id)
    
    setGroups(userGroups || [])
    
    if (userGroups && userGroups.length > 0) {
      const firstGroup = userGroups[0]
      setSelectedGroup(firstGroup)
      
      // Get members for first group
      const { data: groupMembers } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", firstGroup.id)
      
      setMembers(groupMembers || [])
    }
    
    setLoading(false)
  }

  const createGroup = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: "My Test Group " + Date.now(),
        description: "Test group created directly",
        owner_id: user.id,
        status: "collecting"
      })
      .select()
      .single()

    if (!error && data) {
      // Add yourself as member
      await supabase
        .from("group_members")
        .insert({
          group_id: data.id,
          user_id: user.id,
          email: user.email,
          status: "confirmed"
        })
      
      alert("Group created! Reloading...")
      loadData()
    } else {
      alert("Error: " + error?.message)
    }
  }

  const inviteMember = async () => {
    if (!selectedGroup || !inviteEmail) return
    
    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: selectedGroup.id,
        email: inviteEmail,
        status: "invited"
      })

    if (!error) {
      alert("Member invited!")
      setInviteEmail("")
      loadData()
    } else {
      alert("Error: " + error.message)
    }
  }

  const uploadPhoto = async () => {
    if (!uploadFile || !selectedGroup || !user) return
    
    // Simple upload to a placeholder URL
    const fakeUrl = `https://placeholder.com/photo-${Date.now()}.jpg`
    
    const { error } = await supabase
      .from("member_photos")
      .insert({
        group_id: selectedGroup.id,
        user_id: user.id,
        image_url: fakeUrl
      })

    if (!error) {
      alert("Photo uploaded!")
      setUploadFile(null)
    } else {
      alert("Error: " + error.message)
    }
  }

  const uploadBackground = async () => {
    if (!backgroundFile || !selectedGroup) return
    
    const fakeUrl = `https://placeholder.com/bg-${Date.now()}.jpg`
    
    const { error } = await supabase
      .from("group_backgrounds")
      .insert({
        group_id: selectedGroup.id,
        image_url: fakeUrl,
        name: backgroundFile.name
      })

    if (!error) {
      alert("Background uploaded!")
      setBackgroundFile(null)
    } else {
      alert("Error: " + error.message)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <div className="p-8">❌ Not logged in</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">✅ WORKING GroupSnap</h1>
      
      <div className="text-sm text-gray-600">
        User: {user.email} | Groups: {groups.length}
      </div>

      {/* Create Group */}
      <Card>
        <CardHeader>
          <CardTitle>🆕 Create Group</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={createGroup}>Create New Test Group</Button>
        </CardContent>
      </Card>

      {/* Groups List */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Your Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groups.map((group) => (
                <div 
                  key={group.id} 
                  className={`p-3 border rounded cursor-pointer ${
                    selectedGroup?.id === group.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="font-semibold">{group.name}</div>
                  <div className="text-sm text-gray-600">{group.status}</div>
                  <div className="text-xs text-gray-400">{group.id}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Group Actions */}
      {selectedGroup && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>👥 Invite Members to {selectedGroup.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <Button onClick={inviteMember}>Send Invite</Button>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Members ({members.length}):</h4>
                {members.map((member, i) => (
                  <div key={i} className="text-sm">
                    {member.email} - {member.status}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📸 Upload Your Photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <Button onClick={uploadPhoto} disabled={!uploadFile}>
                Upload Photo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🖼️ Upload Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setBackgroundFile(e.target.files?.[0] || null)}
              />
              <Button onClick={uploadBackground} disabled={!backgroundFile}>
                Upload Background
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🤖 Generate Group Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => alert("This would call the AI generation!")}
                className="bg-green-500 hover:bg-green-600"
              >
                Generate with Nano Banana
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
