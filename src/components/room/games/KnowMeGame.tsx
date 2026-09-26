'use client'

import { motion } from 'framer-motion'
import type { GuessView } from '@/games/engines/guess'
import { useRoom } from '../store'
import { AnswerCard, GameFrame, PartnerStatus, ReadyButton, usePlayers, WaitingNote } from './Frame'
import { cn, HeartBurst, NameTag, useCelebrate } from '@/components/ui'

export function KnowMeGame({ view }: { view: GuessView }) {
  const { send, act, busy } = useRoom()
  const { me, partner, ordered } = usePlayers()
  const celebrate = useCelebrate(view.stage === 'summary' ? 'summary' : view.stage === 'reveal' && view.reveal?.rows.some((r) => r.correct) ? `r${view.index}` : null)
  const progress = view.stage === 'summary' ? undefined : { index: view.index, total: view.total }

  if (view.stage === 'summary' && view.summary) {
    const s = view.summary
    const winnerText = s.winner === 'me' ? `${me.name} knows ${partner.name} best! 🏆` : s.winner === 'partner' ? `${partner.name} knows ${me.name} best! 🏆` : 'A perfect tie — you know each other equally well 💞'
    return (
      <GameFrame gameId="knowme">
        <HeartBurst show={celebrate} />
        <div className="glass-strong p-6 text-center">
          <div className="text-5xl" aria-hidden>🔮</div>
          <h3 className="display mt-2 text-2xl font-bold text-balance">{winnerText}</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[{ p: me, score: view.scores.mine }, { p: partner, score: view.scores.theirs }].map(({ p, score }) => (
              <div key={p.id} className="glass p-4">
                <NameTag name={p.name} emoji={p.avatar} index={p.index} />
                <div className="display mt-2 text-4xl font-black">{score}<span className="text-lg text-white/40">/{view.total}</span></div>
                <p className="text-xs text-white/55">correct guesses</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: 'game.start', replace: true, game: 'knowme' })}>Play again 🔁</button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => act({ type: 'game.stop' })}>All games</button>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <h3 className="display text-lg font-bold">How you did</h3>
          {s.rows.map((r, i) => (
            <div key={i} className="glass space-y-3 p-4">
              {[r.a, r.b].map((x, k) => {
                const person = ordered[k]
                return (
                  <div key={k}>
                    <p className="mb-1.5 text-sm font-semibold text-white/85">{x.question}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <AnswerCard name={x.name} emoji={person.avatar} index={person.index}>{x.truth}</AnswerCard>
                      <div className={cn('rounded-2xl border p-4', x.correct ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-red-400/30 bg-red-500/10')}>
                        <p className="text-xs font-bold text-white/60">{ordered[1 - k].name} guessed {x.correct ? '✓' : '✗'}</p>
                        <p className="mt-1 text-[15px] font-medium">{x.guess}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </GameFrame>
    )
  }

  const p = view.prompt
  const answering = view.stage === 'self-answering' || view.stage === 'guess-answering'
  const isSelf = view.stage.startsWith('self')

  return (
    <GameFrame gameId="knowme" progress={progress}>
      <HeartBurst show={celebrate} />
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <span className="chip">{me.avatar} {me.name}: {view.scores.mine}</span>
        <span className="chip">{partner.avatar} {partner.name}: {view.scores.theirs}</span>
      </div>

      {view.stage !== 'reveal' && p && (
        <motion.div key={`${p.id}-${view.stage}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5 sm:p-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className={cn('chip', isSelf ? 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100' : 'border-amber-400/40 bg-amber-500/15 text-amber-100')}>
              {isSelf ? `Step 1 · About YOU, ${me.name}` : `Step 2 · Guess ${partner.name}'s answer`}
            </span>
            <PartnerStatus name={partner.name} done={view.partner.done} index={partner.index} doneText={isSelf ? 'answered' : 'guessed'} />
          </div>
          <h3 className="display text-2xl leading-snug font-bold text-balance">{p.text}</h3>
          <p className="mt-1 text-xs text-white/50">{isSelf ? 'Answer honestly — your partner will try to guess it.' : `What do you think ${partner.name} picked?`}</p>

          {answering ? (
            <div className="mt-5 space-y-2.5">
              {p.options.map((o, i) => (
                <button key={i} className="option" disabled={busy} onClick={() => send({ type: isSelf ? 'self' : 'guess', promptId: p.id, value: i })}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/25 text-[11px] font-bold text-white/60">{String.fromCharCode(65 + i)}</span>
                  <span>{o}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5"><WaitingNote text={`Waiting for ${partner.name}…`} sub={isSelf ? 'Next, you will both guess each other.' : 'Answers are revealed together.'} /></div>
          )}
        </motion.div>
      )}

      {view.stage === 'reveal' && view.reveal && (
        <div className="space-y-3">
          {view.reveal.rows.map((r) => {
            const person = ordered.find((o) => o.name === r.name)!
            return (
              <motion.div key={r.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5">
                <p className="mb-3 text-sm font-semibold text-white/85">{r.question}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <AnswerCard name={`${r.name}’s real answer`} emoji={person.avatar} index={person.index}>{r.truth}</AnswerCard>
                  <div className={cn('rounded-2xl border p-4', r.correct ? 'border-emerald-400/50 bg-emerald-500/15' : 'border-red-400/40 bg-red-500/10')}>
                    <p className="text-xs font-bold text-white/70">{r.guessedBy} guessed {r.correct ? '✓ Correct!' : '✗ Not quite'}</p>
                    <p className="mt-1 text-[15px] font-medium">{r.guess}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
          <ReadyButton label={view.index + 1 >= view.total ? 'See who knows best 🏆' : 'Next question →'} meReady={view.me.ready} partnerName={partner.name} partnerReady={view.partner.ready} disabled={busy} onClick={() => send({ type: 'next' })} />
        </div>
      )}
    </GameFrame>
  )
}

