'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { LieView } from '@/games/engines/play'
import { useRoom } from '../store'
import { GameFrame, PartnerStatus, ReadyButton, usePlayers, WaitingNote } from './Frame'
import { cn, HeartBurst, NameTag, useCelebrate } from '@/components/ui'

export function LieGame({ view }: { view: LieView }) {
  const { send, busy } = useRoom()
  const { me, partner, ordered } = usePlayers()
  const [texts, setTexts] = useState(['', '', ''])
  const [lie, setLie] = useState<number | null>(null)
  const celebrate = useCelebrate(view.phase === 'reveal' ? `r${view.round}` : null)
  const ready = texts.every((t) => t.trim().length >= 4) && lie !== null

  return (
    <GameFrame gameId="lie">
      <HeartBurst show={celebrate} glyphs={['🤥', '🎯', '😂', '✨']} />
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <span className="chip">{me.avatar} {me.name}: {view.scores.mine}</span>
        <span className="chip">Round {view.round}</span>
        <span className="chip">{partner.avatar} {partner.name}: {view.scores.theirs}</span>
      </div>

      {view.phase === 'write' && (
        <div className="glass-strong p-5 sm:p-6">
          {!view.me.submitted ? (
            <form onSubmit={(e) => { e.preventDefault(); if (ready) send({ type: 'submit', statements: texts.map((t) => t.trim()), lie }) }}>
              <h3 className="display text-xl font-bold">Two truths and a lie, {me.name}</h3>
              <p className="mt-1 text-sm text-white/60">Write three things about <b>yourself</b>. Two must be true, one a convincing lie. Mark the lie — only you will know which it is.</p>
              <div className="mt-4 space-y-3">
                {texts.map((t, i) => (
                  <div key={i} className={cn('flex items-start gap-2 rounded-2xl border p-2 transition', lie === i ? 'border-red-400/60 bg-red-500/10' : 'border-white/10 bg-white/[0.04]')}>
                    <button type="button" onClick={() => setLie(i)} className={cn('btn btn-sm mt-0.5 shrink-0 !px-2.5', lie === i ? 'bg-red-500 text-white' : 'btn-soft')} aria-pressed={lie === i} title="Mark as the lie">{lie === i ? '🤥 Lie' : '✓ True'}</button>
                    <input className="field !border-0 !bg-transparent !px-2 !py-2 focus:!ring-0" maxLength={120} value={t} onChange={(e) => setTexts(texts.map((x, k) => (k === i ? e.target.value : x)))} placeholder={i === 0 ? 'e.g. I have been on a hot-air balloon' : i === 1 ? 'e.g. I can solve a Rubik’s cube' : 'e.g. I once met a film star'} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <PartnerStatus name={partner.name} done={view.partner.submitted} index={partner.index} doneText="is ready" waitText="writing…" />
                <button className="btn btn-primary" disabled={busy || !ready}>Lock in 🔒</button>
              </div>
              {lie === null && <p className="mt-2 text-xs text-amber-200">Tap “✓ True” on the statement that is your lie.</p>}
            </form>
          ) : (
            <WaitingNote text={`Waiting for ${partner.name} to write theirs…`} sub="Then you’ll each try to spot the other’s lie." />
          )}
        </div>
      )}

      {view.phase === 'guess' && view.toJudge && (
        <div className="glass-strong p-5 sm:p-6">
          <NameTag name={view.toJudge.name} emoji={partner.avatar} index={partner.index} />
          <h3 className="display mt-2 text-xl font-bold">Which one is {view.toJudge.name}’s lie?</h3>
          {!view.me.guessed ? (
            <div className="mt-4 space-y-2.5">
              {view.toJudge.statements.map((s, i) => (
                <button key={i} className="option" disabled={busy} onClick={() => send({ type: 'guess', index: i })}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/25 text-[11px] font-bold text-white/60">{i + 1}</span>
                  <span>{s}</span>
                </button>
              ))}
              <p className="text-center text-xs text-white/45">Study their face. Or their punctuation. 🕵️</p>
            </div>
          ) : (
            <div className="mt-4"><WaitingNote text={`Waiting for ${partner.name} to guess yours…`} /></div>
          )}
        </div>
      )}

      {view.phase === 'reveal' && view.reveal && (
        <div className="space-y-3">
          {view.reveal.rows.map((r) => {
            const person = ordered.find((o) => o.name === r.name)!
            return (
              <motion.div key={r.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5">
                <div className="flex items-center justify-between gap-2">
                  <NameTag name={`${r.name}’s statements`} emoji={person.avatar} index={person.index} />
                  <span className={cn('chip', r.caught ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-amber-400/40 bg-amber-500/15 text-amber-100')}>{r.caught ? `${r.guessedBy} caught it! 🎯` : `${r.guessedBy} was fooled! 😈`}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {r.statements.map((s, i) => (
                    <div key={i} className={cn('flex items-start gap-2 rounded-2xl border px-3 py-2.5 text-[15px]', i === r.lie ? 'border-red-400/60 bg-red-500/15' : 'border-white/10 bg-white/[0.04]')}>
                      <span aria-hidden>{i === r.lie ? '🤥' : '✅'}</span>
                      <span className="flex-1">{s}</span>
                      {i === r.guess && <span className="chip shrink-0 !px-2 !py-0.5 text-[10px]">{r.guessedBy}’s guess</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
          <ReadyButton label="Another round 🔁" meReady={false} partnerName={partner.name} partnerReady={false} disabled={busy} onClick={() => send({ type: 'again' })} />
        </div>
      )}
    </GameFrame>
  )
}
