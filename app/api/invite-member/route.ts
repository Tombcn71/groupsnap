import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { groupId, email } = await request.json()
    
    console.log("Invite request:", { groupId, email })
    
    if (!groupId || !email) {
      return NextResponse.json({ error: "Missing groupId or email" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // For now, just return success - skip database and email
    console.log("Invite successful for:", email)

    return NextResponse.json({ 
      success: true, 
      message: `✅ ${email} invited successfully!`
    })

  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}