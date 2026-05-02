// ─────────────────────────────────────────────────────────────────────────────
// BACKEND LAYER — Razorpay SDK Singleton
// Server-only. Lazy-instantiated so missing keys don't crash startup.
// Use RAZORPAY_CONFIGURED guard before calling getRazorpay() in API routes.
// ─────────────────────────────────────────────────────────────────────────────
import Razorpay from 'razorpay'

let instance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  }
  return instance
}
