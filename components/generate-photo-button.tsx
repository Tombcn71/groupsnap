"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GeneratePhotoButtonProps {
  groupId: string
}

export function GeneratePhotoButton({ groupId }: GeneratePhotoButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Update group status to processing
      const { error: updateError } = await supabase.from("groups").update({ status: "processing" }).eq("id", groupId)

      if (updateError) throw updateError

      // Call the generation API
      const response = await fetch("/api/generate-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Generation failed")
      }

      toast.success("Group photo generated successfully! 🎉")

      // Refresh the page to show the generated photo
      window.location.reload()
    } catch (error) {
      console.error("Generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate photo"
      setError(errorMessage)
      toast.error(errorMessage)

      // Reset status back to collecting on error
      await supabase.from("groups").update({ status: "collecting" }).eq("id", groupId)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold px-8 py-3 text-lg"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            Generating Magic...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-3" />
            Generate Group Photo with AI
          </>
        )}
      </Button>

      {isGenerating && (
        <div className="text-sm text-muted-foreground text-center">
          <p>This may take 30-60 seconds. Please don't close this page.</p>
          <p>Our AI is carefully composing your group photo...</p>
        </div>
      )}
    </div>
  )
}
