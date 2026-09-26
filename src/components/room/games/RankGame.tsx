'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { RankView } from '@/games/engines/sync'
import { useRoom } from '../store'
import { BigScore, GameFrame, PartnerStatus, ReadyButton, usePlayers, WaitingNote } from './Frame'
import { cn, HeartBurst, NameTag, useCelebrate } from '@/components/ui'

export function RankGame({ view }: { view: RankView }) {
  const { send, act, busy } = useRoom()
  const { me, partner } = usePlayers()
  const [order, setOrder] = useState<number[]>([])
  const celebrate = useCelebrate(view.stage === 'reveal' && (view.similarity ?? 0) >= 80 ? `r${view.index}` : view.stage === 'summary' ? 'end' : null)

  if (view.stage === 'summary') {
    return (
      <GameFrame gameId="rank">
        <HeartBurst show={celebrate} />
        <div className="glass-strong p-6 text-center">
          <BigScore percent={view.average ?? 0} label="alike" />
          <h3 className="display mt-3 text-2xl font-bold">{(view.average ?? 0) >= 80 ? 'Practically the same person 😍' : (view.average ?? 0) >= 55 ? 'Lovely overlap, fun differences' : 'Wonderfully different tastes 😄'}</h3>
          <p className="mt-1 text-sm text-white/60">Average similarity over {view.total} rankings.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: 'game.start', replace: true, game: 'rank' })}>Play again 🔁</button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => act({ type: 'game.stop' })}>All games</button>
          </div>
        </div>
      </GameFrame>
    )
  }

  return (
    <GameFrame gameId="rank" unit="Ranking" progress={{ index: view.index, total: view.total }}>
      <HeartBurst show={celebrate} />
      <motion.div key={view.promptId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5 sm:p-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="chip">📊 Rank & Reveal</span>
          <PartnerStatus name={partner.name} done={view.partner.done} index={partner.index} doneText="has ranked" />
        </div>
        <h3 className="display text-xl leading-snug font-bold text-balance sm:text-2xl">{view.title}</h3>

        {view.stage === 'ranking' && (
          <RankPicker items={view.items} order={order} setOrder={setOrder} busy={busy} onSubmit={async () => { if (await send({ type: 'rank', promptId: view.promptId, order })) setOrder([]) }} />
        )}

        {view.stage === 'waiting' && (
          <div className="mt-4 space-y-3">
            <RankedList items={view.items} order={view.me.order!} title="Your ranking" />
            <WaitingNote text={`Waiting for ${partner.name}…`} sub="Rankings are revealed together." />
          </div>
        )}

        {view.stage === 'reveal' && view.me.order && view.partner.order && (
          <div className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <RankedList items={view.items} order={view.me.order} title={me.name} tag={<NameTag name={me.name} emoji={me.avatar} index={me.index} />} other={view.partner.order} />
              <RankedList items={view.items} order={view.partner.order} title={partner.name} tag={<NameTag name={partner.name} emoji={partner.avatar} index={partner.index} />} other={view.me.order} />
            </div>
            <div className="mt-4 flex flex-col items-center gap-1 text-center">
              <BigScore percent={view.similarity ?? 0} label="alike" />
              {view.biggestGap && view.biggestGap.mine !== view.biggestGap.theirs && (
                <p className="mt-1 text-sm text-white/70">Biggest gap: <b>{view.biggestGap.item}</b> — {me.name} put it #{view.biggestGap.mine}, {partner.name} put it #{view.biggestGap.theirs}. Talk about it! 🗣️</p>
              )}
            </div>
            <ReadyButton label={view.index + 1 >= view.total ? 'See final result 🎉' : 'Next ranking →'} meReady={view.me.ready} partnerName={partner.name} partnerReady={view.partner.ready} disabled={busy} onClick={() => send({ type: 'next' })} />
          </div>
        )}
      </motion.div>
    </GameFrame>
  )
}

function RankPicker({ items, order, setOrder, busy, onSubmit }: { items: string[]; order: number[]; setOrder: (o: number[]) => void; busy: boolean; onSubmit: () => void }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-white/55">Tap in order: your #1 first, #5 last.</p>
      <div className="space-y-2">
        {items.map((it, i) => {
          const pos = order.indexOf(i)
          return (
            <button key={i} type="button" disabled={busy || pos !== -1} onClick={() => setOrder([...order, i])} className={cn('option', pos !== -1 && 'option-selected')}>
              <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-black', pos !== -1 ? 'border-white bg-white/25' : 'border-white/25 text-white/40')}>{pos !== -1 ? pos + 1 : '·'}</span>
              <span>{it}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn btn-ghost" disabled={busy || order.length === 0} onClick={() => setOrder(order.slice(0, -1))}>Undo</button>
        <button className="btn btn-primary flex-1" disabled={busy || order.length !== items.length} onClick={onSubmit}>Lock in ranking 🔒</button>
      </div>
    </div>
  )
}

function RankedList({ items, order, title, tag, other }: { items: string[]; order: number[]; title: string; tag?: React.ReactNode; other?: number[] }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-3">
      <div className="mb-2">{tag ?? <span className="text-xs font-bold text-white/60 uppercase">{title}</span>}</div>
      <ol className="space-y-1.5">
        {order.map((item, pos) => {
          const same = other ? other[pos] === item : false
          return (
            <li key={item} className={cn('flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm', same ? 'bg-emerald-500/15' : 'bg-white/[0.05]')}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-black">{pos + 1}</span>
              <span className="flex-1">{items[item]}</span>
              {same && <span aria-label="same position">✓</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
