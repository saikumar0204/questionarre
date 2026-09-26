'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AVATARS } from '@/lib/level'
import { AvatarPicker } from '@/components/JoinForm'
import { cn, Spinner } from '@/components/ui'

type Saved = { id: string; code: string; me: string; partner: string | null; at: number }

export default function StartForms() {
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<Saved[]>([])

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setSaved(JSON.parse(localStorage.getItem('soulsync:rooms') || '[]'))
      } catch {
        setSaved([])
      }
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await fetch(mode === 'create' ? '/api/rooms' : '/api/rooms/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mode === 'create' ? { name, avatar, tz } : { code, name, avatar }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }
      router.push(`/room/${data.roomId}`)
    } catch {
      setError('You seem to be offline. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass-strong animate-rise w-full max-w-md p-5 sm:p-6" id="start">
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-black/30 p-1" role="tablist">
        {(['create', 'join'] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError('') }} className={cn('btn btn-sm !min-h-10', mode === m ? 'btn-primary' : '!bg-transparent text-white/70')}>
            {m === 'create' ? '✨ Start a room' : '🔑 Join with code'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'join' && (
          <div>
            <label className="label" htmlFor="code">Room code</label>
            <input id="code" className="field text-center font-mono text-xl tracking-[0.4em] uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={7} placeholder="ABC123" autoComplete="off" required />
          </div>
        )}
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="What does your partner call you?" autoComplete="given-name" required />
        </div>
        <div>
          <p className="label">Pick your avatar</p>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
        <button className="btn btn-primary w-full !min-h-12 text-base" disabled={busy || !name.trim() || (mode === 'join' && code.replace(/\W/g, '').length < 6)}>
          {busy ? <Spinner /> : mode === 'create' ? 'Create our room 💞' : 'Join the room 💞'}
        </button>
        <p className="text-center text-[11px] text-white/40">Free · no account · works on any phone</p>
      </form>

      {saved.length > 0 && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="label">Continue where you left off</p>
          <ul className="space-y-1.5">
            {saved.map((r) => (
              <li key={r.id}>
                <Link href={`/room/${r.id}`} className="option !py-2.5 text-sm">
                  <span aria-hidden>💞</span>
                  <span className="flex-1 truncate">{r.me}{r.partner ? ` & ${r.partner}` : ' (waiting for partner)'}</span>
                  <span className="font-mono text-xs text-white/40">{r.code}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
