'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/** The first partner is rose, the second violet — used everywhere so nobody has to decode "you" vs "me". */
export const PLAYER_COLORS = [
  { text: 'text-rose-300', bg: 'bg-rose-500/20', border: 'border-rose-400/50', ring: 'ring-rose-400', solid: 'bg-rose-500', hex: '#fb7185' },
  { text: 'text-violet-300', bg: 'bg-violet-500/20', border: 'border-violet-400/50', ring: 'ring-violet-400', solid: 'bg-violet-500', hex: '#a78bfa' },
] as const

export function Avatar({ emoji, index, size = 'md', ring = true }: { emoji: string; index: 0 | 1; size?: 'sm' | 'md' | 'lg'; ring?: boolean }) {
  const c = PLAYER_COLORS[index]
  const dim = size === 'sm' ? 'h-8 w-8 text-lg' : size === 'lg' ? 'h-16 w-16 text-4xl' : 'h-11 w-11 text-2xl'
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full', dim, c.bg, ring && `ring-2 ${c.ring}`)} aria-hidden>
      {emoji}
    </span>
  )
}

export function NameTag({ name, emoji, index }: { name: string; emoji: string; index: 0 | 1 }) {
  const c = PLAYER_COLORS[index]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold', c.bg, c.border, c.text)}>
      <span aria-hidden>{emoji}</span>
      {name}
    </span>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-fuchsia-500" initial={false} animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
    </div>
  )
}

/** Decorative floating hearts behind the page. Pure CSS, disabled for reduced-motion users. */
export function FloatingHearts({ count = 9 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 97) % 100}%`,
        top: `${(i * 53) % 90}%`,
        size: 14 + ((i * 7) % 22),
        delay: `${(i % 5) * -2.4}s`,
        opacity: 0.08 + ((i % 4) * 0.03),
        glyph: i % 3 === 0 ? '💗' : i % 3 === 1 ? '💜' : '💕',
      })),
    [count],
  )
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {items.map((h, i) => (
        <span key={i} className="absolute animate-float select-none" style={{ left: h.left, top: h.top, fontSize: h.size, animationDelay: h.delay, opacity: h.opacity }}>
          {h.glyph}
        </span>
      ))}
    </div>
  )
}

/** A short burst of hearts to celebrate a match, a streak or a win. */
export function HeartBurst({ show, glyphs = ['💖', '💕', '✨', '💗', '🎉'] }: { show: boolean; glyphs?: string[] }) {
  const parts = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const angle = (i / 22) * Math.PI * 2 + (i % 3) * 0.2
        const dist = 90 + ((i * 37) % 120)
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 40, r: ((i * 53) % 90) - 45, g: glyphs[i % glyphs.length], s: 18 + ((i * 11) % 18) }
      }),
    [glyphs],
  )
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center" aria-hidden>
          {parts.map((p, i) => (
            <motion.span key={i} className="absolute" style={{ fontSize: p.s }} initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }} animate={{ x: p.x, y: p.y + 120, opacity: 0, scale: 1.2, rotate: p.r }} transition={{ duration: 1.5, ease: 'easeOut' }}>
              {p.g}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

/** Fires `show` for ~1.6s whenever `trigger` changes to a truthy value. */
export function useCelebrate(trigger: unknown) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!trigger) return
    const start = setTimeout(() => setShow(true), 0)
    const stop = setTimeout(() => setShow(false), 1700)
    return () => {
      clearTimeout(start)
      clearTimeout(stop)
    }
  }, [trigger])
  return show
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-label={title} className="glass-strong safe-bottom relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 sm:rounded-b-3xl" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="display text-xl font-bold">{title}</h2>
              <button onClick={onClose} className="btn btn-soft btn-sm" aria-label="Close">✕</button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white', className)} aria-hidden />
}

export function EmptyState({ emoji, title, body }: { emoji: string; title: string; body?: string }) {
  return (
    <div className="glass p-8 text-center">
      <div className="text-4xl" aria-hidden>{emoji}</div>
      <h3 className="display mt-2 text-lg font-bold">{title}</h3>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-white/60">{body}</p>}
    </div>
  )
}
