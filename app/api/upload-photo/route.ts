import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

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

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    })

    const supabase = createClient()

    // Save to database
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
      return NextResponse.json({ error: "Failed to save photo" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      photo: data,
      url: blob.url,
      message: "✅ Photo uploaded successfully!"
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
