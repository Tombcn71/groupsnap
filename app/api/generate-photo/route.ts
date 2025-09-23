import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/genai"

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json()

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    // Select the first background for now (could be randomized or user-selected)
    const selectedBackground = backgrounds[0]

    // Fetch member photos as base64
    const memberPhotoData = await Promise.all(
      memberPhotos.map(async (member) => {
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

    // Create the prompt for group photo composition
    const memberNames = memberPhotos.map((m) => m.name).join(", ")
    const prompt = `Create a realistic group photo by composing the individual photos of ${memberNames} into the provided background scene. 

Instructions:
- Place each person naturally in the background setting
- Maintain realistic lighting and shadows that match the background
- Ensure all people are clearly visible and well-positioned
- Create a natural, candid group photo composition
- Preserve the facial features and characteristics of each person
- Make the lighting and color grading consistent across all subjects
- Position people at appropriate distances and angles for a natural group photo

The background setting is: ${selectedBackground.name || "a scenic location"}

Please generate a high-quality, realistic group photo that looks like it was naturally taken in this location.`

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

    // Generate the group photo using Gemini 2.0 Flash Image
    // Note: Gemini 2.0 Flash doesn't generate images, only text
    // This would need to be updated to use an image generation model
    // For now, return an error indicating this feature needs proper image generation setup
    return NextResponse.json(
      {
        error:
          "Image generation not properly configured. Please use an image generation service like DALL-E or Midjourney.",
      },
      { status: 501 },
    )

    // Extract the generated image
    const generatedImageUrl = null
    const result = await response.response

    // Update group status to completed
    await supabase.from("groups").update({ status: "completed" }).eq("id", groupId)

    return NextResponse.json({
      success: true,
      generatedImageUrl,
      message: "Group photo generated successfully!",
    })
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
