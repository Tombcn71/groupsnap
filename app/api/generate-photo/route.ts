import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import { astriaService, type ImageData } from "@/lib/astria"

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

    console.log("🍌 Using Astria.ai for group photo generation")
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

    images = (await Promise.all(imagePromises)).filter(Boolean) as ImageData[]
    
    if (images.length < 2) {
      return NextResponse.json({ error: "Failed to process enough images for generation" }, { status: 500 })
    }

    console.log(`✅ Processed ${images.length} images successfully`)

    // Generate with Astria.ai only
    console.log("🍌 Generating group photo with Astria.ai Nano Banana...")
    const result = await astriaService.generateGroupPhoto(images, group, groupId)
    const generatedImageUrl = result.url
    const generationMetadata = result.metadata

    // Download the generated image and upload to Vercel Blob
    const generatedResponse = await fetch(generatedImageUrl)
    const generatedBuffer = await generatedResponse.arrayBuffer()
    
    const timestamp = Date.now()
    const filename = `ai-group-${groupId}-${timestamp}.jpg`
    
    const blob = await put(filename, generatedBuffer, {
      access: "public",
      addRandomSuffix: true
    })

    console.log("💾 Uploaded generated image:", blob.url)

    // Save to database
    const { error: saveError } = await supabase
      .from("generated_photos")
      .insert({
        group_id: groupId,
        image_url: blob.url,
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
      message: `🎉 AI Group Photo Generated! Combined ${images.length} member photos using ${generationMetadata.model}`,
      generatedImageUrl: blob.url,
      metadata: {
        memberCount: images.length,
        members: images.map((img: any) => img.name),
        ...generationMetadata
      }
    })

  } catch (error: any) {
    console.error("Astria.ai generation error:", error)
    
    return NextResponse.json({
      error: "Failed to generate group photo with Astria.ai: " + (error.message || error)
    }, { status: 500 })
  }
}