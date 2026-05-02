import { NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { createHmac } from 'crypto'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    job_id,
  } = body

  // Verify signature
  const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const job = await queryOne<{ poster_id: string }>(
    'SELECT poster_id FROM jobs WHERE id = $1',
    [job_id]
  )

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.poster_id !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await execute(
    'UPDATE jobs SET escrow_payment_id = $1 WHERE id = $2',
    [razorpay_payment_id, job_id]
  )

  return NextResponse.json({ success: true })
}
