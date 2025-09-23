eimport { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/genai"

export async function POST(request: NextRequest) {
  const { groupId } = await request.json()
  
  try {

    if (!groupId) {
      return NextResponse.json({ error: "Group ID required" }, { status: 400 })
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: "Google AI API not configured" }, { status: 500 })
    }

    const supabase = await createClient()

    // Get group details and member photos
    const { data: group } = await supabase
      .from("groups")
      .select(`
        *,
        group_members(
          *,
          profiles(full_name, email),
          member_photos(*)
        ),
        group_backgrounds(*)
      `)
      .eq("id", groupId)
      .single()

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Validate we have enough data
    const memberPhotos = group.group_members
      .filter((member: any) => member.member_photos && member.member_photos.length > 0)
      .map((member: any) => ({
        name: member.profiles?.full_name || member.profiles?.email,
        photoUrl: member.member_photos[0].image_url,
      }))

    const backgrounds = group.group_backgrounds || []

    if (memberPhotos.length < 2) {
      return NextResponse.json({ error: "Need at least 2 member photos" }, { status: 400 })
    }

    if (backgrounds.length === 0) {
      return NextResponse.json({ error: "Need at least 1 background image" }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Select the first background for now (could be randomized or user-selected)
    const selectedBackground = backgrounds[0]

    // Fetch member photos as base64
    const memberPhotoData = await Promise.all(
      memberPhotos.map(async (member: any) => {
        const response = await fetch(member.photoUrl)
        const buffer = await response.arrayBuffer()
        const base64 = Buffer.from(buffer).toString("base64")
        const mimeType = response.headers.get("content-type") || "image/jpeg"
        return {
          name: member.name,
          data: base64,
          mimeType,
        }
      }),
    )

    // Fetch background image as base64
    const backgroundResponse = await fetch(selectedBackground.image_url)
    const backgroundBuffer = await backgroundResponse.arrayBuffer()
    const backgroundBase64 = Buffer.from(backgroundBuffer).toString("base64")
    const backgroundMimeType = backgroundResponse.headers.get("content-type") || "image/jpeg"

    // Create the prompt for Nano Banana group photo composition
    const memberNames = memberPhotos.map((m: any) => m.name).join(", ")
    const prompt = `Use Nano Banana to create a realistic group photo by seamlessly composing these ${memberPhotoData.length} individual people into the provided background scene.

Target: Create a natural group photo of ${memberNames} in ${selectedBackground.name || "this location"}

Nano Banana Instructions:
- Seamlessly integrate each person into the background scene
- Match lighting, shadows, and perspective to the background environment
- Maintain photorealistic quality and natural positioning
- Preserve each person's facial features and characteristics exactly
- Create natural group dynamics with appropriate spacing and interaction
- Ensure consistent color grading and lighting across all subjects
- Position people at realistic depths and angles for the scene
- Make it look like an authentic group photo taken in this location

Style: Photorealistic, natural lighting, professional group photo quality
Output: High-resolution composite image that looks authentically photographed`

    // Prepare the content array with background and member photos
    const contents = [
      prompt,
      {
        inlineData: {
          mimeType: backgroundMimeType,
          data: backgroundBase64,
        },
      },
      ...memberPhotoData.map((member) => ({
        inlineData: {
          mimeType: member.mimeType,
          data: member.data,
        },
      })),
    ]

    // Generate the group photo using Gemini 2.5 Flash with Nano Banana
    console.log("Generating group photo with Nano Banana...")
    
    const response = await model.generateContent(contents)
    const result = await response.response
    
    // Check if the response contains image data
    let generatedImageUrl = null
    
    // For Nano Banana, we need to check if it returns image data
    if (result.candidates && result.candidates[0]) {
      const candidate = result.candidates[0]
      
      // Check if there's image data in the response
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // Convert base64 back to blob and upload to storage
            const imageBuffer = Buffer.from(part.inlineData.data, 'base64')
            const imageBlob = new Blob([imageBuffer], { type: part.inlineData.mimeType || 'image/jpeg' })
            
            // Upload generated image to Vercel Blob
            const { put } = await import("@vercel/blob")
            const filename = `generated-group-${groupId}-${Date.now()}.jpg`
            const uploadResult = await put(filename, imageBlob, {
              access: "public",
            })
            
            generatedImageUrl = uploadResult.url
            break
          }
        }
      }
    }
    
    // If no image was generated, try to extract from text response
    if (!generatedImageUrl && result.text) {
      console.log("No direct image generated, checking response:", result.text())
      // For debugging - log the response to understand what Nano Banana returns
    }

    // Save generated photo to database if successful
    if (generatedImageUrl) {
      await supabase.from("generated_photos").insert({
        group_id: groupId,
        image_url: generatedImageUrl,
        prompt_used: prompt,
        generation_metadata: {
          model: "gemini-2.5-flash",
          feature: "nano-banana",
          member_count: memberPhotoData.length,
          background: selectedBackground.name || "uploaded background"
        }
      })

      // Update group status to completed
      await supabase.from("groups").update({ 
        status: "completed",
        generated_photo_url: generatedImageUrl 
      }).eq("id", groupId)

      return NextResponse.json({
        success: true,
        generatedImageUrl,
        message: "Group photo generated successfully with Nano Banana!",
      })
    } else {
      // If generation failed, reset status and return error
      await supabase.from("groups").update({ status: "collecting" }).eq("id", groupId)
      
      return NextResponse.json({
        error: "Failed to generate image. Nano Banana might not have returned image data. Check console for details.",
        debug: result.text ? result.text() : "No response text available"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Generation error:", error)

    // Reset group status back to collecting on error
    try {
      const supabase = await createClient()
      await supabase.from("groups").update({ status: "collecting" }).eq("id", groupId)
    } catch (resetError) {
      console.error("Failed to reset group status:", resetError)
    }

    return NextResponse.json(
      {
        error: "Failed to generate group photo. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
