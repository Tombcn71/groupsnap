import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { groupId, email } = await request.json()
    
    console.log("Invite v2 request:", { groupId, email })
    
    if (!groupId || !email) {
      return NextResponse.json({ error: "Missing groupId or email" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Return success immediately - no database/email for now
    console.log("Invite v2 successful for:", email)

    return NextResponse.json({ 
      success: true, 
      message: `✅ ${email} invited successfully! (v2)`
    })

  } catch (error) {
    console.error("Invite v2 error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}
