'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SimulView } from '@/games/engines/simul'
import { gameById } from '@/games/registry'
import { useRoom } from '../store'
import { AnswerCard, BigScore, GameFrame, PartnerStatus, ReadyButton, usePlayers, WaitingNote } from './Frame'
import { cn, HeartBurst, useCelebrate } from '@/components/ui'

const MAX = 200

function flavour(game: SimulView['game'], match: boolean | null, mine?: string, theirs?: string, meName?: string, partnerName?: string) {
  if (game === 'sentence') return 'Read them out loud to each other 🗣️'
  if (game === 'likely') {
    if (match) return `You both say ${mine}! 🎯`
    if (mine === partnerName && theirs === meName) return 'You each blame the other 😂'
    if (mine === meName && theirs === partnerName) return 'You both claim it! 😅'
    return 'Debate it out 🥊'
  }
  if (game === 'nhie') return match ? 'Partners in crime 😏' : 'Ooh, tell the story! 👀'
  if (game === 'wyr') return match ? 'Same brain! 🧠' : 'Time to debate — why did you pick yours? 🥊'
  return match ? 'Perfect sync! 💞' : 'Different answers — how interesting! 🤔'
}

export function SimulGame({ view }: { view: SimulView }) {
  const { send, act, busy } = useRoom()
  const { me, partner } = usePlayers()
  const def = gameById(view.game)!
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<{ id: string; i: number } | null>(null)
  const celebrate = useCelebrate(view.stage === 'reveal' && view.match ? `${view.index}-match` : view.stage === 'summary' && (view.summary?.percent ?? 0) >= 75 ? 'summary' : null)

  const answer = async (value: number | string) => {
    const id = view.prompt!.id
    if (typeof value === 'number') setPicked({ id, i: value }) // instant feedback while the server confirms
    const ok = await send({ type: 'answer', promptId: id, value })
    if (!ok) setPicked(null)
    return ok
  }
  const playAgain = () => act({ type: 'game.start', replace: true, game: view.game, options: { category: view.category } })
  const progress = view.stage === 'summary' ? undefined : { index: view.game === 'lovelang' ? view.index : view.index, total: view.total }

  if (view.stage === 'summary' && view.summary) {
    const s = view.summary
    return (
      <GameFrame gameId={view.game}>
        <HeartBurst show={celebrate} />
        <div className="glass-strong p-6 text-center">
          {view.game === 'lovelang' && s.love ? <LoveLangResult love={s.love} /> : view.game === 'sentence' ? (
            <>
              <div className="text-5xl" aria-hidden>💗</div>
              <h3 className="display mt-2 text-2xl font-bold">Beautifully said</h3>
              <p className="mt-1 text-sm text-white/60">You shared {s.total} little truths. Keep this conversation going tonight.</p>
            </>
          ) : (
            <>
              <BigScore percent={s.percent} label="in sync" />
              <h3 className="display mt-3 text-2xl font-bold">{s.percent === 100 ? 'Perfect sync! 🎉' : s.percent >= 60 ? 'Wonderfully in tune' : s.percent >= 30 ? 'Opposites attract' : 'Total mystery to each other 😄'}</h3>
              <p className="mt-1 text-sm text-white/60">{me.name} and {partner.name} matched on {s.matches} of {s.total}.</p>
            </>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={playAgain}>Play again 🔁</button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => act({ type: 'game.stop' })}>All games</button>
          </div>
        </div>

        {view.game !== 'lovelang' && (
          <div className="mt-5 space-y-3">
            <h3 className="display text-lg font-bold">Every answer</h3>
            {s.rows.map((r, i) => (
              <div key={r.id} className={cn('glass p-4', r.match && 'border-pink-400/50')}>
                <p className="mb-2.5 flex items-start justify-between gap-2 text-sm font-semibold text-white/85">
                  <span>{i + 1}. {r.text}</span>
                  {r.match && <span className="chip shrink-0 border-pink-400/40 bg-pink-500/20 text-pink-200">💞 Match</span>}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <AnswerCard name={me.name} emoji={me.avatar} index={me.index}>{r.mine}</AnswerCard>
                  <AnswerCard name={partner.name} emoji={partner.avatar} index={partner.index}>{r.theirs}</AnswerCard>
                </div>
              </div>
            ))}
          </div>
        )}
      </GameFrame>
    )
  }

  const p = view.prompt
  return (
    <GameFrame gameId={view.game} progress={progress}>
      <HeartBurst show={celebrate} />
      {p && (
        <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5 sm:p-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="chip">{def.emoji} {def.title}</span>
            <PartnerStatus name={partner.name} done={view.partner.answered} index={partner.index} doneText={view.stage === 'reveal' ? 'answered' : 'has answered'} />
          </div>
          <h3 className="display text-2xl leading-snug font-bold text-balance sm:text-[1.7rem]">{p.text}</h3>

          {view.stage === 'answering' && !p.freeText && (
            <div className="mt-5 space-y-2.5">
              {p.options?.map((o, i) => (
                <button key={i} className={cn('option', picked?.id === p.id && picked.i === i && 'option-selected')} disabled={busy} onClick={() => answer(i)}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/25 text-[11px] font-bold text-white/60">{String.fromCharCode(65 + i)}</span>
                  <span>{o}</span>
                </button>
              ))}
            </div>
          )}

          {view.stage === 'answering' && p.freeText && (
            <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) answer(text.trim()) }}>
              <textarea className="field min-h-28 resize-none" maxLength={MAX} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write from the heart…" autoFocus />
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/45">{text.length}/{MAX} · revealed when {partner.name} answers too</span>
                <button className="btn btn-primary" disabled={busy || !text.trim()}>Lock in 🔒</button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {view.stage === 'waiting' && (
        <div className="mt-4 space-y-3">
          {view.me.answer && <AnswerCard name={me.name} emoji={me.avatar} index={me.index}>{view.me.answer}</AnswerCard>}
          <WaitingNote text={view.game === 'lovelang' ? `Waiting for ${partner.name} to finish…` : `Waiting for ${partner.name}…`} sub={view.game === 'lovelang' ? 'Your results appear the moment you are both done.' : 'Your answers are revealed together.'} />
        </div>
      )}

      {view.stage === 'reveal' && (
        <div className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <AnswerCard name={me.name} emoji={me.avatar} index={me.index} highlight={!!view.match}>{view.me.answer}</AnswerCard>
            <AnswerCard name={partner.name} emoji={partner.avatar} index={partner.index} highlight={!!view.match}>{view.partner.answer}</AnswerCard>
          </div>
          <motion.p initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35 }} className={cn('mt-4 text-center text-base font-bold', view.match ? 'text-pink-200' : 'text-white/75')}>
            {flavour(view.game, view.match, view.me.answer, view.partner.answer, me.name, partner.name)}
          </motion.p>
          <ReadyButton label={view.index + 1 >= view.total ? 'See results 🎉' : 'Next question →'} meReady={view.me.ready} partnerName={partner.name} partnerReady={view.partner.ready} disabled={busy} onClick={() => send({ type: 'next' })} />
        </div>
      )}
    </GameFrame>
  )
}

type LoveResult = NonNullable<NonNullable<SimulView['summary']>['love']>

function LangColumn({ love, who, data }: { love: LoveResult; who: string; data: LoveResult['mine'] }) {
  return (
    <div className="glass p-4 text-left">
      <p className="text-xs font-bold tracking-wide text-white/55 uppercase">{who}’s love language</p>
      {data.top.map((t) => (
        <div key={t} className="mt-2">
          <p className="display text-xl font-bold">{love.info[t].emoji} {love.info[t].name}</p>
          <p className="mt-1 text-sm text-white/65">{love.info[t].blurb}</p>
          <p className="mt-2 rounded-xl bg-white/[0.06] p-2.5 text-xs text-pink-100">💡 To love {who}: {love.info[t].tip}</p>
        </div>
      ))}
      <div className="mt-3 space-y-1">
        {(Object.keys(data.scores) as (keyof typeof data.scores)[]).map((k) => (
          <div key={k} className="flex items-center gap-2 text-[11px] text-white/60">
            <span className="w-28 shrink-0 truncate">{love.info[k].emoji} {love.info[k].name}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-rose-400 to-fuchsia-500" style={{ width: `${(data.scores[k] / 4) * 100}%` }} /></span>
            <span className="w-3 text-right">{data.scores[k]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoveLangResult({ love }: { love: LoveResult }) {
  const same = love.mine.top.some((t) => love.theirs.top.includes(t))
  return (
    <div>
      <div className="text-5xl" aria-hidden>💌</div>
      <h3 className="display mt-2 text-2xl font-bold">{same ? 'You speak the same love language!' : 'Different languages, same love'}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-white/60">{same ? 'You naturally give what the other needs. Keep it up!' : 'Use the tips below to “speak” each other’s language this week.'}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <LangColumn love={love} who={love.names.mine} data={love.mine} />
        <LangColumn love={love} who={love.names.theirs} data={love.theirs} />
      </div>
    </div>
  )
}
