"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Camera, X, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PhotoUploadSectionProps {
  groupId: string
  userId: string
  userPhoto?: any
}

export function PhotoUploadSection({ groupId, userId, userPhoto }: PhotoUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(userPhoto?.image_url || null)
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    setIsUploading(true)

    try {
      // Upload to Blob storage
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const { url } = await response.json()

      // Save to database
      if (userPhoto) {
        // Update existing photo
        const { error } = await supabase.from("member_photos").update({ image_url: url }).eq("id", userPhoto.id)

        if (error) throw error
      } else {
        // Create new photo record
        const { error } = await supabase.from("member_photos").insert({
          group_id: groupId,
          user_id: userId,
          image_url: url,
        })

        if (error) throw error
      }

      setPreview(url)
      toast.success("Photo uploaded successfully!")

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload photo")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!userPhoto) return

    try {
      // Delete from database
      const { error } = await supabase.from("member_photos").delete().eq("id", userPhoto.id)

      if (error) throw error

      // Delete from Blob storage
      await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: userPhoto.image_url }),
      })

      setPreview(null)
      toast.success("Photo removed successfully!")

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to remove photo")
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Your Photo
        </CardTitle>
        <CardDescription>Upload a clear photo of yourself for the group photo generation</CardDescription>
      </CardHeader>
      <CardContent>
        {preview ? (
          <div className="space-y-4">
            <div className="relative w-48 h-48 mx-auto">
              <img
                src={preview || "/placeholder.svg"}
                alt="Your photo"
                className="w-full h-full object-cover rounded-lg border-2 border-border"
              />
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => document.getElementById("photo-upload")?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace Photo
              </Button>
              <Button
                variant="outline"
                onClick={handleRemovePhoto}
                className="text-red-500 hover:text-red-600 bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Your Photo</h3>
            <p className="text-muted-foreground mb-4">Choose a clear, well-lit photo where your face is visible</p>
            <Button
              onClick={() => document.getElementById("photo-upload")?.click()}
              disabled={isUploading}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Choose Photo"}
            </Button>
          </div>
        )}

        <input id="photo-upload" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Supported formats: JPG, PNG, WebP</p>
          <p>• Maximum file size: 10MB</p>
          <p>• For best results, use a high-quality photo with good lighting</p>
        </div>
      </CardContent>
    </Card>
  )
}
