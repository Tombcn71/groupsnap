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
    // First validate API key
    console.log("🔑 Validating Astria API key...")
    const isValidKey = await this.validateApiKey()
    if (!isValidKey) {
      throw new Error("Invalid Astria API key. Please check your ASTRIA_API_KEY environment variable.")
    }
    console.log("✅ API key is valid")
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
    // Note: tune_id should be a number, not a string
    const tuneId = process.env.ASTRIA_TUNE_ID ? parseInt(process.env.ASTRIA_TUNE_ID) : null
    
    if (!tuneId) {
      throw new Error("ASTRIA_TUNE_ID environment variable is required (should be a number)")
    }

    const requestBody = {
      tune_id: tuneId, // Use your actual trained tune ID
      prompt: prompt,
      input_image: uploadedImages[0], // Primary reference image
      w: 1024,
      h: 1024,
      style: 'Photographic',
      scheduler: 'euler_a',
      steps: 30,
      cfg: 7.5,
      super_resolution: true,
      callback: process.env.ASTRIA_WEBHOOK_URL ? 
        `${process.env.ASTRIA_WEBHOOK_URL}?group_id=${groupId}&webhook_secret=${process.env.ASTRIA_WEBHOOK_SECRET}` : 
        undefined // Optional webhook with group context
    }

    console.log("📤 Creating Astria prompt with body:", JSON.stringify(requestBody, null, 2))

    const astriaResponse = await fetch(`${this.baseUrl}/tunes/prompts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log("📥 Astria response status:", astriaResponse.status)

    if (!astriaResponse.ok) {
      const errorText = await astriaResponse.text()
      console.error("❌ Astria API error response:", {
        status: astriaResponse.status,
        statusText: astriaResponse.statusText,
        body: errorText,
        url: `${this.baseUrl}/tunes/prompts`
      })
      
      if (astriaResponse.status === 401) {
        throw new Error(`Astria API authentication failed. Check your API key.`)
      } else if (astriaResponse.status === 404) {
        throw new Error(`Astria API endpoint not found. Check the tune_id 'gemini-2' exists.`)
      } else {
        throw new Error(`Astria API error: ${astriaResponse.status} - ${errorText}`)
      }
    }

    const astriaResult = await astriaResponse.json()
    console.log("🍌 Astria.ai prompt created successfully:", JSON.stringify(astriaResult, null, 2))

    // Poll for completion (since webhooks might not be set up)
    const generatedImageUrl = await this.pollForCompletion(astriaResult.id, tuneId)

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

  private async pollForCompletion(promptId: string, tuneId: number): Promise<string> {
    let attempts = 0
    let generatedImageUrl: string | null = null
    
    console.log(`🔍 Starting polling for prompt ID: ${promptId}`)
    
    while (attempts < 30 && !generatedImageUrl) { // Max 5 minutes
      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
      
      // Try the individual prompt endpoint first
      const statusUrl = `${this.baseUrl}/tunes/prompts/${promptId}`
      console.log(`📡 Checking individual prompt status at: ${statusUrl}`)
      
      const statusResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      })
      
      if (statusResponse.ok) {
        const status = await statusResponse.json()
        console.log(`🔄 Prompt status: ${status.status} (attempt ${attempts + 1}/30)`)
        console.log(`📊 Full prompt response:`, JSON.stringify(status, null, 2))
        
        if (status.status === 'finished' && status.images && status.images.length > 0) {
          // Images can be strings or objects with url property
          const imageUrl = typeof status.images[0] === 'string' ? status.images[0] : status.images[0].url
          if (imageUrl) {
            generatedImageUrl = imageUrl
            console.log("✅ Astria.ai generation completed!")
            break
          }
        } else if (status.status === 'failed') {
          console.error("❌ Astria generation failed:", status)
          throw new Error(`Astria.ai generation failed: ${status.failure_reason || 'Unknown reason'}`)
        }
      } else if (statusResponse.status === 404) {
        // If individual prompt not found, try getting all prompts for the tune
        console.log(`📡 Prompt not found individually, checking all prompts for tune ${tuneId}`)
        
        const allPromptsUrl = `${this.baseUrl}/tunes/${tuneId}/prompts`
        const allPromptsResponse = await fetch(allPromptsUrl, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          }
        })
        
        if (allPromptsResponse.ok) {
          const allPrompts = await allPromptsResponse.json()
          console.log(`📋 Found ${allPrompts.length} prompts for tune ${tuneId}`)
          
          // Find our prompt in the list
          const ourPrompt = allPrompts.find((p: any) => p.id.toString() === promptId)
          if (ourPrompt && ourPrompt.status === 'finished' && ourPrompt.images && ourPrompt.images.length > 0) {
            const imageUrl = typeof ourPrompt.images[0] === 'string' ? ourPrompt.images[0] : ourPrompt.images[0].url
            if (imageUrl) {
              generatedImageUrl = imageUrl
              console.log("✅ Found completed prompt in tune prompts list!")
              break
            }
          }
        }
      } else {
        const errorText = await statusResponse.text()
        console.error(`⚠️ Status check failed (attempt ${attempts + 1}/30):`, {
          status: statusResponse.status,
          statusText: statusResponse.statusText,
          body: errorText,
          url: statusUrl
        })
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
