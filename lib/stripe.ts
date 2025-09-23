import Stripe from "stripe"

let stripe: Stripe | null = null

// Only initialize Stripe if we have the secret key and we're not in build mode
if (
  (process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production") ||
  (process.env.NODE_ENV === "production" && typeof window === "undefined")
) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
      typescript: true,
    })
  } catch (error) {
    console.warn("Failed to initialize Stripe:", error)
    stripe = null
  }
}

export { stripe }

export const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || "",
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || "",
} as const

export type PlanType = keyof typeof PRICE_IDS
