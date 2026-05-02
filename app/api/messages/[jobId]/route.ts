import { NextResponse } from 'next/server'
import { query, execute, queryOne } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

type Props = { params: Promise<{ jobId: string }> }

/**
 * GET /api/messages/[jobId]
 * Returns messages for a job. Caller must be poster or tasker.
 * Query param: after (ISO timestamp) — only return messages newer than this.
 */
export async function GET(request: Request, { params }: Props) {
  const { jobId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Access check
  const [job, assignment] = await Promise.all([
    queryOne<{ poster_id: string }>('SELECT poster_id FROM jobs WHERE id = $1', [jobId]),
    queryOne<{ tasker_id: string }>('SELECT tasker_id FROM job_assignments WHERE job_id = $1', [jobId]),
  ])

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isPoster = job.poster_id === session.userId
  const isTasker = assignment?.tasker_id === session.userId
  if (!isPoster && !isTasker) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const after = searchParams.get('after')

  const messages = after
    ? await query(
        `SELECT m.id, m.sender_id, m.body, m.created_at, u.full_name AS sender_name
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.job_id = $1 AND m.created_at > $2
         ORDER BY m.created_at ASC`,
        [jobId, after]
      )
    : await query(
        `SELECT m.id, m.sender_id, m.body, m.created_at, u.full_name AS sender_name
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.job_id = $1
         ORDER BY m.created_at ASC
         LIMIT 200`,
        [jobId]
      )

  return NextResponse.json(messages)
}

/**
 * POST /api/messages/[jobId]
 * Send a message. Body: { body: string }
 */
export async function POST(request: Request, { params }: Props) {
  const { jobId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Access check
  const [job, assignment] = await Promise.all([
    queryOne<{ poster_id: string }>('SELECT poster_id FROM jobs WHERE id = $1', [jobId]),
    queryOne<{ tasker_id: string }>('SELECT tasker_id FROM job_assignments WHERE job_id = $1', [jobId]),
  ])

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isPoster = job.poster_id === session.userId
  const isTasker = assignment?.tasker_id === session.userId
  if (!isPoster && !isTasker) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { body } = await request.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

  await execute(
    'INSERT INTO messages (job_id, sender_id, body) VALUES ($1, $2, $3)',
    [jobId, session.userId, body.trim()]
  )

  return NextResponse.json({ success: true })
}
