import { NextResponse } from 'next/server'
import { joinRoom } from '@/lib/room'
import { getSessionUserId, setSession } from '@/lib/session'
import { guard } from '@/lib/http'

export function POST(req: Request) {
  return guard(() => handle(req))
}

async function handle(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Bad request.' }, { status: 400 })

  // Someone who is already in this room (e.g. refreshed the invite link) just gets taken back in.
  if (typeof body.roomId === 'string' && (await getSessionUserId(body.roomId))) {
    return NextResponse.json({ roomId: body.roomId, rejoined: true })
  }
  const r = await joinRoom({ roomId: body.roomId, code: body.code, name: body.name, avatar: body.avatar })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status ?? 400 })
  await setSession(r.roomId, r.userId)
  return NextResponse.json({ roomId: r.roomId })
}
