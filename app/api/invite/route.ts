import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { groupId, emails } = await request.json()

    if (!groupId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Group ID and emails array required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is the group owner
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user owns the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("owner_id, name")
      .eq("id", groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    if (group.owner_id !== user.id) {
      return NextResponse.json({ error: "Only group owner can invite members" }, { status: 403 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(", ")}` }, 
        { status: 400 }
      )
    }

    // Check for existing invitations
    const { data: existingMembers } = await supabase
      .from("group_members")
      .select("email")
      .eq("group_id", groupId)
      .in("email", emails.map(email => email.toLowerCase()))

    const existingEmails = existingMembers?.map(m => m.email) || []
    const newEmails = emails.filter(email => !existingEmails.includes(email.toLowerCase()))

    if (newEmails.length === 0) {
      return NextResponse.json(
        { error: "All email addresses are already invited to this group" }, 
        { status: 400 }
      )
    }

    // Insert new invitations
    const invitations = newEmails.map(email => ({
      group_id: groupId,
      email: email.toLowerCase(),
      status: 'invited'
    }))

    const { error: insertError } = await supabase
      .from("group_members")
      .insert(invitations)

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ error: "Failed to create invitations" }, { status: 500 })
    }

    // TODO: Send invitation emails
    // This would integrate with an email service like SendGrid, Resend, etc.

    return NextResponse.json({
      success: true,
      invited: newEmails.length,
      skipped: existingEmails.length,
      message: `Successfully invited ${newEmails.length} member(s)${existingEmails.length > 0 ? `, ${existingEmails.length} already invited` : ""}`
    })

  } catch (error) {
    console.error("Invitation error:", error)
    return NextResponse.json(
      { error: "Failed to process invitations" }, 
      { status: 500 }
    )
  }
}
