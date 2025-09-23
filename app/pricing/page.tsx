import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PricingCard } from "@/components/pricing-card"

export default async function PricingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user's current subscription if logged in
  let currentPlan = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_name, subscription_status")
      .eq("id", user.id)
      .single()

    currentPlan = profile?.plan_name
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Start Free Trial
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            name="Starter"
            description="Perfect for small groups"
            price={29}
            priceId="starter"
            features={[
              "Up to 25 people per photo",
              "10 group photos per month",
              "HD quality downloads",
              "Basic backgrounds library",
              "Email support",
            ]}
            currentPlan={currentPlan}
            user={user}
          />

          <PricingCard
            name="Professional"
            description="For schools and companies"
            price={99}
            priceId="professional"
            features={[
              "Up to 100 people per photo",
              "Unlimited group photos",
              "4K quality downloads",
              "Premium backgrounds library",
              "Priority processing",
              "Priority support",
            ]}
            popular={true}
            currentPlan={currentPlan}
            user={user}
          />

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>For large organizations</CardDescription>
              <div className="text-3xl font-bold">Custom</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Unlimited people per photo</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Unlimited group photos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>8K quality downloads</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Custom backgrounds</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Custom integrations</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full bg-transparent">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">How does the free trial work?</h3>
              <p className="text-muted-foreground">
                Start with a 14-day free trial on any paid plan. No credit card required. You can cancel anytime during
                the trial period.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Is there a setup fee?</h3>
              <p className="text-muted-foreground">
                No setup fees. You only pay the monthly subscription fee. Enterprise plans may include custom setup
                assistance.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
