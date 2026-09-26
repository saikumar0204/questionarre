'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SparkView } from '@/games/spark'
import { useRoom } from './store'
import { AnswerCard, usePlayers } from './games/Frame'
import { cn, HeartBurst, ProgressBar, Sheet, useCelebrate } from '@/components/ui'
import { SITE } from '@/config/site'

const NEXT_MILESTONE = (streak: number, list: SparkView['milestones']) => list.find((m) => m.days > streak)

function statusLine(s: SparkView, partnerName: string) {
  if (s.completed) return { text: 'Done for today! See you tomorrow 💞', tone: 'text-emerald-300' }
  if (s.status === 'freeze') return { text: 'You missed yesterday — a streak freeze ❄️ will save you if you finish today', tone: 'text-sky-300' }
  if (s.status === 'broken') return { text: 'Your streak ended. Start a new one today — it only takes a minute!', tone: 'text-amber-300' }
  if (s.status === 'alive' && s.streak > 0) return { text: `Finish today to keep your ${s.streak}-day streak alive 🔥`, tone: 'text-amber-300' }
  if (s.me.answered) return { text: `Waiting for ${partnerName} to answer…`, tone: 'text-white/60' }
  return { text: 'One tiny question a day. Both answer, then reveal together.', tone: 'text-white/60' }
}

export function SparkCard() {
  const { snap, act, busy, toast } = useRoom()
  const { me, partner } = usePlayers()
  const s = snap.spark
  const [text, setText] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const celebrate = useCelebrate(s?.completed ? `${s.day}-${s.streak}` : null)
  if (!s) return null

  const line = statusLine(s, partner.name)
  const next = NEXT_MILESTONE(s.streak, s.milestones)
  const prevMilestone = [...s.milestones].reverse().find((m) => m.days <= s.streak)?.days ?? 0
  const progress = next ? (s.streak - prevMilestone) / (next.days - prevMilestone) : 1
  const answer = (value: number | string) => act({ type: 'spark.answer', value })

  const url = typeof window !== 'undefined' ? window.location.href : ''
  const nudge = () => {
    const msg = `${me.name} here 💕 Today's Daily Spark is waiting for you${s.streak > 0 ? ` — help keep our ${s.streak}-day streak alive!` : '!'} ${url}`
    const share = navigator.share?.({ text: msg, url })
    if (share) share.catch(() => {})
    else window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
  }

  const shareCard = async () => {
    const qs = new URLSearchParams({ a: snap.myIndex === 0 ? me.name : partner.name, b: snap.myIndex === 0 ? partner.name : me.name, s: String(s.streak), l: snap.level.title, e: snap.level.emoji })
    const cardUrl = `/api/card?${qs}`
    try {
      const blob = await (await fetch(cardUrl)).blob()
      const file = new File([blob], 'our-streak.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${s.streak}-day streak on ${SITE.name} 🔥 ${SITE.domain}` })
        return
      }
    } catch {
      /* fall through to opening the image */
    }
    window.open(cardUrl, '_blank', 'noopener')
    toast('Long-press the image to save & share 📸')
  }

  return (
    <div className="glass-strong relative overflow-hidden p-5 sm:p-6">
      <HeartBurst show={celebrate} glyphs={['🔥', '💖', '✨', '💕']} />
      <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" aria-hidden />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wider text-orange-200/80 uppercase">Daily Spark</p>
          <h2 className="display mt-0.5 text-2xl font-black">
            <span aria-hidden>{s.streak > 0 ? '🔥' : '✨'}</span> {s.streak > 0 ? `${s.streak}-day streak` : 'Start your streak'}
          </h2>
          <p className={cn('mt-1 text-sm', line.tone)}>{line.text}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-white/60">
          <span className="chip" title="Streak freezes save your streak if you miss a day">❄️ {s.freezes}</span>
          <span className="chip" title="Longest streak">🏆 {s.best}</span>
        </div>
      </div>

      {next && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-white/50"><span>Next reward at {next.days} days</span><span>+{next.bonus} 💕 each</span></div>
          <ProgressBar value={progress} />
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-[11px] font-bold tracking-wide text-white/45 uppercase">Today’s spark · {s.prompt.kind === 'do' ? 'Do it together' : s.prompt.kind === 'write' ? 'Write it' : 'Pick one'}</p>
        <p className="display mt-1 text-xl leading-snug font-bold text-balance">{s.prompt.text}</p>

        {!s.me.answered && (
          <div className="mt-4">
            {s.prompt.kind === 'pick' && (
              <div className="grid gap-2 sm:grid-cols-2">
                {s.prompt.options?.map((o, i) => <button key={i} className="option" disabled={busy} onClick={() => answer(i)}>{o}</button>)}
              </div>
            )}
            {s.prompt.kind === 'write' && (
              <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); if (text.trim() && (await answer(text.trim()))) setText('') }}>
                <textarea className="field min-h-20 resize-none" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write from the heart…" />
                <button className="btn btn-primary w-full" disabled={busy || !text.trim()}>Send to {partner.name} 💌</button>
              </form>
            )}
            {s.prompt.kind === 'do' && <button className="btn btn-primary w-full" disabled={busy} onClick={() => answer('done')}>We did it ✅</button>}
          </div>
        )}

        <AnimatePresence>
          {s.me.answered && !s.completed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
              <AnswerCard name={me.name} emoji={me.avatar} index={me.index}>{s.me.answer}</AnswerCard>
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/[0.05] p-3 text-center">
                <p className="text-sm text-white/70">{partner.name} hasn’t answered yet. Their answer stays hidden until they do.</p>
                <button className="btn btn-primary btn-sm" onClick={nudge}>💬 Nudge {partner.name} on WhatsApp</button>
              </div>
            </motion.div>
          )}
          {s.completed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <AnswerCard name={me.name} emoji={me.avatar} index={me.index}>{s.me.answer}</AnswerCard>
                <AnswerCard name={partner.name} emoji={partner.avatar} index={partner.index}>{s.partner.answer}</AnswerCard>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button className="btn btn-primary btn-sm" onClick={shareCard}>📸 Share our streak</button>
                <button className="btn btn-soft btn-sm" onClick={() => setShowHistory(true)}>🗂️ Look back</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!s.completed && s.history.length > 0 && (
        <button className="mt-3 text-xs font-semibold text-white/50 underline-offset-2 hover:underline" onClick={() => setShowHistory(true)}>🗂️ Look back at past sparks ({s.history.length})</button>
      )}

      <Sheet open={showHistory} onClose={() => setShowHistory(false)} title="Your Spark memories">
        <div className="space-y-3">
          {s.history.length === 0 && <p className="text-sm text-white/60">Complete a Daily Spark and it will be saved here, like a tiny journal of the two of you.</p>}
          {s.history.map((h) => (
            <div key={h.day} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <p className="text-[11px] font-bold text-white/45">{new Date(h.day + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p className="mt-0.5 text-sm font-semibold">{h.prompt}</p>
              <div className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                <p className="rounded-xl bg-rose-500/10 px-3 py-2"><b className="text-rose-300">{me.name}:</b> {h.mine}</p>
                <p className="rounded-xl bg-violet-500/10 px-3 py-2"><b className="text-violet-300">{partner.name}:</b> {h.theirs}</p>
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
