import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type AstriaPromptWebhook = {
  prompt: {
    id: string
    status: string
    images?: string[]
    failure_reason?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    console.log("🍌 ASTRIA WEBHOOK RECEIVED:", body)

    const searchParams = request.nextUrl.searchParams
    const groupId = searchParams.get("group_id")
    const webhookSecret = searchParams.get("webhook_secret")

    console.log("📋 Webhook params:", { groupId, webhookSecret })

    // Verify webhook secret if configured
    if (process.env.ASTRIA_WEBHOOK_SECRET && webhookSecret !== process.env.ASTRIA_WEBHOOK_SECRET) {
      console.error("❌ Invalid webhook secret")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!groupId) {
      console.error("❌ Missing group_id parameter")
      return NextResponse.json({ error: "Missing group_id parameter" }, { status: 400 })
    }

    let webhookData: AstriaPromptWebhook
    try {
      webhookData = JSON.parse(body)
    } catch (e) {
      console.error("❌ Invalid JSON in webhook body")
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    console.log("📦 Parsed Astria webhook data:", JSON.stringify(webhookData, null, 2))

    const { prompt } = webhookData
    
    if (!prompt || !prompt.id) {
      console.error("❌ No prompt data in webhook")
      return NextResponse.json({ error: "No prompt data" }, { status: 400 })
    }

    // If generation finished successfully, save images
    if (prompt.status === 'finished' && prompt.images && prompt.images.length > 0) {
      console.log(`✅ Generation completed for prompt ${prompt.id} with ${prompt.images.length} images`)
      
      const supabase = await createClient()
      
      // Save each generated image to the database
      for (const imageUrl of prompt.images) {
        const { error } = await supabase
          .from("generated_photos")
          .insert({
            group_id: groupId,
            image_url: imageUrl,
            prompt_used: "AI group photo generation via webhook",
            generation_metadata: {
              model: "astria-webhook",
              prompt_id: prompt.id,
              generated_at: new Date().toISOString(),
              webhook_received: true
            }
          })

        if (error) {
          console.error("❌ Failed to save generated photo:", error)
        } else {
          console.log("✅ Saved generated photo:", imageUrl)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Saved ${prompt.images.length} images for group ${groupId}`,
        images: prompt.images.length
      })
      
    } else if (prompt.status === 'failed') {
      console.error("❌ Generation failed:", prompt.failure_reason)
      return NextResponse.json({
        success: false,
        message: `Generation failed: ${prompt.failure_reason || 'Unknown reason'}`
      })
      
    } else {
      console.log(`🔄 Generation in progress: ${prompt.status}`)
      return NextResponse.json({
        success: true,
        message: `Generation status: ${prompt.status}`
      })
    }

  } catch (error) {
    console.error("❌ Astria webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
