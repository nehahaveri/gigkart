import { NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

const RAZORPAY_CONFIGURED =
  !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { job_id } = body

  if (!job_id) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
  }

  const job = await queryOne<{ id: string; poster_id: string; budget: string; title: string; status: string }>(
    'SELECT id, poster_id, budget, title, status FROM jobs WHERE id = $1',
    [job_id]
  )

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.poster_id !== session.userId) {
    return NextResponse.json({ error: 'Only the poster can pay' }, { status: 403 })
  }

  if (job.status !== 'open') {
    return NextResponse.json({ error: 'Job is not in open status' }, { status: 400 })
  }

  // Test mode — Razorpay not configured. Mark the job as escrow-funded
  if (!RAZORPAY_CONFIGURED) {
    const fakePaymentId = `test_payment_${Date.now()}`
    await execute(
      'UPDATE jobs SET escrow_payment_id = $1 WHERE id = $2',
      [fakePaymentId, job.id]
    )
    return NextResponse.json({
      test_mode: true,
      success: true,
      job_title: job.title,
      message: 'Payment skipped (test mode — Razorpay not configured).',
    })
  }

  // Real Razorpay flow
  const { getRazorpay } = await import('@/lib/payments/razorpay')
  const razorpay = getRazorpay()
  const amountPaise = Math.round(Number(job.budget) * 100)

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `job_${job.id}`,
    notes: {
      job_id: job.id,
      poster_id: session.userId,
      purpose: 'escrow',
    },
  })

  return NextResponse.json({
    order_id: order.id,
    amount: amountPaise,
    currency: 'INR',
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    job_title: job.title,
  })
}
