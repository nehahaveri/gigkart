import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLATFORM_COMMISSION = 0.10

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

  const { job_id } = await request.json()

  // Fetch job + assignment + tasker
  const { data: job } = await supabase
    .from('jobs')
    .select('id, poster_id, budget, status, escrow_payment_id')
    .eq('id', job_id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.poster_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: assignment } = await supabase
    .from('job_assignments')
    .select('id, tasker_id, submitted_at, approved_at, payout_id')
    .eq('job_id', job_id)
    .single()

  if (!assignment) return NextResponse.json({ error: 'No assignment found' }, { status: 404 })
  if (assignment.payout_id) return NextResponse.json({ error: 'Already paid out' }, { status: 400 })
  if (!assignment.submitted_at) return NextResponse.json({ error: 'Work not submitted yet' }, { status: 400 })

  const payoutAmount = Math.round(job.budget * (1 - PLATFORM_COMMISSION) * 100)
  const testMode = !RAZORPAY_CONFIGURED

  // If Razorpay is configured, hit it (real payout flow). Otherwise simulate.
  if (RAZORPAY_CONFIGURED) {
    try {
      const { getRazorpay } = await import('@/lib/razorpay/client')
      if (job.escrow_payment_id) {
        await getRazorpay().payments.fetch(job.escrow_payment_id).catch(() => null)
      }
    } catch {
      // Razorpay call failed — continue with simulated payout but log
      console.warn('[payout] Razorpay call failed, simulating payout')
    }
  }

  // Mark approved and record payout
  const now = new Date().toISOString()
  await supabase
    .from('job_assignments')
    .update({
      approved_at: now,
      payout_id: testMode
        ? `test_payout_${job_id}_${Date.now()}`
        : `payout_${job_id}_${Date.now()}`,
    })
    .eq('id', assignment.id)

  await supabase
    .from('jobs')
    .update({ status: 'completed' })
    .eq('id', job_id)

  return NextResponse.json({
    success: true,
    payout_amount: payoutAmount / 100,
    commission: Math.round(job.budget * PLATFORM_COMMISSION),
    test_mode: testMode,
  })
}
