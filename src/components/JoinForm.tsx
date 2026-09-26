'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AVATARS } from '@/lib/level'
import { cn, FloatingHearts, Spinner } from '@/components/ui'
import { SITE } from '@/config/site'

/** Used for two things: creating a room (no roomId/code) and joining one (roomId from an invite link, or a typed code). */
export function AvatarPicker({ value, onChange, disabled }: { value: string; onChange: (a: string) => void; disabled?: string }) {
  return (
    <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Choose your avatar">
      {AVATARS.map((a) => (
        <button key={a} type="button" role="radio" aria-checked={value === a} disabled={a === disabled} onClick={() => onChange(a)} className={cn('grid aspect-square place-items-center rounded-xl text-2xl transition disabled:opacity-25', value === a ? 'bg-pink-500/30 ring-2 ring-pink-400' : 'bg-white/[0.06] hover:bg-white/15')}>{a}</button>
      ))}
    </div>
  )
}

export default function JoinForm({ roomId, hostName, hostAvatar }: { roomId: string; hostName: string; hostAvatar: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS.find((a) => a !== hostAvatar) ?? AVATARS[1])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const join = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/rooms/join', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roomId, name, avatar }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'Could not join.'); return }
      router.refresh()
    } catch {
      setError('You seem to be offline.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-5">
      <FloatingHearts />
      <form onSubmit={join} className="glass-strong animate-pop w-full max-w-md p-7">
        <div className="text-center">
          <div className="text-5xl" aria-hidden>{hostAvatar}</div>
          <h1 className="display mt-3 text-3xl font-black text-balance">{hostName} invited you to play 💕</h1>
          <p className="mt-2 text-sm text-white/60">Pick a name and jump in. No sign-up, no download.</p>
        </div>
        <label className="label mt-6" htmlFor="join-name">Your name</label>
        <input id="join-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} required autoFocus autoComplete="given-name" placeholder="What does your partner call you?" />
        <p className="label mt-4">Your avatar</p>
        <AvatarPicker value={avatar} onChange={setAvatar} disabled={hostAvatar} />
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy || !name.trim()}>{busy ? <Spinner /> : `Join ${hostName} 💞`}</button>
        <p className="mt-4 text-center text-[11px] text-white/40">Private to the two of you · {SITE.name}</p>
      </form>
    </main>
  )
}
