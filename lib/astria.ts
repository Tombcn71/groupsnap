import { put } from "@vercel/blob"

export interface AstriaGenerationResult {
  url: string
  metadata: {
    model: string
    prompt: string
    astria_prompt_id: string
    reference_images: number
  }
}

export interface ImageData {
  name: string
  base64: string
}

export interface GroupData {
  id: string
  name: string
}

export class AstriaService {
  private apiKey: string
  private baseUrl = 'https://api.astria.ai'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ASTRIA_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('ASTRIA_API_KEY is required')
    }
  }

  async generateGroupPhoto(
    images: ImageData[], 
    group: GroupData, 
    groupId: string
  ): Promise<AstriaGenerationResult> {
    const prompt = `Professional group photo composition using Nano Banana style. 

Create a cohesive group photo by arranging all ${images.length} people naturally together:

Group: "${group.name}"
Members: ${images.map((img: ImageData) => img.name).join(', ')}

Style: Professional group photo, natural lighting, modern clean background
Quality: High resolution, photorealistic  
Mood: Friendly, professional, engaging

Instructions:
- Maintain each person's facial features and appearance exactly
- Arrange in natural group formation 
- Consistent lighting and shadows across all faces
- Professional but friendly atmosphere
- Clean background suitable for group photos`

    // Upload reference images to temp storage first
    const uploadedImages = await Promise.all(
      images.map(async (img: ImageData, index: number) => {
        const imgBuffer = Buffer.from(img.base64, 'base64')
        const tempFilename = `astria-ref-${groupId}-${index}-${Date.now()}.jpg`
        
        const tempBlob = await put(tempFilename, imgBuffer, {
          access: "public",
          addRandomSuffix: true
        })
        
        return tempBlob.url
      })
    )

    console.log(`📤 Uploaded ${uploadedImages.length} reference images to temp storage`)

    // Create prompt with Astria.ai API
    const astriaResponse = await fetch(`${this.baseUrl}/tunes/prompts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tune_id: 'gemini-2', // This needs to be your actual tune ID
        prompt: prompt,
        input_image: uploadedImages[0], // Primary reference image
        w: 1024,
        h: 1024,
        style: 'Photographic',
        scheduler: 'euler_a',
        steps: 30,
        cfg: 7.5,
        super_resolution: true,
        callback: process.env.ASTRIA_WEBHOOK_URL || undefined // Optional webhook
      })
    })

    if (!astriaResponse.ok) {
      const errorText = await astriaResponse.text()
      throw new Error(`Astria API error: ${astriaResponse.status} - ${errorText}`)
    }

    const astriaResult = await astriaResponse.json()
    console.log("🍌 Astria.ai prompt created:", astriaResult.id)

    // Poll for completion (since webhooks might not be set up)
    const generatedImageUrl = await this.pollForCompletion(astriaResult.id)

    return {
      url: generatedImageUrl,
      metadata: {
        model: "astria-nano-banana-gemini-2.5",
        prompt: prompt,
        astria_prompt_id: astriaResult.id,
        reference_images: uploadedImages.length
      }
    }
  }

  private async pollForCompletion(promptId: string): Promise<string> {
    let attempts = 0
    let generatedImageUrl: string | null = null
    
    while (attempts < 30 && !generatedImageUrl) { // Max 5 minutes
      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
      
      const statusResponse = await fetch(`${this.baseUrl}/tunes/prompts/${promptId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      })
      
      if (statusResponse.ok) {
        const status = await statusResponse.json()
        console.log(`🔄 Astria generation status: ${status.status} (attempt ${attempts + 1}/30)`)
        
        if (status.status === 'finished' && status.images && status.images.length > 0) {
          generatedImageUrl = status.images[0].url
          console.log("✅ Astria.ai generation completed!")
          break
        } else if (status.status === 'failed') {
          throw new Error('Astria.ai generation failed')
        }
      } else {
        console.warn(`⚠️ Failed to check status (attempt ${attempts + 1}):`, statusResponse.status)
      }
      
      attempts++
    }

    if (!generatedImageUrl) {
      throw new Error('Astria.ai generation timed out after 5 minutes')
    }

    return generatedImageUrl
  }

  // Helper method to check if API key is valid
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tunes`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Export a default instance
export const astriaService = new AstriaService()
