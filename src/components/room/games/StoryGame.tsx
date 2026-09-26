'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { StoryView } from '@/games/engines/play'
import { useRoom } from '../store'
import { GameFrame, usePlayers, WaitingNote } from './Frame'
import { cn, HeartBurst, PLAYER_COLORS, ProgressBar, useCelebrate } from '@/components/ui'

const STARTERS = ['Suddenly, ', 'But then, ', 'Meanwhile, ', 'Just as they thought it was over, ', 'To everyone’s surprise, ']

export function StoryGame({ view }: { view: StoryView }) {
  const { send, act, busy, toast } = useRoom()
  const { me, partner, ordered } = usePlayers()
  const [text, setText] = useState('')
  const celebrate = useCelebrate(view.finished ? 'end' : null)
  const idxOf = (byMe: boolean) => (byMe ? me.index : partner.index)

  const copy = async () => {
    const full = [view.opener, ...view.lines.map((l) => l.text)].join(' ')
    try {
      await navigator.clipboard.writeText(`${full}\n\n— written by ${ordered[0].name} & ${ordered[1].name} on SoulSync`)
      toast('Story copied! Paste it anywhere 📋')
    } catch {
      toast('Could not copy — select the text instead.', 'error')
    }
  }

  return (
    <GameFrame gameId="story">
      <HeartBurst show={celebrate} glyphs={['📖', '✨', '💖', '🌙']} />
      {!view.finished && <ProgressBar value={view.written / view.target} className="mb-3" />}
      <div className="glass-strong p-5 sm:p-7">
        <p className="display text-xl leading-relaxed font-semibold text-pink-100 italic sm:text-2xl">{view.opener}</p>
        <div className="mt-4 space-y-3">
          {view.lines.map((l, i) => {
            const c = PLAYER_COLORS[idxOf(l.byMe)]
            return (
              <motion.p key={i} initial={{ opacity: 0, x: l.byMe ? 14 : -14 }} animate={{ opacity: 1, x: 0 }} className={cn('rounded-2xl border-l-4 px-3.5 py-2 text-[15px] leading-relaxed', c.bg, c.border)}>
                <span className={cn('mr-1.5 text-[11px] font-bold uppercase', c.text)}>{l.byName}</span>
                {l.text}
              </motion.p>
            )
          })}
        </div>

        {view.finished ? (
          <div className="mt-6 text-center">
            <p className="display text-2xl font-black">The End 🌙</p>
            <p className="mt-1 text-sm text-white/60">{view.lines.length + 1} sentences, two imaginations.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button className="btn btn-primary" onClick={copy}>Copy story 📋</button>
              <button className="btn btn-soft" disabled={busy} onClick={() => act({ type: 'game.start', replace: true, game: 'story' })}>New story 🔁</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => act({ type: 'game.stop' })}>All games</button>
            </div>
          </div>
        ) : view.myTurn ? (
          <form className="mt-5 space-y-3" onSubmit={async (e) => { e.preventDefault(); if (text.trim().length >= 3 && (await send({ type: 'add', text: text.trim() }))) setText('') }}>
            <p className="text-sm font-bold text-pink-200">Your turn, {me.name} — what happens next?</p>
            <div className="flex flex-wrap gap-1.5">
              {STARTERS.map((s) => <button key={s} type="button" className="chip hover:bg-white/15" onClick={() => setText((t) => (t ? t : s))}>{s.trim()}</button>)}
            </div>
            <textarea className="field min-h-24 resize-none" maxLength={160} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add one sentence…" autoFocus />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-white/45">{text.length}/160 · {view.written}/{view.target} lines</span>
              <div className="flex gap-2">
                {view.canEnd && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => send({ type: 'end' })}>End story</button>}
                <button className="btn btn-primary" disabled={busy || text.trim().length < 3}>Add ✍️</button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mt-5"><WaitingNote text={`${view.turnName} is writing the next line…`} sub={`${view.written} of ${view.target} lines so far`} /></div>
        )}
      </div>
    </GameFrame>
  )
}
