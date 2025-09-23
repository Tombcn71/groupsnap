"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ExternalLink, Loader2 } from "lucide-react"
import { createPortalSession } from "@/app/actions/stripe"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

interface SubscriptionCardProps {
  profile: any
  subscription: any
}

export function SubscriptionCard({ profile, subscription }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      await createPortalSession()
    } catch (error) {
      console.error("Portal error:", error)
      toast.error("Failed to open billing portal")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "past_due":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "canceled":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getPlanName = (planName: string | null) => {
    if (!planName) return "Free"
    return planName.charAt(0).toUpperCase() + planName.slice(1)
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Subscription & Billing
        </CardTitle>
        <CardDescription>Manage your subscription and billing information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-lg font-semibold">{getPlanName(profile?.plan_name)}</p>
              {profile?.subscription_status && (
                <Badge className={getStatusColor(profile.subscription_status)}>{profile.subscription_status}</Badge>
              )}
            </div>
          </div>

          {subscription && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Next Billing Date</label>
              <p className="text-foreground mt-1">{new Date(subscription.current_period_end).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {subscription ? (
            <Button onClick={handleManageSubscription} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </>
              )}
            </Button>
          ) : (
            <Link href="/pricing" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90">Upgrade Plan</Button>
            </Link>
          )}

          <Link href="/pricing">
            <Button variant="outline">View All Plans</Button>
          </Link>
        </div>

        {!subscription && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Free Plan Limits</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 1 group photo per month</li>
              <li>• Up to 10 people per photo</li>
              <li>• Basic backgrounds only</li>
              <li>• Standard quality downloads</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
