// ─────────────────────────────────────────────────────────────────────────────
// DATA LAYER — PostgreSQL Connection Pool
// Server-only. Never import from client components.
// Uses node-postgres (pg) with a singleton pool to survive Next.js hot-reloads.
// ─────────────────────────────────────────────────────────────────────────────
import { Pool } from 'pg'

// Singleton pool — reused across hot-reloads in dev
declare global {
  var __pgPool: Pool | undefined
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })
}

export const db: Pool =
  process.env.NODE_ENV === 'production'
    ? createPool()
    : (globalThis.__pgPool ??= createPool())

/** Run a query and return all rows typed as T. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await db.query(sql, params)
  return rows as T[]
}

/** Run a query and return the first row, or null. */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const { rows } = await db.query(sql, params)
  return (rows[0] ?? null) as T | null
}

/** Run a query that doesn't return rows (INSERT/UPDATE/DELETE). */
export async function execute(sql: string, params?: unknown[]): Promise<void> {
  await db.query(sql, params)
}

/**
 * Run a COUNT(*) query and return the numeric result.
 * The sql should be of the form: SELECT COUNT(*) FROM ...
 */
export async function count(sql: string, params?: unknown[]): Promise<number> {
  const { rows } = await db.query(sql, params)
  return parseInt(rows[0]?.count ?? rows[0]?.cnt ?? '0', 10)
}
