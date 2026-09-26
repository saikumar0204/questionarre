'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { TuneView } from '@/games/engines/sync'
import { useRoom } from '../store'
import { BigScore, GameFrame, ReadyButton, usePlayers, WaitingNote } from './Frame'
import { cn, HeartBurst, NameTag, useCelebrate } from '@/components/ui'

const CX = 150
const CY = 150
const R = 128

const pt = (v: number, r = R) => {
  const t = Math.PI * (1 - v / 100)
  return { x: CX + r * Math.cos(t), y: CY - r * Math.sin(t) }
}
const arc = (v1: number, v2: number, r = R) => {
  const a = pt(Math.max(0, v1), r)
  const b = pt(Math.min(100, v2), r)
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

function Dial({ left, right, target, guess, showBands }: { left: string; right: string; target?: number; guess?: number | null; showBands: boolean }) {
  const needle = guess !== null && guess !== undefined ? pt(guess, R - 8) : null
  return (
    <div className="mx-auto w-full max-w-md">
      <svg viewBox="0 0 300 175" className="w-full" role="img" aria-label={`Dial from ${left} to ${right}`}>
        <path d={arc(0, 100)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="26" strokeLinecap="round" />
        {target !== undefined && (
          <>
            {showBands && <path d={arc(target - 18, target + 18)} fill="none" stroke="#f59e0b" strokeOpacity="0.55" strokeWidth="26" />}
            {showBands && <path d={arc(target - 10, target + 10)} fill="none" stroke="#fb923c" strokeOpacity="0.8" strokeWidth="26" />}
            <path d={arc(target - 4, target + 4)} fill="none" stroke="#f43f5e" strokeWidth="26" />
          </>
        )}
        {needle && (
          <g>
            <line x1={CX} y1={CY} x2={needle.x} y2={needle.y} stroke="white" strokeWidth="4" strokeLinecap="round" />
            <circle cx={needle.x} cy={needle.y} r="7" fill="white" />
          </g>
        )}
        <circle cx={CX} cy={CY} r="9" fill="white" />
      </svg>
      <div className="-mt-1 flex justify-between gap-3 text-sm font-bold">
        <span className="max-w-[45%] text-left text-sky-200">◀ {left}</span>
        <span className="max-w-[45%] text-right text-fuchsia-200">{right} ▶</span>
      </div>
    </div>
  )
}

export function TuneInGame({ view }: { view: TuneView }) {
  const { send, act, busy } = useRoom()
  const { me, partner, ordered } = usePlayers()
  const [clue, setClue] = useState('')
  const [guess, setGuess] = useState(50)
  const psychic = ordered.find((p) => p.name === view.psychicName) ?? me
  const isPsychic = view.role === 'psychic'
  const celebrate = useCelebrate(view.phase === 'reveal' && (view.lastPoints ?? 0) >= 3 ? `r${view.round}` : view.finished ? 'end' : null)

  if (view.finished) {
    return (
      <GameFrame gameId="tunein">
        <HeartBurst show={celebrate} />
        <div className="glass-strong p-6 text-center">
          <BigScore percent={Math.round((view.score / view.maxScore) * 100)} label="in tune" />
          <h3 className="display mt-3 text-2xl font-bold">{view.rating}</h3>
          <p className="mt-1 text-sm text-white/60">You scored {view.score} of {view.maxScore} together.</p>
          <div className="mt-4 space-y-2 text-left">
            {view.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.06] px-3 py-2 text-sm">
                <span className="truncate">“{h.clue}”</span>
                <span className={cn('shrink-0 font-black', h.points >= 3 ? 'text-emerald-300' : h.points > 0 ? 'text-amber-300' : 'text-white/40')}>+{h.points}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: 'game.start', replace: true, game: 'tunein' })}>Play again 🔁</button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => act({ type: 'game.stop' })}>All games</button>
          </div>
        </div>
      </GameFrame>
    )
  }

  return (
    <GameFrame gameId="tunein" unit="Round" progress={{ index: view.round - 1, total: view.totalRounds }}>
      <HeartBurst show={celebrate} glyphs={['📻', '💖', '✨', '🎶']} />
      <div className="glass-strong p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <NameTag name={psychic.name} emoji={psychic.avatar} index={psychic.index} />
          <span className="chip">🎯 Team score {view.score}/{view.maxScore}</span>
        </div>

        <Dial left={view.spectrum.left} right={view.spectrum.right} target={view.target} guess={view.phase === 'reveal' ? view.guess : view.phase === 'guess' && !isPsychic ? guess : null} showBands={view.target !== undefined && (isPsychic || view.phase === 'reveal')} />

        {view.phase === 'clue' && (
          isPsychic ? (
            <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); if (clue.trim()) { send({ type: 'clue', text: clue.trim() }); setClue('') } }}>
              <p className="text-center text-sm text-white/70">Only <b>you</b> can see the red target. Give <b>one clue</b> — a word or short phrase — that points {partner.name} to it. No numbers!</p>
              <input className="field text-center" maxLength={60} value={clue} onChange={(e) => setClue(e.target.value)} placeholder="e.g. “a rainy-day samosa”" autoFocus />
              <button className="btn btn-primary w-full" disabled={busy || !clue.trim()}>Send clue 📻</button>
            </form>
          ) : (
            <div className="mt-5"><WaitingNote text={`${psychic.name} is thinking of a clue…`} sub="They can see the secret target. You’ll place the needle." /></div>
          )
        )}

        {view.phase === 'guess' && (
          <div className="mt-5">
            <p className="text-center text-xs font-bold tracking-wide text-white/50 uppercase">{psychic.name}’s clue</p>
            <p className="display mt-1 text-center text-2xl font-bold text-balance">“{view.clue}”</p>
            {isPsychic ? (
              <div className="mt-4"><WaitingNote text={`${partner.name} is placing the needle…`} sub="No hints now 😉" /></div>
            ) : (
              <div className="mt-4 space-y-3">
                <input type="range" min={0} max={100} value={guess} onChange={(e) => setGuess(Number(e.target.value))} className="h-3 w-full cursor-pointer accent-pink-500" aria-label="Move the dial" />
                <button className="btn btn-primary w-full" disabled={busy} onClick={() => send({ type: 'guess', value: guess })}>Lock in my guess 🔒</button>
              </div>
            )}
          </div>
        )}

        {view.phase === 'reveal' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center">
            <p className="text-sm text-white/60">“{view.clue}”</p>
            <p className={cn('display mt-1 text-3xl font-black', (view.lastPoints ?? 0) >= 3 ? 'text-emerald-300' : (view.lastPoints ?? 0) > 0 ? 'text-amber-300' : 'text-white/70')}>
              {view.lastPoints === 4 ? 'Bullseye! 🎯 +4' : view.lastPoints === 3 ? 'So close! +3' : view.lastPoints === 2 ? 'In the zone +2' : 'Missed it! +0'}
            </p>
            <ReadyButton label={view.round >= view.totalRounds ? 'See final score 🏁' : `Next round — ${partner.id === psychic.id ? me.name : partner.name} gives the clue`} meReady={false} partnerName={partner.name} partnerReady={false} disabled={busy} onClick={() => send({ type: 'next' })} />
          </motion.div>
        )}
      </div>
    </GameFrame>
  )
}
