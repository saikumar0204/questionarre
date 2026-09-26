import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { act } from '@/lib/room'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const userId = await getSessionUserId(id)
  if (!userId) return NextResponse.json({ error: 'Not signed in to this room.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || typeof body.type !== 'string') {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
  const r = await act(id, userId, body)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status ?? 400, headers: { 'cache-control': 'no-store' } })
  return NextResponse.json({ snapshot: r.snapshot, toast: r.toast }, { headers: { 'cache-control': 'no-store' } })
}
