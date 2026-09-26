import { PrismaClient } from '@prisma/client'

const g = globalThis as unknown as { __prisma?: PrismaClient }

/**
 * Serverless functions each open their own database connections, and idle ones linger. With a small Postgres
 * limit, a burst of traffic can exhaust every connection. One connection per function instance is plenty for
 * this app's short queries, so default to that (an explicit `connection_limit` in DATABASE_URL still wins).
 */
function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url || !/^postgres(ql)?:/i.test(url) || /[?&]connection_limit=/.test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}connection_limit=1&pool_timeout=20`
}

export const prisma = g.__prisma ?? new PrismaClient({ datasources: databaseUrl() ? { db: { url: databaseUrl()! } } : undefined })
if (process.env.NODE_ENV !== 'production') g.__prisma = prisma
