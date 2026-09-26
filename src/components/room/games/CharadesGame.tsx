'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { CharadesView, Stroke } from '@/games/engines/charades'
import { useRoom } from '../store'
import { BigScore, GameFrame, ReadyButton, usePlayers, WaitingNote } from './Frame'
import { cn, HeartBurst, NameTag, useCelebrate } from '@/components/ui'

/* ------------------------------------------------ canvas helpers ------------------------------------------------ */
const COLORS = ['#1f2937', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']
const WIDTHS = [6, 14, 28]
const PAPER = '#fffbeb'
const MAX_STROKES = 80
const MAX_POINTS = 3900
const STROKE_SPLIT = 380

function paint(ctx: CanvasRenderingContext2D, strokes: Stroke[], upTo = Infinity) {
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, 1000, 1000)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  let drawn = 0
  for (const s of strokes) {
    if (drawn >= upTo) break
    const n = Math.min(s.p.length, upTo - drawn)
    ctx.strokeStyle = COLORS[s.c] ?? COLORS[0]
    ctx.fillStyle = COLORS[s.c] ?? COLORS[0]
    ctx.lineWidth = WIDTHS[s.w] ?? WIDTHS[1]
    if (n === 1) {
      ctx.beginPath()
      ctx.arc(s.p[0][0], s.p[0][1], (WIDTHS[s.w] ?? 14) / 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.moveTo(s.p[0][0], s.p[0][1])
      for (let i = 1; i < n; i++) ctx.lineTo(s.p[i][0], s.p[i][1])
      ctx.stroke()
    }
    drawn += s.p.length
  }
}

/** Shows a drawing. With `animate`, replays it stroke by stroke like a time-lapse. */
function Replay({ strokes, animate }: { strokes: Stroke[]; animate: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    const total = strokes.reduce((n, s) => n + s.p.length, 0)
    if (!animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      paint(ctx, strokes)
      return
    }
    const duration = Math.min(6000, Math.max(2200, total * 14))
    const t0 = performance.now()
    let raf = 0
    const frame = (t: number) => {
      const k = Math.min(1, (t - t0) / duration)
      paint(ctx, strokes, Math.ceil(total * k))
      if (k < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [strokes, animate, run])

  return (
    <div className="relative">
      <canvas ref={ref} width={1000} height={1000} className="mx-auto aspect-square w-full max-w-md rounded-2xl border-4 border-amber-100/70 shadow-xl" aria-label="Your partner's drawing" />
      {animate && <button type="button" className="btn btn-soft btn-sm absolute right-2 bottom-2 sm:right-[calc(50%-13.5rem)]" onClick={() => setRun((r) => r + 1)}>↻ Replay</button>}
    </div>
  )
}

function DrawPad({ onSend, busy }: { onSend: (s: Stroke[]) => void; busy: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([])
  const drawing = useRef(false)
  const [color, setColor] = useState(0)
  const [width, setWidth] = useState(1)
  const [count, setCount] = useState(0)

  const redraw = useCallback(() => {
    const ctx = ref.current?.getContext('2d')
    if (ctx) paint(ctx, strokes.current)
    setCount(strokes.current.length)
  }, [])
  useEffect(() => redraw(), [redraw])

  const pos = (e: React.PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect()
    return [Math.max(0, Math.min(1000, Math.round(((e.clientX - r.left) / r.width) * 1000))), Math.max(0, Math.min(1000, Math.round(((e.clientY - r.top) / r.height) * 1000)))]
  }
  const totalPoints = () => strokes.current.reduce((n, s) => n + s.p.length, 0)

  const down = (e: React.PointerEvent) => {
    if (strokes.current.length >= MAX_STROKES || totalPoints() >= MAX_POINTS) return
    try {
      ref.current?.setPointerCapture(e.pointerId)
    } catch {
      /* not an active pointer (e.g. synthetic event): drawing still works */
    }
    drawing.current = true
    strokes.current.push({ c: color, w: width, p: [pos(e)] })
    redraw()
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const cur = strokes.current[strokes.current.length - 1]
    const [x, y] = pos(e)
    const last = cur.p[cur.p.length - 1]
    if (Math.hypot(x - last[0], y - last[1]) < 5) return
    if (totalPoints() >= MAX_POINTS) return
    cur.p.push([x, y])
    if (cur.p.length >= STROKE_SPLIT && strokes.current.length < MAX_STROKES) strokes.current.push({ c: cur.c, w: cur.w, p: [[x, y]] })
    const ctx = ref.current?.getContext('2d')
    if (ctx) paint(ctx, strokes.current)
  }
  const up = () => {
    drawing.current = false
    setCount(strokes.current.length)
  }

  return (
    <div>
      <canvas ref={ref} width={1000} height={1000} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="mx-auto aspect-square w-full max-w-md touch-none rounded-2xl border-4 border-amber-100/70 shadow-xl" aria-label="Drawing canvas" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5" role="radiogroup" aria-label="Colour">
          {COLORS.map((c, i) => <button key={c} type="button" role="radio" aria-checked={color === i} aria-label={`Colour ${i + 1}`} onClick={() => setColor(i)} className={cn('h-8 w-8 rounded-full border-2 transition', color === i ? 'scale-110 border-white' : 'border-transparent')} style={{ background: c }} />)}
        </div>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Brush size">
          {WIDTHS.map((w, i) => <button key={w} type="button" role="radio" aria-checked={width === i} aria-label={`Brush ${i + 1}`} onClick={() => setWidth(i)} className={cn('grid h-8 w-8 place-items-center rounded-full border transition', width === i ? 'border-white bg-white/20' : 'border-white/20')}><span className="rounded-full bg-white" style={{ width: 4 + i * 5, height: 4 + i * 5 }} /></button>)}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn btn-ghost btn-sm" disabled={count === 0} onClick={() => { strokes.current.pop(); redraw() }}>↶ Undo</button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={count === 0} onClick={() => { strokes.current = []; redraw() }}>🗑 Clear</button>
        <button type="button" className="btn btn-primary flex-1" disabled={busy || count === 0} onClick={() => onSend(strokes.current)}>Send my drawing 🎨</button>
      </div>
    </div>
  )
}

/* ------------------------------------------------ emoji picker ------------------------------------------------ */
const EMOJI_SETS: { label: string; items: string[] }[] = [
  { label: 'Love', items: ['💕', '❤️', '😍', '😘', '🥰', '💋', '💍', '💐', '🌹', '💏', '👫', '🫶'] },
  { label: 'Food', items: ['🍕', '🍔', '🍟', '🌮', '🍜', '🍛', '🍣', '🍰', '🎂', '🍦', '🍫', '🍿', '☕', '🍵', '🍷', '🥂', '🍓', '🍎'] },
  { label: 'Travel', items: ['✈️', '🚗', '🚂', '🚢', '🏖️', '🏔️', '🌅', '🌙', '⭐', '🌈', '☔', '❄️', '🔥', '🏕️', '🗼', '🚀'] },
  { label: 'Fun', items: ['🎬', '🎤', '🎶', '💃', '🕺', '🎉', '🎁', '🎮', '🏏', '⚽', '📸', '📱', '🛍️', '🏋️', '🎡', '🪔'] },
  { label: 'Faces', items: ['😂', '😭', '😱', '🤔', '😴', '🥳', '😎', '🤯', '🥶', '🥵', '🤤', '😈', '🙈', '👻', '🤖', '👀'] },
  { label: 'Things', items: ['🏠', '🛏️', '🕯️', '📖', '💌', '⏰', '💡', '🔑', '👑', '🦁', '🐘', '🐒', '🦋', '🐶', '🐱', '🦖'] },
]

function EmojiPicker({ onSend, busy }: { onSend: (s: string) => void; busy: boolean }) {
  const [sel, setSel] = useState<string[]>([])
  const [tab, setTab] = useState(0)
  return (
    <div>
      <div className="flex min-h-16 items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-black/30 px-3 py-2 text-4xl" aria-live="polite">
        {sel.length === 0 ? <span className="text-sm text-white/40">Tap up to 8 emojis to tell the story</span> : sel.map((e, i) => <motion.span key={`${i}-${e}`} initial={{ scale: 0 }} animate={{ scale: 1 }}>{e}</motion.span>)}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {EMOJI_SETS.map((s, i) => <button key={s.label} type="button" onClick={() => setTab(i)} className={cn('chip', tab === i && 'border-pink-400 bg-pink-500/25')}>{s.label}</button>)}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        {EMOJI_SETS[tab].items.map((e) => <button key={e} type="button" disabled={sel.length >= 8} onClick={() => setSel([...sel, e])} className="grid aspect-square place-items-center rounded-xl bg-white/[0.06] text-2xl transition hover:bg-white/15 active:scale-90 disabled:opacity-40">{e}</button>)}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn btn-ghost btn-sm" disabled={sel.length === 0} onClick={() => setSel(sel.slice(0, -1))}>⌫</button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={sel.length === 0} onClick={() => setSel([])}>Clear</button>
        <button type="button" className="btn btn-primary flex-1" disabled={busy || sel.length === 0} onClick={() => onSend(sel.join(''))}>Send emojis 🤯</button>
      </div>
    </div>
  )
}

/* ------------------------------------------------ the game ------------------------------------------------ */
export function CharadesGame({ view }: { view: CharadesView }) {
  const { send, act, busy } = useRoom()
  const { me, partner, ordered } = usePlayers()
  const [guess, setGuess] = useState('')
  const isDraw = view.mode === 'draw'
  const gameId = isDraw ? 'doodle' : 'emoji'
  const giver = ordered.find((p) => p.name === view.giverName) ?? me
  const isGiver = view.role === 'giver'
  const celebrate = useCelebrate(view.phase === 'reveal' && view.solved ? `r${view.round}` : view.finished ? 'end' : null)
  const blanks = view.pattern.map((n) => Array.from({ length: n }, () => '＿').join(' ')).join('   ')

  const clueView = view.clue ? (isDraw ? <Replay strokes={view.clue as Stroke[]} animate={!isGiver && view.phase === 'guess'} /> : <div className="rounded-2xl border border-white/15 bg-black/30 px-3 py-5 text-center text-5xl leading-snug tracking-wide break-all">{view.clue as string}</div>) : null

  if (view.finished) {
    return (
      <GameFrame gameId={gameId}>
        <HeartBurst show={celebrate} glyphs={isDraw ? ['🎨', '✨', '💖'] : ['🤯', '✨', '💖']} />
        <div className="glass-strong p-6 text-center">
          <BigScore percent={Math.round((view.score / view.maxScore) * 100)} label="cracked" />
          <h3 className="display mt-3 text-2xl font-bold">{view.score >= view.maxScore * 0.7 ? 'You read each other perfectly 🔮' : view.score >= view.maxScore * 0.4 ? 'A solid team' : 'Hilariously misunderstood 😂'}</h3>
          <p className="mt-1 text-sm text-white/60">{view.history.filter((h) => h.solved).length} of {view.history.length} solved together.</p>
          <ul className="mt-4 space-y-1.5 text-left">
            {view.history.map((h, i) => (
              <li key={i} className="flex items-center justify-between rounded-2xl bg-white/[0.06] px-3 py-2 text-sm">
                <span className="font-semibold">{h.word}</span>
                <span className={h.solved ? 'text-emerald-300' : 'text-white/40'}>{h.solved ? `✓ in ${h.guessesUsed}` : '✗ missed'}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: 'game.start', replace: true, game: gameId })}>Play again 🔁</button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => act({ type: 'game.stop' })}>All games</button>
          </div>
        </div>
      </GameFrame>
    )
  }

  return (
    <GameFrame gameId={gameId} unit="Round" progress={{ index: view.round - 1, total: view.totalRounds }}>
      <HeartBurst show={celebrate} glyphs={isDraw ? ['🎨', '✨', '💖'] : ['🤯', '✨', '💖']} />
      <div className="glass-strong p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <NameTag name={giver.name} emoji={giver.avatar} index={giver.index} />
          <span className="chip">🎯 Team {view.score}/{view.maxScore}</span>
        </div>

        {/* GIVER: clue phase */}
        {view.phase === 'clue' && isGiver && (
          <div>
            <p className="text-center text-xs font-bold tracking-wide text-white/50 uppercase">Your secret {isDraw ? 'word' : 'phrase'} · {view.category}</p>
            <p className="display mt-1 text-center text-4xl font-black text-pink-200">{view.word}</p>
            <div className="mt-1 text-center">
              {view.rerollAvailable && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => send({ type: 'reroll' })}>🔀 Too hard? Swap it</button>}
            </div>
            <p className="mt-3 mb-2 text-center text-sm text-white/65">{isDraw ? `Draw it for ${partner.name}. No letters or numbers!` : `Explain it to ${partner.name} using emojis only.`}</p>
            {isDraw ? <DrawPad busy={busy} onSend={(clue) => send({ type: 'clue', clue })} /> : <EmojiPicker busy={busy} onSend={(clue) => send({ type: 'clue', clue })} />}
          </div>
        )}

        {/* GUESSER: waiting for the clue */}
        {view.phase === 'clue' && !isGiver && (
          <WaitingNote text={`${giver.name} is ${isDraw ? 'drawing' : 'choosing emojis'}…`} sub={`Hint: ${view.category} · ${blanks}`} />
        )}

        {/* guess phase */}
        {view.phase === 'guess' && (
          <div className="space-y-4">
            {clueView}
            {isGiver ? (
              <div>
                <p className="text-center text-sm text-white/65">Your secret word: <b className="text-pink-200">{view.word}</b></p>
                <div className="mt-2"><WaitingNote text={`${partner.name} is guessing…`} sub={view.guesses.length ? `Wrong so far: ${view.guesses.join(' · ')}` : `${view.guessesLeft} guesses left`} /></div>
              </div>
            ) : (
              <form onSubmit={async (e) => { e.preventDefault(); if (guess.trim() && (await send({ type: 'guess', text: guess.trim() }))) setGuess('') }} className="space-y-3">
                <div className="text-center">
                  <p className="text-xs font-bold tracking-wide text-white/50 uppercase">{view.category}</p>
                  <p className="mt-1 font-mono text-lg tracking-widest text-white/80">{blanks}</p>
                </div>
                {view.guesses.length > 0 && <div className="flex flex-wrap justify-center gap-1.5">{view.guesses.map((g, i) => <span key={i} className="chip border-red-400/40 bg-red-500/10 text-red-200 line-through">{g}</span>)}</div>}
                <input className="field text-center text-lg" value={guess} onChange={(e) => setGuess(e.target.value)} maxLength={40} placeholder={`What is ${giver.name}'s ${isDraw ? 'drawing' : 'message'}?`} autoComplete="off" autoFocus />
                <button className="btn btn-primary w-full" disabled={busy || !guess.trim()}>Guess ({view.guessesLeft} left {'💗'.repeat(view.guessesLeft)})</button>
              </form>
            )}
          </div>
        )}

        {/* reveal */}
        {view.phase === 'reveal' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
            {clueView}
            <p className="text-xs font-bold tracking-wide text-white/50 uppercase">The answer was</p>
            <p className="display text-4xl font-black">{view.word}</p>
            <p className={cn('text-lg font-bold', view.solved ? 'text-emerald-300' : 'text-amber-200')}>{view.solved ? `Solved in ${view.guesses.length}! 🎉` : 'Not this time — but what a picture 😄'}</p>
            <ReadyButton label={view.round >= view.totalRounds ? 'See final score 🏁' : 'Next round →'} meReady={false} partnerName={partner.name} partnerReady={false} disabled={busy} onClick={() => send({ type: 'next' })} />
          </motion.div>
        )}
      </div>
    </GameFrame>
  )
}
