import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * GET /api/jobs
 * Query params: lat, lng, radius_km, category, limit, offset
 * Returns jobs via the nearby_jobs PostgreSQL function.
 * Used by the client-side JobsFeed component.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat       = parseFloat(searchParams.get('lat')       ?? '19.076')
  const lng       = parseFloat(searchParams.get('lng')       ?? '72.8777')
  const radiusKm  = parseFloat(searchParams.get('radius_km') ?? '50')
  const category  = searchParams.get('category') || null
  const limit     = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 100)
  const offset    = parseInt(searchParams.get('offset') ?? '0', 10)

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 })
  }

  const jobs = await query(
    'SELECT * FROM nearby_jobs($1, $2, $3, $4, $5, $6)',
    [lat, lng, radiusKm, category, limit, offset]
  )

  return NextResponse.json(jobs)
}
