import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    // Get group info
    const { data: groupInfo, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", params.id)
      .single()

    if (groupError) {
      console.error("Group info error:", groupError)
    }
    
    // Get group members
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", params.id)
      .order("created_at")

    if (membersError) {
      console.error("Members error:", membersError)
    }

    // Get member photos
    const { data: memberPhotos, error: photosError } = await supabase
      .from("member_photos")
      .select("*")
      .eq("group_id", params.id)

    if (photosError) {
      console.error("Photos error:", photosError)
    }

    // Get generated photos
    const { data: generatedPhotos, error: generatedError } = await supabase
      .from("generated_photos")
      .select("*")
      .eq("group_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (generatedError) {
      console.error("Generated photos error:", generatedError)
    }

    return NextResponse.json({
      success: true,
      groupInfo: groupInfo || null,
      members: members || [],
      memberPhotos: memberPhotos || [],
      generatedPhoto: generatedPhotos?.[0]?.image_url || null,
      stats: {
        totalMembers: members?.length || 0,
        photosUploaded: memberPhotos?.length || 0,
        waitingForPhotos: (members?.length || 0) - (memberPhotos?.length || 0)
      }
    })

  } catch (error) {
    console.error("Group data error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      groupInfo: null,
      members: [],
      memberPhotos: [],
      generatedPhoto: null,
      stats: { totalMembers: 0, photosUploaded: 0, waitingForPhotos: 0 }
    })
  }
}