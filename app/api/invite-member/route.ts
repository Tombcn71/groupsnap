import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

export const runtime = 'nodejs'
// Force deployment trigger

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
      .maybeSingle()

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
      return NextResponse.json({ error: "Failed to invite member: " + error.message }, { status: 500 })
    }

    // Send email with Resend
    let emailSent = false
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        await resend.emails.send({
          from: 'GroupSnap <onboarding@resend.dev>',
          to: [email],
          subject: '📸 You\'re invited to join a GroupSnap photo!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">📸 GroupSnap Invitation</h1>
              <p>You've been invited to join a group photo!</p>
              <p>Click the link below to upload your photo:</p>
                     <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-group-photo-generator.vercel.app'}/join/${groupId}?email=${encodeURIComponent(email)}"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Join Group Photo
              </a>
              <p style="margin-top: 20px; color: #666;">
                This invitation was sent via GroupSnap - AI-powered group photo generation.
              </p>
            </div>
          `
        })
        
        emailSent = true
      } catch (emailError) {
        console.error("Email sending failed:", emailError)
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      member: data,
      emailSent,
      message: emailSent 
        ? `✅ ${email} invited & email sent!` 
        : `✅ ${email} invited (email not configured)`
    })

  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}