"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Share2, Sparkles, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface GeneratedPhotosSectionProps {
  generatedPhotos: any[]
  groupName: string
}

export function GeneratedPhotosSection({ generatedPhotos, groupName }: GeneratedPhotosSectionProps) {
  const handleDownload = async (photoUrl: string, index: number) => {
    try {
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${groupName.replace(/\s+/g, "-").toLowerCase()}-group-photo-${index + 1}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Photo downloaded successfully!")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download photo")
    }
  }

  const handleShare = async (photoUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${groupName} - AI Generated Group Photo`,
          text: "Check out our AI-generated group photo!",
          url: photoUrl,
        })
      } catch (error) {
        console.error("Share error:", error)
        // Fallback to copying URL
        navigator.clipboard.writeText(photoUrl)
        toast.success("Photo URL copied to clipboard!")
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(photoUrl)
      toast.success("Photo URL copied to clipboard!")
    }
  }

  if (!generatedPhotos || generatedPhotos.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Sparkles className="h-6 w-6 mr-3 text-primary" />
          Generated Photos
        </h2>
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
          {generatedPhotos.length} photo{generatedPhotos.length !== 1 ? "s" : ""} created
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generatedPhotos.map((photo, index) => (
          <Card key={photo.id} className="border-border/50 overflow-hidden group hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={photo.image_url || "/placeholder.svg"}
                  alt={`Generated group photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(photo.image_url, index)}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleShare(photo.image_url)}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(photo.image_url, "_blank")}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Generated {new Date(photo.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    AI Generated
                  </Badge>
                </div>
                {photo.prompt && <p className="text-xs text-muted-foreground line-clamp-2">{photo.prompt}</p>}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(photo.image_url, index)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleShare(photo.image_url)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
