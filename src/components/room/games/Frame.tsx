'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { gameById } from '@/games/registry'
import { useRoom } from '../store'
import { cn, NameTag, PLAYER_COLORS, ProgressBar, Spinner } from '@/components/ui'

export function usePlayers() {
  const { snap } = useRoom()
  const me = { ...snap.me, index: snap.myIndex }
  const partnerIndex = (1 - snap.myIndex) as 0 | 1
  const partner = snap.partner ? { ...snap.partner, index: partnerIndex } : null
  /** players in join order, so index 0 is always rose and 1 is always violet */
  const ordered = snap.myIndex === 0 ? [me, partner!] : [partner!, me]
  return { me, partner: partner!, ordered }
}

export function GameFrame({ gameId, progress, unit = 'Question', children, actions }: { gameId: string; progress?: { index: number; total: number }; unit?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const { act, busy } = useRoom()
  const def = gameById(gameId)
  const [confirming, setConfirming] = useState(false)
  return (
    <section className="animate-rise mx-auto w-full max-w-2xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-xl shadow-lg', def?.gradient ?? 'from-pink-500 to-rose-500')} aria-hidden>{def?.emoji}</span>
          <div className="min-w-0">
            <h2 className="display truncate text-lg leading-tight font-bold">{def?.title ?? 'Game'}</h2>
            {progress && <p className="text-xs text-white/55">{unit} {Math.min(progress.index + 1, progress.total)} of {progress.total}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <button className="btn btn-soft btn-sm" onClick={() => setConfirming(false)}>Keep playing</button>
              <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act({ type: 'game.stop' })}>End</button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>Exit</button>
          )}
        </div>
      </div>
      {progress && <ProgressBar value={(progress.index + (0.0001)) / progress.total} className="mb-4" />}
      {children}
    </section>
  )
}

export function WaitingNote({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="glass flex flex-col items-center gap-2 p-6 text-center">
      <Spinner className="h-5 w-5" />
      <p className="text-base font-semibold text-white/90">{text}</p>
      {sub && <p className="max-w-xs text-sm text-white/55">{sub}</p>}
    </div>
  )
}

/** "Priya answered ✓" chip: social pressure to answer, without leaking the answer. */
export function PartnerStatus({ name, done, index, doneText = 'answered', waitText = 'thinking…' }: { name: string; done: boolean; index: 0 | 1; doneText?: string; waitText?: string }) {
  const c = PLAYER_COLORS[index]
  return (
    <span className={cn('chip', done ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : c.text)}>
      {done ? '✓' : <Spinner className="h-3 w-3" />} {name} {done ? doneText : waitText}
    </span>
  )
}

export function AnswerCard({ name, emoji, index, children, highlight }: { name: string; emoji: string; index: 0 | 1; children: React.ReactNode; highlight?: boolean }) {
  const c = PLAYER_COLORS[index]
  return (
    <motion.div initial={{ opacity: 0, y: 12, rotateX: -12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 20, delay: index * 0.12 }} className={cn('rounded-2xl border p-4', c.bg, highlight ? 'border-pink-300/70 shadow-[0_0_30px_-6px_rgba(244,114,182,0.6)]' : c.border)}>
      <NameTag name={name} emoji={emoji} index={index} />
      <p className="mt-2.5 text-[15px] leading-snug font-medium break-words text-white">{children}</p>
    </motion.div>
  )
}

export function ReadyButton({ label = 'Next', meReady, partnerName, partnerReady, onClick, disabled }: { label?: string; meReady: boolean; partnerName: string; partnerReady: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <button className="btn btn-primary w-full sm:w-auto sm:min-w-52" disabled={disabled || meReady} onClick={onClick}>
        {meReady ? `Waiting for ${partnerName}…` : label}
      </button>
      {partnerReady && !meReady && <p className="text-xs text-emerald-300">✓ {partnerName} is ready</p>}
    </div>
  )
}

export function BigScore({ percent, label }: { percent: number; label: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto grid h-36 w-36 place-items-center" role="img" aria-label={`${percent}% ${label}`}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke="url(#g)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - percent / 100) }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <div className="display text-4xl font-black">{percent}%</div>
        <div className="text-[11px] font-bold tracking-wider text-white/55 uppercase">{label}</div>
      </div>
    </div>
  )
}
