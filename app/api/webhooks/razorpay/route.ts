import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { execute } from '@/lib/db'

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

  switch (event.event) {
    case 'payment.captured': {
      const payment = event.payload.payment.entity
      const jobId = payment.notes?.job_id
      if (jobId) {
        await execute(
          'UPDATE jobs SET escrow_payment_id = $1 WHERE id = $2',
          [payment.id, jobId]
        )
      }
      break
    }

    case 'payment.failed': {
      const payment = event.payload.payment.entity
      const jobId = payment.notes?.job_id
      const posterId = payment.notes?.poster_id
      if (jobId && posterId) {
        await execute(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1, 'payment_failed', 'Payment failed',
                   'Your escrow payment could not be processed. Please try again.', $2)`,
          [posterId, JSON.stringify({ job_id: jobId })]
        )
      }
      break
    }
  }

  return NextResponse.json({ status: 'ok' })
}
