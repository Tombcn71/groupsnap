"use client"

import { useState, useEffect } from "react"
import { Camera, Users, Upload, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function JoinGroupPage({ params }: { params: { groupId: string } }) {
  const [group, setGroup] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    // Simulate loading group data - replace with real API call later
    setGroup({
      id: params.groupId,
      name: "Schoolreunie 2024",
      description: "Upload je foto voor onze AI groepsfoto!",
      owner: "Tom",
      status: "collecting"
    })
    setMemberCount(8) // Simulate member count
  }, [params.groupId])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!userName.trim()) {
      alert("Vul eerst je naam in!")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("photo", file)
      formData.append("groupId", params.groupId)
      formData.append("userName", userName.trim())
      formData.append("email", userName.trim()) // userName is email on join page

      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploaded(true)
        setMemberCount(prev => prev + 1)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert("Upload mislukt. Probeer opnieuw.")
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Groep laden...</p>
        </div>
      </div>
    )
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">✅ Upload Gelukt!</CardTitle>
            <CardDescription>
              Je foto is toegevoegd aan {group.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>{memberCount}</strong> personen hebben nu hun foto geüpload
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Je krijgt bericht zodra de groepsfoto klaar is!
            </p>
            <p className="text-sm text-gray-600">
              Je foto is geüpload! De groep owner zal je informeren wanneer de groepsfoto klaar is.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Camera className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GroupSnap</h1>
              <p className="text-sm text-gray-600">AI-powered group photos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              {group.name}
            </CardTitle>
            <CardDescription className="text-lg">
              {group.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{memberCount} foto's geüpload</span>
              </div>
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Gemaakt door {group.owner}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload je foto</span>
            </CardTitle>
            <CardDescription>
              Upload een duidelijke foto van jezelf voor de AI groepsfoto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Je naam
              </label>
              <input
                type="text"
                placeholder="Vul je naam in..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Selecteer foto
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading || !userName.trim()}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:border-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {uploading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Foto uploaden...</span>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Tips voor de beste foto:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Gebruik een duidelijke foto van je gezicht</li>
                <li>• Zorg voor goede belichting</li>
                <li>• Kijk recht in de camera</li>
                <li>• Geen zonnebril of pet</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Powered by AI • Je foto wordt veilig opgeslagen</p>
        </div>
      </main>
    </div>
  )
}
