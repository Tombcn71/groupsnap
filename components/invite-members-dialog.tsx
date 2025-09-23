"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Mail, Plus } from "lucide-react"

interface InviteMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
}

export function InviteMembersDialog({ open, onOpenChange, groupId, groupName }: InviteMembersDialogProps) {
  const [email, setEmail] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddEmail = () => {
    if (!email.trim()) return
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    if (emails.includes(email)) {
      setError("This email has already been added")
      return
    }

    setEmails([...emails, email])
    setEmail("")
    setError(null)
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(e => e !== emailToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddEmail()
    }
  }

  const handleInvite = async () => {
    if (emails.length === 0) {
      setError("Please add at least one email address")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Insert all invitations
      const invitations = emails.map(email => ({
        group_id: groupId,
        email: email.toLowerCase(),
        status: 'invited'
      }))

      const { error: insertError } = await supabase
        .from("group_members")
        .insert(invitations)

      if (insertError) {
        // Check if it's a duplicate email error
        if (insertError.code === '23505') {
          throw new Error("One or more email addresses are already invited to this group")
        }
        throw insertError
      }

      // TODO: Send invitation emails here
      // For now, we'll just show a success message
      
      toast.success(`Successfully invited ${emails.length} member(s) to ${groupName}!`)
      
      // Reset form
      setEmails([])
      setEmail("")
      onOpenChange(false)
      
      // Refresh the page to show updated member list
      window.location.reload()
    } catch (error: any) {
      console.error("Invitation error:", error)
      setError(error.message || "Failed to send invitations")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Members to {groupName}
          </DialogTitle>
          <DialogDescription>
            Add email addresses of people you want to invite to upload photos for your group.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleAddEmail}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Added Emails */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Invitations to send ({emails.length})</Label>
              <div className="flex flex-wrap gap-2">
                {emails.map((email, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveEmail(email)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleInvite} 
            disabled={isLoading || emails.length === 0}
            className="min-w-[100px]"
          >
            {isLoading ? "Inviting..." : `Invite ${emails.length || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
