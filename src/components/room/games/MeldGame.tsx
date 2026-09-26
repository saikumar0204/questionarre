'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { MeldView } from '@/games/engines/sync'
import { useRoom } from '../store'
import { GameFrame, PartnerStatus, usePlayers, WaitingNote } from './Frame'
import { cn, HeartBurst, PLAYER_COLORS, useCelebrate } from '@/components/ui'

export function MeldGame({ view }: { view: MeldView }) {
  const { send, act, busy } = useRoom()
  const { me, partner, ordered } = usePlayers()
  const [word, setWord] = useState('')
  const celebrate = useCelebrate(view.won ? 'won' : null)
  const last = view.history[view.history.length - 1]

  return (
    <GameFrame gameId="meld" unit="Round" progress={view.finished ? undefined : { index: view.round - 1, total: view.maxRounds }}>
      <HeartBurst show={celebrate} glyphs={['🧠', '💖', '✨', '🎉']} />
      <div className="glass-strong p-5 text-center sm:p-7">
        {view.finished ? (
          <div>
            <div className="text-5xl" aria-hidden>{view.won ? '🧠💞🧠' : '🌫️'}</div>
            <h3 className="display mt-2 text-3xl font-black text-balance">{view.won ? `One mind in ${view.history.length} round${view.history.length > 1 ? 's' : ''}!` : 'So close — but not this time'}</h3>
            {view.won && last && <p className="mt-1 text-lg text-pink-200">You both said “{last.a}”</p>}
            <p className="mt-1 text-sm text-white/60">{view.won ? (view.history.length <= 3 ? 'That is telepathy-level. 🔮' : 'Your minds finally met in the middle!') : 'Try again with new words — you’ll get it.'}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: 'game.start', replace: true, game: 'meld' })}>New words 🔁</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => act({ type: 'game.stop' })}>All games</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold tracking-wide text-white/55 uppercase">{view.history.length === 0 ? 'Start here' : 'Meet in the middle of these two'}</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <motion.span key={view.bridge[0]} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="display rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-2xl font-black sm:text-3xl">{view.bridge[0]}</motion.span>
              <span className="text-2xl text-white/40" aria-hidden>⟷</span>
              <motion.span key={view.bridge[1]} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="display rounded-2xl border border-violet-400/40 bg-violet-500/15 px-4 py-3 text-2xl font-black sm:text-3xl">{view.bridge[1]}</motion.span>
            </div>
            <p className="mx-auto mt-4 max-w-sm text-sm text-white/65">Each type <b>one word</b> that connects them. If you both type the <b>same word</b>, you win. If not, bridge the two new words!</p>

            {view.me.word === undefined ? (
              <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); if (word.trim()) { send({ type: 'word', word: word.trim() }); setWord('') } }}>
                <input className="field text-center text-lg" maxLength={30} value={word} onChange={(e) => setWord(e.target.value)} placeholder="Type your word…" autoFocus autoComplete="off" />
                <div className="flex items-center justify-between gap-2">
                  <PartnerStatus name={partner.name} done={view.partner.submitted} index={partner.index} doneText="has a word" />
                  <button className="btn btn-primary" disabled={busy || !word.trim()}>Lock it in 🔒</button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-2">
                <p className="text-sm text-white/70">Your word: <b className="text-pink-200">{view.me.word}</b></p>
                <WaitingNote text={`Waiting for ${partner.name}…`} sub="Both words appear at the same moment." />
              </div>
            )}
          </>
        )}
      </div>

      {view.history.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="display text-lg font-bold">Your rounds</h3>
          {[...view.history].reverse().map((h, i) => {
            const n = view.history.length - i
            return (
              <div key={n} className={cn('glass flex items-center justify-between gap-2 p-3 text-sm', h.matched && 'border-emerald-400/50 bg-emerald-500/10')}>
                <span className="text-xs font-bold text-white/45">#{n}</span>
                <span className={cn('flex-1 truncate text-center font-bold', PLAYER_COLORS[0].text)}>{ordered[0].avatar} {h.a}</span>
                <span className="text-white/35">{h.matched ? '💞' : '≠'}</span>
                <span className={cn('flex-1 truncate text-center font-bold', PLAYER_COLORS[1].text)}>{h.b} {ordered[1].avatar}</span>
              </div>
            )
          })}
          <p className="text-center text-[11px] text-white/40">{me.name} and {partner.name}: {ordered[0].name} on the left, {ordered[1].name} on the right</p>
        </div>
      )}
    </GameFrame>
  )
}
