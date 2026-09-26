'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import type { Snapshot } from '@/lib/room'
import { RoomProvider, useRoom } from '@/components/room/store'
import { GameMenu } from '@/components/room/GameMenu'
import { GameRouter } from '@/components/room/games/GameRouter'
import { SparkCard } from '@/components/room/SparkCard'
import { CouponsPanel, DatesPanel, GiftsPanel, IncomingGift, UsPanel } from '@/components/room/Panels'
import { Avatar, cn, FloatingHearts } from '@/components/ui'
import { gameById } from '@/games/registry'
import { SITE } from '@/config/site'
import { leaveRoomOnThisDevice } from '../../actions'

type Tab = 'play' | 'love' | 'dates' | 'us'
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'play', label: 'Play', emoji: '🎮' },
  { id: 'love', label: 'Love', emoji: '💌' },
  { id: 'dates', label: 'Dates', emoji: '🗓️' },
  { id: 'us', label: 'Us', emoji: '💞' },
]

export default function RoomClient({ initial }: { initial: Snapshot }) {
  useEffect(() => {
    // remember the room on this device so the home page can offer "Continue"
    try {
      const saved = JSON.parse(localStorage.getItem('soulsync:rooms') || '[]') as { id: string }[]
      const next = [{ id: initial.roomId, code: initial.code, me: initial.me.name, partner: initial.partner?.name ?? null, at: Date.now() }, ...saved.filter((r) => r.id !== initial.roomId)].slice(0, 5)
      localStorage.setItem('soulsync:rooms', JSON.stringify(next))
    } catch {
      /* private mode */
    }
  }, [initial.roomId, initial.code, initial.me.name, initial.partner?.name])

  return (
    <RoomProvider initial={initial}>
      <FloatingHearts />
      <Shell />
    </RoomProvider>
  )
}

function Shell() {
  const { snap, connection } = useRoom()
  const [tab, setTab] = useState<Tab>('play')
  const [loveTab, setLoveTab] = useState<'gifts' | 'coupons'>('gifts')

  if (!snap.partner) return <WaitingRoom />

  const p0 = snap.myIndex === 0 ? snap.me : snap.partner
  const p1 = snap.myIndex === 0 ? snap.partner : snap.me
  const game = snap.activeGame ? gameById(snap.activeGame) : null

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-28 sm:pb-10">
      <IncomingGift />

      <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-night/80 px-4 py-2.5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="display flex items-center gap-1.5 text-lg font-black" aria-label={`${SITE.name} home`}>
            <span aria-hidden>💞</span><span className="hidden sm:inline">{SITE.name}</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <Avatar emoji={p0.avatar} index={0} size="sm" />
            <div className="min-w-0 text-center leading-tight">
              <p className="truncate text-sm font-bold">{p0.name} <span className="text-pink-300">&</span> {p1.name}</p>
              <p className="text-[11px] text-white/55">{snap.level.emoji} {snap.level.title}{snap.spark && snap.spark.streak > 0 ? ` · 🔥 ${snap.spark.streak}` : ''}</p>
            </div>
            <Avatar emoji={p1.avatar} index={1} size="sm" />
          </div>
          <span className={cn('chip shrink-0', connection === 'reconnecting' && 'border-amber-400/50 text-amber-200')} title={connection === 'live' ? 'Connected' : 'Reconnecting…'}>
            <span className={cn('h-2 w-2 rounded-full', connection === 'live' ? 'bg-emerald-400' : 'animate-pulse bg-amber-400')} />
            {snap.me.points} 💕
          </span>
        </div>
      </header>

      <nav className="mt-4 hidden gap-1.5 sm:flex" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('btn flex-1', tab === t.id ? 'btn-primary' : 'btn-ghost')} aria-current={tab === t.id}>{t.emoji} {t.label}</button>
        ))}
      </nav>

      <main className="mt-5 flex-1">
        {tab !== 'play' && game && (
          <button onClick={() => setTab('play')} className="glass mb-4 flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold">
            <span>{game.emoji} {game.title} is in progress</span><span className="text-pink-200">Back to game →</span>
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={tab + (tab === 'love' ? loveTab : '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'play' && (snap.game && snap.activeGame ? <GameRouter view={snap.game} /> : (
              <div className="space-y-8">
                <SparkCard />
                <GameMenu />
              </div>
            ))}
            {tab === 'love' && (
              <div>
                <div className="glass mb-4 grid grid-cols-2 gap-1 p-1">
                  {(['gifts', 'coupons'] as const).map((t) => <button key={t} onClick={() => setLoveTab(t)} className={cn('btn btn-sm', loveTab === t ? 'btn-primary' : '!bg-transparent text-white/70')}>{t === 'gifts' ? '💐 Gifts & notes' : '🎟️ Love coupons'}</button>)}
                </div>
                {loveTab === 'gifts' ? <GiftsPanel /> : <CouponsPanel />}
              </div>
            )}
            {tab === 'dates' && <DatesPanel />}
            {tab === 'us' && (
              <div className="space-y-5">
                <UsPanel />
                <LeaveButton roomId={snap.roomId} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-night/90 backdrop-blur-xl sm:hidden" aria-label="Sections">
        <div className="mx-auto grid max-w-3xl grid-cols-4">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition', tab === t.id ? 'text-pink-300' : 'text-white/50')} aria-current={tab === t.id}>
              <span className={cn('text-xl transition', tab === t.id && 'scale-110')} aria-hidden>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

function LeaveButton({ roomId }: { roomId: string }) {
  const [sure, setSure] = useState(false)
  return (
    <div className="glass p-4 text-center">
      {sure ? (
        <div className="space-y-2">
          <p className="text-sm text-white/70">Sign out of this room on this device? You can rejoin from the invite link, but only while you keep your room code.</p>
          <div className="flex justify-center gap-2">
            <button className="btn btn-soft btn-sm" onClick={() => setSure(false)}>Stay</button>
            <form action={leaveRoomOnThisDevice.bind(null, roomId)}><button className="btn btn-primary btn-sm">Sign out</button></form>
          </div>
        </div>
      ) : (
        <button className="text-xs font-semibold text-white/45 hover:text-white/70" onClick={() => setSure(true)}>Sign out of this room on this device</button>
      )}
    </div>
  )
}

function WaitingRoom() {
  const { snap, toast } = useRoom()
  const [link, setLink] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setLink(`${window.location.origin}/room/${snap.roomId}`), 0)
    return () => clearTimeout(t)
  }, [snap.roomId])

  const message = `${snap.me.name} invited you to play on ${SITE.name} 💕 Tap to join — no sign-up needed: ${link}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast('Invite link copied 📋') } catch { toast('Copy failed — select the link manually.', 'error') }
  }
  const share = async () => {
    try { if (navigator.share) await navigator.share({ text: message }); else await copy() } catch { /* cancelled */ }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <div className="glass-strong animate-pop w-full p-7">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-pink-500/20" aria-hidden />
          <Avatar emoji={snap.me.avatar} index={snap.myIndex} size="lg" />
        </div>
        <h1 className="display mt-4 text-3xl font-black text-balance">Hi {snap.me.name}! Now invite your partner</h1>
        <p className="mt-2 text-sm text-white/60">Send them this link. When they open it, you’ll both land here — no downloads, no accounts.</p>

        <div className="mt-5 grid gap-2">
          <a className="btn btn-primary" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">💬 Send on WhatsApp</a>
          <button className="btn btn-soft" onClick={share}>📤 Share…</button>
          <button className="btn btn-ghost" onClick={copy}>📋 Copy link</button>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-3">
          <p className="text-[11px] font-bold tracking-wider text-white/45 uppercase">Or share the room code</p>
          <p className="display mt-1 text-3xl font-black tracking-[0.35em] text-pink-200">{snap.code}</p>
          <p className="text-xs text-white/45">They can enter it on {SITE.domain}</p>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-white/50"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Waiting for your partner… this page updates by itself</p>
      </div>
    </div>
  )
}
