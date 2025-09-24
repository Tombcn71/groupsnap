import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("photo") as File
    const groupId = formData.get("groupId") as string
    const userId = formData.get("userId") as string

    if (!file || !groupId) {
      return NextResponse.json({ error: "Missing photo or groupId" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Upload to Vercel Blob with unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true
    })

    // Try to save to database (replace existing photo for this user/group)
    try {
      const supabase = createClient()
      
      // First delete existing photos for this user in this group
      if (userId) {
        await supabase
          .from("member_photos")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", userId)
      }
      
      const { data, error } = await supabase
        .from("member_photos")
        .insert({
          group_id: groupId,
          user_id: userId || null,
          image_url: blob.url,
          original_filename: file.name,
          file_size: file.size
        })
        .select()
        .single()

      if (error) {
        console.error("Database error:", error)
        // Return success even if database fails - photo is uploaded to blob
        return NextResponse.json({
          success: true,
          url: blob.url,
          message: "✅ Photo uploaded! (Database save failed but photo is safe)",
          dbError: error.message
        })
      }
      
      return NextResponse.json({
        success: true,
        photo: data,
        url: blob.url,
        message: "✅ Photo uploaded successfully!"
      })
      
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      // Return success - photo is uploaded even if DB fails
      return NextResponse.json({
        success: true,
        url: blob.url,
        message: "✅ Photo uploaded! (Database temporarily unavailable)",
        dbError: dbError.message
      })
    }

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Internal server error: " + error.message 
    }, { status: 500 })
  }
}
