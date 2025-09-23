import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
})

export const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
} as const

export type PlanType = keyof typeof PRICE_IDS
