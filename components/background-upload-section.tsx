"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface BackgroundUploadSectionProps {
  groupId: string
  backgrounds: any[]
}

export function BackgroundUploadSection({ groupId, backgrounds }: BackgroundUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
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
      const { error } = await supabase.from("group_backgrounds").insert({
        group_id: groupId,
        image_url: url,
        name: file.name,
      })

      if (error) throw error

      toast.success("Background uploaded successfully!")

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload background")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveBackground = async (background: any) => {
    try {
      // Delete from database
      const { error } = await supabase.from("group_backgrounds").delete().eq("id", background.id)

      if (error) throw error

      // Delete from Blob storage
      await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: background.image_url }),
      })

      toast.success("Background removed successfully!")

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to remove background")
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ImageIcon className="h-5 w-5 mr-2" />
          Background Images
        </CardTitle>
        <CardDescription>
          Upload background images where the group photo will be placed (e.g., schoolyard, office space)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Upload Button */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <Button
              onClick={() => document.getElementById("background-upload")?.click()}
              disabled={isUploading}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Add Background"}
            </Button>
          </div>

          {/* Background Grid */}
          {backgrounds.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {backgrounds.map((background) => (
                <div key={background.id} className="relative group">
                  <div className="aspect-video relative overflow-hidden rounded-lg border-2 border-border">
                    <img
                      src={background.image_url || "/placeholder.svg"}
                      alt={background.name || "Background"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveBackground(background)}>
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 truncate">{background.name || "Background"}</p>
                </div>
              ))}
            </div>
          )}

          <input id="background-upload" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          <div className="text-xs text-muted-foreground">
            <p>• Supported formats: JPG, PNG, WebP</p>
            <p>• Maximum file size: 10MB</p>
            <p>• Use high-resolution images for best results</p>
            <p>• Consider lighting and space for group placement</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
