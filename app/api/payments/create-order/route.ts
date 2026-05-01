import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RAZORPAY_CONFIGURED =
  !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { job_id } = body

  if (!job_id) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, poster_id, budget, title, status')
    .eq('id', job_id)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.poster_id !== user.id) {
    return NextResponse.json({ error: 'Only the poster can pay' }, { status: 403 })
  }

  if (job.status !== 'open') {
    return NextResponse.json({ error: 'Job is not in open status' }, { status: 400 })
  }

  // Test mode — Razorpay not configured. Mark the job as escrow-funded
  // with a fake payment id so the rest of the flow proceeds normally.
  if (!RAZORPAY_CONFIGURED) {
    const fakePaymentId = `test_payment_${Date.now()}`
    await supabase
      .from('jobs')
      .update({ escrow_payment_id: fakePaymentId })
      .eq('id', job.id)

    return NextResponse.json({
      test_mode: true,
      success: true,
      job_title: job.title,
      message: 'Payment skipped (test mode — Razorpay not configured).',
    })
  }

  // Real Razorpay flow
  const { getRazorpay } = await import('@/lib/razorpay/client')
  const razorpay = getRazorpay()
  const amountPaise = Math.round(job.budget * 100)

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `job_${job.id}`,
    notes: {
      job_id: job.id,
      poster_id: user.id,
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
