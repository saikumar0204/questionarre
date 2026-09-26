'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { TodView } from '@/games/engines/tod'
import { GAMES } from '@/games/registry'
import { useRoom } from '../store'
import { GameFrame, usePlayers } from './Frame'
import { cn, HeartBurst, NameTag, useCelebrate } from '@/components/ui'

const LEVELS = GAMES.find((g) => g.id === 'tod')!.option!.choices

export function TodGame({ view }: { view: TodView }) {
  const { send, busy } = useRoom()
  const { me, partner, ordered } = usePlayers()
  const performer = ordered.find((p) => p.id === view.performer.id) ?? me
  const judge = performer.id === me.id ? partner : me
  const celebrate = useCelebrate(view.note?.includes('nailed') ? `${view.completed}` : null)

  return (
    <GameFrame gameId="tod">
      <HeartBurst show={celebrate} glyphs={['🔥', '💖', '🎯', '✨']} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5" role="group" aria-label="Heat level">
          {LEVELS.map((l) => (
            <button key={l.id} disabled={view.phase !== 'choose' || busy} onClick={() => send({ type: 'level', level: l.id })} className={cn('chip transition', view.level === l.id ? 'border-amber-300/70 bg-amber-500/25 text-amber-100' : 'opacity-70 hover:opacity-100', view.phase !== 'choose' && 'cursor-not-allowed')} title={l.blurb}>
              {l.emoji} {l.name}
            </button>
          ))}
        </div>
        <span className="chip">✅ {view.completed} done · ⏭️ {view.skipsLeft} skips</span>
      </div>

      <div className="glass-strong overflow-hidden p-5 text-center sm:p-7">
        <div className="mb-1 flex justify-center"><NameTag name={performer.name} emoji={performer.avatar} index={performer.index} /></div>
        <p className="text-xs text-white/55">{view.performer.isMe ? "It's your turn!" : `It's ${performer.name}'s turn`}</p>

        <AnimatePresence mode="wait">
          {view.phase === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h3 className="display mt-3 text-3xl font-black text-balance">{view.performer.isMe ? 'Truth or dare?' : `Waiting for ${performer.name} to choose…`}</h3>
              {view.note && <p className="mt-2 text-sm text-amber-200">{view.note}</p>}
              {view.performer.isMe && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button className="btn min-h-16 flex-col !gap-0.5 bg-gradient-to-br from-cyan-500 to-blue-600 text-base shadow-lg shadow-cyan-500/25" disabled={busy} onClick={() => send({ type: 'pick', kind: 'TRUTH' })}>
                    <span className="text-2xl">💡</span>Truth
                  </button>
                  <button className="btn min-h-16 flex-col !gap-0.5 bg-gradient-to-br from-amber-500 to-rose-600 text-base shadow-lg shadow-rose-500/25" disabled={busy} onClick={() => send({ type: 'pick', kind: 'DARE' })}>
                    <span className="text-2xl">🎯</span>Dare
                  </button>
                  <button className="btn btn-ghost col-span-2" disabled={busy} onClick={() => send({ type: 'pick', kind: 'RANDOM' })}>🎲 Surprise me</button>
                </div>
              )}
            </motion.div>
          )}

          {view.phase !== 'choose' && view.card && (
            <motion.div key={view.card.id} initial={{ opacity: 0, rotateY: 90, scale: 0.9 }} animate={{ opacity: 1, rotateY: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 16 }} className="mt-4">
              <div className={cn('rounded-3xl border-2 p-5 shadow-2xl sm:p-7', view.card.type === 'TRUTH' ? 'border-cyan-300/50 bg-gradient-to-br from-cyan-500/20 to-blue-600/20' : 'border-amber-300/50 bg-gradient-to-br from-amber-500/20 to-rose-600/25')}>
                <span className="chip">{view.card.type === 'TRUTH' ? '💡 TRUTH' : '🎯 DARE'}</span>
                <p className="display mt-3 text-2xl leading-snug font-bold text-balance sm:text-[1.7rem]">{view.card.text}</p>
              </div>
              {view.note && <p className="mt-3 text-sm text-amber-200">{view.note}</p>}

              {view.phase === 'card' && (
                <div className="mt-4 space-y-2">
                  {view.performer.isMe ? (
                    <>
                      <button className="btn btn-primary w-full" disabled={busy} onClick={() => send({ type: 'done' })}>I did it ✅</button>
                      <button className="btn btn-ghost btn-sm" disabled={busy || view.skipsLeft <= 0} onClick={() => send({ type: 'skip' })}>Skip ({view.skipsLeft} left)</button>
                    </>
                  ) : (
                    <p className="text-sm text-white/60">{performer.name} is on it. You’ll be the judge 👀</p>
                  )}
                </div>
              )}

              {view.phase === 'verify' && (
                <div className="mt-4">
                  {judge.id === me.id ? (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-white/85">Did {performer.name} really do it, {me.name}?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="btn btn-primary" disabled={busy} onClick={() => send({ type: 'approve' })}>Approve ✅</button>
                        <button className="btn btn-ghost" disabled={busy} onClick={() => send({ type: 'reject' })}>Try again 😏</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/65">Waiting for {judge.name} to approve… 🤞</p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-xs text-white/40">Complete a card: +30 💕 · judge: +10 💕</p>
    </GameFrame>
  )
}
