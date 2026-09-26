import { NextResponse } from 'next/server'
import { createRoom } from '@/lib/room'
import { setSession } from '@/lib/session'
import { guard } from '@/lib/http'

export function POST(req: Request) {
  return guard(() => handle(req))
}

async function handle(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  const r = await createRoom({ name: body.name, avatar: body.avatar, tz: body.tz })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status ?? 400 })
  await setSession(r.roomId, r.userId)
  return NextResponse.json({ roomId: r.roomId, code: r.code })
}
