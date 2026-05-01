import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  // Use service role for webhook processing
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  switch (event.event) {
    case 'payment.captured': {
      const payment = event.payload.payment.entity
      const jobId = payment.notes?.job_id
      if (jobId) {
        await supabase
          .from('jobs')
          .update({ escrow_payment_id: payment.id })
          .eq('id', jobId)
      }
      break
    }

    case 'payment.failed': {
      const payment = event.payload.payment.entity
      const jobId = payment.notes?.job_id
      if (jobId) {
        // Notify poster that payment failed — job stays open without escrow
        await supabase.from('notifications').insert({
          user_id: payment.notes.poster_id,
          type: 'payment_failed',
          title: 'Payment failed',
          body: 'Your escrow payment could not be processed. Please try again.',
          data: { job_id: jobId },
        })
      }
      break
    }
  }

  return NextResponse.json({ status: 'ok' })
}
