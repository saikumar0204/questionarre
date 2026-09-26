import type { Metadata } from 'next'
import Link from 'next/link'
import { getSessionUserId } from '@/lib/session'
import { loadRoom, buildSnapshot } from '@/lib/room'
import JoinForm from '@/components/JoinForm'
import RoomClient from './RoomClient'
import { SITE } from '@/config/site'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Your room', robots: { index: false, follow: false } }

function Message({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="glass-strong w-full max-w-md p-8 text-center">
        <div className="text-5xl" aria-hidden>{emoji}</div>
        <h1 className="display mt-3 text-2xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-white/60">{body}</p>
        <Link href="/" className="btn btn-primary mt-6">Go to {SITE.name}</Link>
      </div>
    </main>
  )
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const room = await loadRoom(id).catch(() => null)
  if (!room) return <Message emoji="🔍" title="We couldn’t find that room" body="The link may be wrong, or the room was removed after a long time of no activity. You can create a new one in seconds." />

  const userId = await getSessionUserId(id)
  const snapshot = userId ? buildSnapshot(room, userId) : null
  if (snapshot) return <RoomClient initial={snapshot} />

  if (room.users.length >= 2) {
    return <Message emoji="💞" title="This room already has two people" body="Rooms are just for two. If this is your room, open the link on the device you first joined from. Otherwise, create your own room." />
  }
  const host = room.users[0]
  return <JoinForm roomId={id} hostName={host?.name ?? 'Your partner'} hostAvatar={host?.avatar ?? '💗'} />
}
