import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import { GoogleGenAI } from "@google/genai"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  let groupId: string = ""
  let images: any[] = []
  
  try {
    console.log("🔥 GENERATE PHOTO API CALLED!")
    
    const body = await request.json()
    groupId = body.groupId
    
    console.log("📨 Request body:", JSON.stringify(body, null, 2))

    if (!groupId) {
      console.log("❌ No group ID provided")
      return NextResponse.json({ error: "Group ID required" }, { status: 400 })
    }

    console.log("🎨 Using Google GenAI for group photo generation")
    console.log("🚀 Starting AI generation for group:", groupId)
    
    // Get group data from database
    const supabase = await createClient()

    // Get group info
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Get member photos
    const { data: memberPhotos, error: photosError } = await supabase
      .from("member_photos")
      .select("*")
      .eq("group_id", groupId)

    if (photosError) {
      console.error("Photos error:", photosError)
      return NextResponse.json({ error: "Failed to fetch member photos" }, { status: 500 })
    }

    if (!memberPhotos || memberPhotos.length < 2) {
      return NextResponse.json({ error: "Need at least 2 member photos for AI generation" }, { status: 400 })
    }

    console.log(`📸 Found ${memberPhotos.length} photos to process`)

    // Convert images to base64
    const imagePromises = memberPhotos.map(async (photo: any) => {
      try {
        const response = await fetch(photo.image_url)
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        return {
          name: photo.display_name || photo.email || 'Member',
          base64: base64
        }
      } catch (error) {
        console.error(`Failed to fetch image for ${photo.display_name}:`, error)
        return null
      }
    })

    images = (await Promise.all(imagePromises)).filter(Boolean)
    
    if (images.length < 2) {
      return NextResponse.json({ error: "Failed to process enough images for generation" }, { status: 500 })
    }

    console.log(`✅ Processed ${images.length} images successfully`)

    // Generate with Google GenAI
    console.log("🎨 Generating group photo with Google GenAI...")
    
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    })
    
    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
    }
    
    const model = 'gemini-2.5-flash-image-preview'
    
    const prompt = `IMPORTANT: Create a professional group photo by arranging these ${images.length} people together. You MUST preserve each person's exact facial features, skin tone, hair, and appearance from their individual photos.

Group: "${group.name}"
Members: ${images.map((img: any) => img.name).join(', ')}

CRITICAL REQUIREMENTS:
- Keep each person's face EXACTLY as shown in their individual photo
- Do NOT change facial features, skin color, hair style, or eye color
- Do NOT blend or morph faces - maintain individual identity
- Simply arrange the people in a natural group formation
- Use the same lighting and perspective for all people
- Place them as if they are standing/sitting together for a real photo

Technical requirements:
- Professional group photo composition
- Consistent lighting across all faces (matching the brightest photo)
- Clean, professional background (office, studio, or neutral setting)
- High resolution, photorealistic quality
- Natural, friendly expressions maintained from original photos

Style: Corporate group photo, professional lighting, modern setting`

    const contents = [
      {
        role: 'user' as const,
        parts: [
          { text: prompt },
          ...images.map(img => ({
            inlineData: {
              data: img.base64,
              mimeType: 'image/jpeg'
            }
          }))
        ],
      },
    ]

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    })
    
    let generatedImageBuffer: Buffer | null = null
    let responseText = ""

    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue
      }
      
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData
        generatedImageBuffer = Buffer.from(inlineData.data || '', 'base64')
        console.log("🖼️ Google generated image received!")
      } else {
        responseText += chunk.text || ""
      }
    }

    if (!generatedImageBuffer) {
      throw new Error("No image was generated by Google GenAI")
    }

    // Upload to Vercel Blob
    const timestamp = Date.now()
    const filename = `google-group-${groupId}-${timestamp}.jpg`
    
    const blob = await put(filename, generatedImageBuffer, {
      access: "public",
      addRandomSuffix: true
    })

    const generatedImageUrl = blob.url
    const generationMetadata = {
      model: "google-gemini-2.5-flash-image-preview",
      prompt: prompt,
      response_text: responseText.substring(0, 500)
    }

    console.log("💾 Generated image uploaded:", generatedImageUrl)

    // Save to database
    const { error: saveError } = await supabase
      .from("generated_photos")
      .insert({
        group_id: groupId,
        image_url: generatedImageUrl,
        prompt_used: generationMetadata.prompt || "AI group photo generation",
        generation_metadata: {
          ...generationMetadata,
          member_count: images.length,
          members: images.map((img: any) => img.name),
          generated_at: new Date().toISOString()
        }
      })

    if (saveError) {
      console.error("Failed to save generated photo:", saveError)
    }

    return NextResponse.json({
      success: true,
      message: `🎉 AI Group Photo Generated! Combined ${images.length} member photos using Google GenAI`,
      generatedImageUrl: generatedImageUrl,
      metadata: {
        memberCount: images.length,
        members: images.map((img: any) => img.name),
        ...generationMetadata
      }
    })

  } catch (error: any) {
    console.error("Google GenAI generation error:", error)
    
    return NextResponse.json({
      error: "Failed to generate group photo with Google GenAI: " + (error.message || error)
    }, { status: 500 })
  }
}