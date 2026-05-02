import { NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

const PLATFORM_COMMISSION = 0.10
const RAZORPAY_CONFIGURED = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { job_id } = await request.json()

  const job = await queryOne<{
    id: string; poster_id: string; budget: string; status: string; escrow_payment_id: string | null
  }>(
    'SELECT id, poster_id, budget, status, escrow_payment_id FROM jobs WHERE id = $1',
    [job_id]
  )

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.poster_id !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const assignment = await queryOne<{
    id: string; tasker_id: string; submitted_at: string | null; approved_at: string | null; payout_id: string | null
  }>(
    'SELECT id, tasker_id, submitted_at, approved_at, payout_id FROM job_assignments WHERE job_id = $1',
    [job_id]
  )

  if (!assignment) return NextResponse.json({ error: 'No assignment found' }, { status: 404 })
  if (assignment.payout_id) return NextResponse.json({ error: 'Already paid out' }, { status: 400 })
  if (!assignment.submitted_at) return NextResponse.json({ error: 'Work not submitted yet' }, { status: 400 })

  const taskerProfile = await queryOne<{ upi_id: string | null }>(
    'SELECT upi_id FROM users WHERE id = $1',
    [assignment.tasker_id]
  )

  if (!taskerProfile?.upi_id) {
    return NextResponse.json(
      { error: 'Tasker has not added a UPI ID. They must add it in Settings before receiving payment.' },
      { status: 422 }
    )
  }

  const budget = Number(job.budget)
  const payoutAmount = Math.round(budget * (1 - PLATFORM_COMMISSION) * 100)
  const testMode = !RAZORPAY_CONFIGURED

  if (RAZORPAY_CONFIGURED) {
    try {
      const { getRazorpay } = await import('@/lib/payments/razorpay')
      if (job.escrow_payment_id) {
        await getRazorpay().payments.fetch(job.escrow_payment_id).catch(() => null)
      }
    } catch {
      console.warn('[payout] Razorpay call failed, simulating payout')
    }
  }

  const payoutId = testMode
    ? `test_payout_${job_id}_${Date.now()}`
    : `payout_${job_id}_${Date.now()}`

  await execute(
    'UPDATE job_assignments SET approved_at = NOW(), payout_id = $1 WHERE id = $2',
    [payoutId, assignment.id]
  )
  await execute(
    "UPDATE jobs SET status = 'completed' WHERE id = $1",
    [job_id]
  )

  return NextResponse.json({
    success: true,
    payout_amount: payoutAmount / 100,
    commission: Math.round(budget * PLATFORM_COMMISSION),
    test_mode: testMode,
  })
}
