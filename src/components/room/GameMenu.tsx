'use client'

import { useState } from 'react'
import { GAMES, GROUP_ORDER, type GameDef } from '@/games/registry'
import { useRoom } from './store'
import { cn, Sheet } from '@/components/ui'

const GROUP_BLURB: Record<string, string> = {
  Sync: 'Win together by thinking alike',
  'Get to know': 'Discover new things about each other',
  Party: 'Laughs, dares and confessions',
  Deep: 'Slow down and really connect',
  Board: 'Friendly competition',
}

function GameCard({ g, onPick, featured }: { g: GameDef; onPick: (g: GameDef) => void; featured?: boolean }) {
  return (
    <button onClick={() => onPick(g)} className={cn('glass group relative flex h-full w-full flex-col overflow-hidden p-4 text-left transition hover:-translate-y-0.5 hover:border-white/30 active:scale-[0.98]', featured && 'min-w-64 snap-start sm:min-w-0')}>
      <div className={cn('pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-40 blur-2xl transition group-hover:opacity-70', g.gradient)} aria-hidden />
      <div className="flex items-start justify-between">
        <span className={cn('grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg', g.gradient)} aria-hidden>{g.emoji}</span>
        {g.badge && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-black uppercase', g.badge === 'New' ? 'bg-emerald-400 text-emerald-950' : g.badge === 'Popular' ? 'bg-amber-300 text-amber-950' : 'bg-white/15 text-white/80')}>{g.badge}</span>}
      </div>
      <h3 className="display mt-3 text-lg leading-tight font-bold">{g.title}</h3>
      <p className="mt-1 flex-1 text-[13px] leading-snug text-white/60">{g.tagline}</p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/45">
        <span>⏱ {g.duration}</span>
        {g.hook && <span className="truncate pl-2 text-right text-pink-200/80">{g.hook}</span>}
      </div>
    </button>
  )
}

export function GameMenu() {
  const { act, busy } = useRoom()
  const [picking, setPicking] = useState<GameDef | null>(null)
  const [choice, setChoice] = useState<string>('')
  const [adult, setAdult] = useState(false)

  const start = async (g: GameDef, value?: string) => {
    const options = g.option && value ? { [g.option.key]: value } : {}
    const ok = await act({ type: 'game.start', game: g.id, options })
    if (ok) setPicking(null)
  }
  const pick = (g: GameDef) => {
    if (!g.option) return void start(g)
    setChoice(g.option.default)
    setAdult(false)
    setPicking(g)
  }

  const featured = GAMES.filter((g) => g.featured)
  const opt = picking?.option
  const needsAdult = !!opt?.adultOnly?.includes(choice)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="display mb-3 text-xl font-bold">Play now</h2>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {featured.map((g) => <GameCard key={g.id} g={g} onPick={pick} featured />)}
        </div>
      </section>

      {GROUP_ORDER.map((group) => {
        const list = GAMES.filter((g) => g.group === group)
        if (!list.length) return null
        return (
          <section key={group}>
            <div className="mb-3">
              <h2 className="display text-xl font-bold">{group}</h2>
              <p className="text-sm text-white/50">{GROUP_BLURB[group]}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((g) => <GameCard key={g.id} g={g} onPick={pick} />)}
            </div>
          </section>
        )
      })}

      <Sheet open={!!picking} onClose={() => setPicking(null)} title={picking ? `${picking.emoji} ${picking.title}` : ''}>
        {picking && opt && (
          <div>
            <p className="mb-3 text-sm text-white/65">{picking.tagline}</p>
            <p className="label">{opt.label}</p>
            <div className="space-y-2">
              {opt.choices.map((c) => (
                <button key={c.id} className={cn('option', choice === c.id && 'option-selected')} onClick={() => { setChoice(c.id); setAdult(false) }}>
                  <span className="text-2xl" aria-hidden>{c.emoji}</span>
                  <span className="flex-1"><span className="block font-bold">{c.name}</span><span className="block text-xs font-normal text-white/55">{c.blurb}</span></span>
                </button>
              ))}
            </div>
            {needsAdult && (
              <label className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-pink-500" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
                <span>We are both 18 or older and want the flirty version. It stays classy — never explicit.</span>
              </label>
            )}
            <button className="btn btn-primary mt-4 w-full" disabled={busy || (needsAdult && !adult)} onClick={() => start(picking, choice)}>Start playing</button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
