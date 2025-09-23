import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { groupId, email } = await request.json()
    
    if (!groupId || !email) {
      return NextResponse.json({ error: "Missing groupId or email" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if already invited
    const { data: existing } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("email", email)
      .single()

    if (existing) {
      return NextResponse.json({ error: "User already invited" }, { status: 400 })
    }

    // Add member to group
    const { data, error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        email: email,
        status: "invited",
        invited_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to invite member" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      member: data,
      message: `✅ ${email} successfully invited!`
    })

  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
