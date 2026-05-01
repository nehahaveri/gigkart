'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: () => void) => void
    }
  }
}

export function EscrowCheckout({
  jobId,
  onSuccess,
}: {
  jobId: string
  onSuccess?: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    setLoading(true)
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Failed to create order')
      setLoading(false)
      return
    }

    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: 'GigKart',
      description: `Escrow — ${data.job_title}`,
      order_id: data.order_id,
      handler: async (response: {
        razorpay_order_id: string
        razorpay_payment_id: string
        razorpay_signature: string
      }) => {
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...response,
            job_id: jobId,
          }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          toast.success('Escrow payment successful!')
          onSuccess?.()
        } else {
          toast.error(verifyData.error || 'Payment verification failed')
        }
        setLoading(false)
      },
      theme: { color: '#4f46e5' },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', () => {
      toast.error('Payment failed. Please try again.')
      setLoading(false)
    })
    rzp.open()
  }

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <Button onClick={handlePay} disabled={loading} className="w-full gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Shield className="h-4 w-4" />
            Pay Escrow
          </>
        )}
      </Button>
    </>
  )
}
