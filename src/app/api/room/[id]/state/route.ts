import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/session'
import { snapshotFor } from '@/lib/room'

/** Cheap polling endpoint: when nothing changed it only reads one integer. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const userId = await getSessionUserId(id)
  if (!userId) return NextResponse.json({ error: 'Not signed in to this room.' }, { status: 401, headers: { 'cache-control': 'no-store' } })

  const since = Number(new URL(req.url).searchParams.get('v'))
  const t0 = performance.now()
  const head = await prisma.room.findUnique({ where: { id }, select: { version: true } })
  // Server-Timing shows in the browser's network tab: `db` is the time spent talking to the database.
  const timing = { 'server-timing': `db;dur=${(performance.now() - t0).toFixed(1)}`, 'cache-control': 'no-store' }
  if (!head) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
  if (Number.isFinite(since) && since === head.version) {
    return NextResponse.json({ changed: false }, { headers: timing })
  }
  const snapshot = await snapshotFor(id, userId)
  if (!snapshot) return NextResponse.json({ error: 'Not signed in to this room.' }, { status: 401 })
  return NextResponse.json({ changed: true, snapshot }, { headers: { 'cache-control': 'no-store' } })
}
