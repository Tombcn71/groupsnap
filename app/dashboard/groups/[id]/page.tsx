"use client"

import { useState, useEffect } from "react"

export default function GroupPage({ params }: { params: { id: string } }) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [generatedPhoto, setGeneratedPhoto] = useState<string | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [memberPhotos, setMemberPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroupData()
  }, [params.id])

  const loadGroupData = async () => {
    try {
      const response = await fetch(`/api/group-data/${params.id}`)
      const data = await response.json()
      
      if (data.success) {
        setMembers(data.members || [])
        setMemberPhotos(data.memberPhotos || [])
        if (data.generatedPhoto) {
          setGeneratedPhoto(data.generatedPhoto)
        }
      } else {
        console.error("Failed to load group data:", data.error)
        // Fallback to empty arrays
        setMembers([])
        setMemberPhotos([])
      }
    } catch (error) {
      console.error("Error loading group data:", error)
      // Fallback to empty arrays
      setMembers([])
      setMemberPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const shareUrl = `https://v0-group-photo-generator.vercel.app/join/${params.id}`

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
        // Reload data to get fresh member list
        loadGroupData()
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
        // Replace existing photo instead of adding
        setUploadedPhotos([result.url])
        // Clear the file input
        e.target.value = ""
        // Reload data to get fresh photo list
        loadGroupData()
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

  const handleGeneratePhoto = async () => {
    setGenerateLoading(true)
    try {
      const response = await fetch("/api/generate-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: params.id
        })
      })

      const result = await response.json()
      console.log("Generation result:", result)

      if (response.ok) {
        setGeneratedPhoto(result.generatedImageUrl)
        alert("🎉 " + result.message)
        // Reload data to get fresh generated photo
        loadGroupData()
      } else {
        alert(`Generation failed: ${result.error}`)
        console.error("Generation error:", result)
      }
    } catch (error) {
      alert("Failed to generate photo. Please try again.")
      console.error("Generation error:", error)
    } finally {
      setGenerateLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Your Group 🚀</h1>
      <p className="text-gray-600 mb-2">ID: {params.id}</p>
      
      {/* WhatsApp Share Link */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-800 mb-2">📱 WhatsApp Link Delen:</h3>
        <div className="flex gap-2 mb-3">
          <input 
            type="text" 
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm font-mono"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl)
              alert("Link gekopieerd! Plak in WhatsApp groep 📱")
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm whitespace-nowrap"
          >
            📋 Kopieer
          </button>
          <button
            onClick={() => {
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`📸 Meedoen met groepsfoto? Upload je foto hier: ${shareUrl}`)}`
              window.open(whatsappUrl, '_blank')
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm whitespace-nowrap"
          >
            📲 WhatsApp
          </button>
        </div>
        <div className="bg-white p-3 rounded border border-green-200">
          <p className="text-sm text-green-700 font-medium mb-1">Zo werkt het:</p>
          <p className="text-xs text-green-600">
            1️⃣ Deel link in WhatsApp groep → 2️⃣ Mensen klikken & uploaden foto → 3️⃣ Jij ziet hier wie heeft gereageerd!
          </p>
        </div>
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

        {/* Show who joined via link */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">👥 Wie Hebben Gereageerd</h2>
          <div className="space-y-2">
            {memberPhotos.length > 0 ? (
              memberPhotos.map((photo, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={photo.image_url} 
                      alt="Member photo" 
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-300"
                    />
                    <div>
                      <div className="font-medium">{photo.display_name || 'Anoniem'}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(photo.created_at).toLocaleDateString('nl-NL', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded text-sm bg-green-100 text-green-800 flex items-center">
                    ✅ Foto klaar
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-3">Nog niemand heeft de link gebruikt</p>
                <p className="text-sm text-gray-400">Deel de WhatsApp link om te beginnen! 📱</p>
              </div>
            )}
          </div>
        </div>

        {/* Email invites (optional, for business use) */}
        {members.length > 0 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📧 Email Invites (Business)</h2>
            <div className="space-y-2">
              {members.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <span className="font-medium">{member.email}</span>
                  <span className={`px-3 py-1 rounded text-sm ${
                    member.status === 'Owner' 
                      ? 'bg-green-100 text-green-800'
                      : member.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Photo */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            📸 Je Foto voor de Groepsfoto
          </h2>
          
          {uploadedPhotos.length > 0 ? (
            <div className="mb-4">
              <p className="text-sm text-green-600 mb-2">✅ Je foto is geüpload:</p>
              <img 
                src={uploadedPhotos[uploadedPhotos.length - 1]} 
                alt="Je foto" 
                className="w-24 h-24 object-cover rounded border-2 border-green-200" 
              />
              <p className="text-xs text-gray-500 mt-1">Upload een nieuwe foto om deze te vervangen</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-3">Upload 1 duidelijke foto van jezelf</p>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            className="block mb-3 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
            onChange={handlePhotoUpload}
            disabled={photoLoading}
          />
          
          {photoLoading && (
            <div className="mt-2 text-blue-600">📤 Foto uploaden...</div>
          )}
          
          <div className="bg-blue-50 p-3 rounded mt-3">
            <p className="text-xs text-blue-700">
              💡 <strong>Tip:</strong> Gebruik een duidelijke foto van je gezicht. Deze wordt gebruikt voor de AI groepsfoto.
            </p>
          </div>
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
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            onClick={handleGeneratePhoto}
            disabled={generateLoading}
          >
            {generateLoading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating...
              </span>
            ) : (
              "✨ Generate with Nano Banana"
            )}
          </button>
        </div>

        {/* Generated Photo Result */}
        {generatedPhoto && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              🎉 Je AI Groepsfoto is Klaar!
            </h2>
            <div className="text-center">
              <img 
                src={generatedPhoto} 
                alt="Generated group photo" 
                className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
              />
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => window.open(generatedPhoto, '_blank')}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  📷 View Full Size
                </button>
                <button 
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = generatedPhoto
                    link.download = `groepsfoto-${params.id}.jpg`
                    link.click()
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  💾 Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple Status Overview */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Overzicht</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{memberPhotos.length}</div>
              <div className="text-sm text-green-600">Foto's geüpload</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{members.length}</div>
              <div className="text-sm text-blue-600">Uitgenodigd</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{memberPhotos.length >= 2 ? '✅' : '⏳'}</div>
              <div className="text-sm text-purple-600">AI Ready</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Deel de join link zodat mensen hun foto's kunnen uploaden!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}