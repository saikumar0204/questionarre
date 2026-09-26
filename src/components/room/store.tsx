'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Snapshot } from '@/lib/room'
import { AnimatePresence, motion } from 'framer-motion'

type Toast = { id: number; text: string; kind: 'ok' | 'error' }

type RoomCtx = {
  snap: Snapshot
  busy: boolean
  /** POST an action. Resolves true on success. Errors show up as a toast. */
  act: (body: Record<string, unknown>) => Promise<boolean>
  /** shorthand for game events */
  send: (event: Record<string, unknown>) => Promise<boolean>
  toast: (text: string, kind?: Toast['kind']) => void
  connection: 'live' | 'reconnecting'
}

const Ctx = createContext<RoomCtx | null>(null)

export function useRoom() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useRoom must be used inside <RoomProvider>')
  return c
}

const POLL_MS = 1800

export function RoomProvider({ initial, children }: { initial: Snapshot; children: React.ReactNode }) {
  const [snap, setSnap] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [connection, setConnection] = useState<RoomCtx['connection']>('live')
  const vRef = useRef(initial.v)
  const seq = useRef(0)
  const roomId = initial.roomId

  const apply = useCallback((next: Snapshot) => {
    // never let an older response (a slow poll) overwrite a newer one
    if (next.v >= vRef.current) {
      vRef.current = next.v
      setSnap(next)
    }
  }, [])

  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = ++seq.current
    setToasts((t) => [...t.slice(-2), { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 4200 : 3400)
  }, [])

  const act = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true)
      try {
        const res = await fetch(`/api/room/${roomId}/act`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast(data.error || 'Something went wrong. Please try again.', 'error')
          return false
        }
        apply(data.snapshot)
        if (data.toast) toast(data.toast)
        return true
      } catch {
        toast('You seem to be offline. Check your connection.', 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [roomId, apply, toast],
  )

  const send = useCallback((event: Record<string, unknown>) => act({ type: 'game.event', event }), [act])

  // Polling: one tiny request every ~2s that only returns data when something changed.
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    let failures = 0

    const tick = async () => {
      if (stopped) return
      if (document.visibilityState === 'visible') {
        try {
          const res = await fetch(`/api/room/${roomId}/state?v=${vRef.current}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            if (data.changed && data.snapshot) apply(data.snapshot)
            failures = 0
            setConnection('live')
          } else if (res.status === 401 || res.status === 404) {
            failures = 0
          } else throw new Error('bad status')
        } catch {
          failures++
          if (failures >= 2) setConnection('reconnecting')
        }
      }
      timer = setTimeout(tick, failures > 0 ? Math.min(8000, POLL_MS * (failures + 1)) : POLL_MS)
    }
    timer = setTimeout(tick, POLL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer)
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [roomId, apply])

  const value = useMemo(() => ({ snap, busy, act, send, toast, connection }), [snap, busy, act, send, toast, connection])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: -14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} className={`pointer-events-auto max-w-md rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-2xl backdrop-blur-xl ${t.kind === 'error' ? 'border-red-400/40 bg-red-950/80 text-red-100' : 'border-pink-400/40 bg-fuchsia-950/80 text-pink-50'}`}>
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
