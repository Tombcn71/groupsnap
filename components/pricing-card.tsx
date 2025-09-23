"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Loader2 } from "lucide-react"
import { createCheckoutSession } from "@/app/actions/stripe"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

interface PricingCardProps {
  name: string
  description: string
  price: number
  priceId: "starter" | "professional"
  features: string[]
  popular?: boolean
  currentPlan?: string | null
  user?: any
}

export function PricingCard({
  name,
  description,
  price,
  priceId,
  features,
  popular,
  currentPlan,
  user,
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isCurrentPlan = currentPlan === priceId
  const hasActivePlan = currentPlan && currentPlan !== "free"

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to subscribe")
      return
    }

    setIsLoading(true)
    try {
      await createCheckoutSession(priceId)
    } catch (error) {
      console.error("Subscription error:", error)
      toast.error("Failed to start subscription process")
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan"
    if (hasActivePlan) return "Switch Plan"
    return "Start Free Trial"
  }

  const getButtonVariant = () => {
    if (isCurrentPlan) return "outline"
    if (popular) return "default"
    return "outline"
  }

  return (
    <Card className={`border-border/50 relative ${popular ? "border-primary/50 bg-primary/5" : ""}`}>
      {popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {name}
          {isCurrentPlan && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="text-3xl font-bold">
          ${price}
          <span className="text-lg font-normal text-muted-foreground">/month</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {user ? (
          <Button
            className={`w-full ${popular ? "bg-primary hover:bg-primary/90" : ""}`}
            variant={getButtonVariant()}
            onClick={handleSubscribe}
            disabled={isLoading || isCurrentPlan}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              getButtonText()
            )}
          </Button>
        ) : (
          <Link href="/auth/signup">
            <Button
              className={`w-full ${popular ? "bg-primary hover:bg-primary/90" : ""}`}
              variant={getButtonVariant()}
            >
              Start Free Trial
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
