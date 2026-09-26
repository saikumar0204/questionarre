import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Quick check that the app can reach its database. Exposes only an error code, never details. */
export async function GET() {
  const t0 = performance.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, dbMs: Math.round(performance.now() - t0) }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : 'unknown'
    console.error('[health] database check failed', e)
    return NextResponse.json({ ok: false, code }, { status: 503, headers: { 'cache-control': 'no-store' } })
  }
}
