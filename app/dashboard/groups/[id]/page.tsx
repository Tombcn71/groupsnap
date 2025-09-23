"use client"

import { useState, useEffect } from "react"

export default function GroupPage({ params }: { params: { id: string } }) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [shareUrl, setShareUrl] = useState("")
  const [members, setMembers] = useState([
    { email: "you@example.com", status: "Owner" },
    { email: "member1@example.com", status: "Confirmed" },
    { email: "member2@example.com", status: "Invited" }
  ])

  useEffect(() => {
    setShareUrl(`${window.location.origin}/join/${params.id}`)
  }, [params.id])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      alert("Please enter an email address")
      return
    }

    setInviteLoading(true)
    try {
      const response = await fetch("/api/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: params.id,
          email: inviteEmail.trim()
        })
      })

      const result = await response.json()
      
      console.log("API Response:", response.status, result)

      if (response.ok) {
        alert(result.message)
        setInviteEmail("")
        // Add to local state
        setMembers(prev => [...prev, { email: inviteEmail.trim(), status: "Invited" }])
      } else {
        alert(`Error: ${result.error}`)
        console.error("API Error:", result)
      }
    } catch (error) {
      alert("Failed to send invite. Please try again.")
      console.error("Invite error:", error)
    } finally {
      setInviteLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoLoading(true)
    try {
      const formData = new FormData()
      formData.append("photo", file)
      formData.append("groupId", params.id)
      formData.append("userId", "current-user") // We'll fix this later with real auth

      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData
      })

      const result = await response.json()
      console.log("Photo upload result:", result)

      if (response.ok) {
        alert(result.message)
        setUploadedPhotos(prev => [...prev, result.url])
        // Clear the file input
        e.target.value = ""
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert("Failed to upload photo. Please try again.")
      console.error("Photo upload error:", error)
    } finally {
      setPhotoLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Your Group 🚀</h1>
      <p className="text-gray-600 mb-2">ID: {params.id}</p>
      
      {/* Share Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">📱 Deel deze link met je groep:</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl)
              alert("Link gekopieerd! 📋")
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
          >
            Kopieer
          </button>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Mensen kunnen deze link gebruiken om hun foto te uploaden (geen account nodig)
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Invite Members */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            👥 Invite Members
          </h2>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded flex-1"
              disabled={inviteLoading}
            />
            <button 
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
              onClick={handleInvite}
              disabled={inviteLoading}
            >
              {inviteLoading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </div>

        {/* Show Members with invite status */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Recent Invites</h2>
          <div className="space-y-2">
            {members.slice(-3).map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <span className="font-medium">{member.email}</span>
                <span className={`px-3 py-1 rounded text-sm ${
                  member.status === 'Owner' 
                    ? 'bg-green-100 text-green-800'
                    : member.status === 'Confirmed'
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Photo */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            📸 Upload Your Photo
          </h2>
          <input 
            type="file" 
            accept="image/*" 
            className="block mb-3 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
            onChange={handlePhotoUpload}
            disabled={photoLoading}
          />
          <p className="text-sm text-gray-500">Choose a clear photo of yourself</p>
          {photoLoading && (
            <div className="mt-2 text-blue-600">📤 Uploading photo...</div>
          )}
          {uploadedPhotos.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Uploaded Photos ({uploadedPhotos.length}):</h4>
              <div className="grid grid-cols-2 gap-2">
                {uploadedPhotos.map((url, index) => (
                  <img key={index} src={url} alt="Uploaded" className="w-20 h-20 object-cover rounded border" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload Background */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🖼️ Upload Background
          </h2>
          <input 
            type="file" 
            accept="image/*" 
            className="block mb-3 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-50 file:text-purple-700"
            onChange={(e) => e.target.files?.[0] && alert("✅ Background uploaded!")}
          />
          <p className="text-sm text-gray-500">Upload background image (school, office, etc.)</p>
        </div>

        {/* Generate Photo */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🤖 Generate Group Photo
          </h2>
          <p className="text-gray-600 mb-4">
            Ready to create your AI-generated group photo with Nano Banana!
          </p>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            onClick={() => alert("🚀 Generating group photo with Gemini 2.5 Flash + Nano Banana!\n\nThis would normally take 30-60 seconds...")}
          >
            ✨ Generate with Nano Banana
          </button>
        </div>

        {/* Members List */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">👥 Group Members ({members.length})</h2>
          <div className="space-y-2">
            {members.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>{member.email}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  member.status === 'Owner' 
                    ? 'bg-green-100 text-green-800'
                    : member.status === 'Confirmed'
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}