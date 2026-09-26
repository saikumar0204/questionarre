'use client'

import { motion } from 'framer-motion'
import type { CardsView } from '@/games/engines/cards'
import { useRoom } from '../store'
import { GameFrame, ReadyButton, usePlayers } from './Frame'
import { HeartBurst, NameTag, useCelebrate } from '@/components/ui'

export function DeepGame({ view }: { view: CardsView }) {
  const { send, act, busy } = useRoom()
  const { me, partner, ordered } = usePlayers()
  const reader = ordered.find((p) => p.name === view.reader.name) ?? me
  const celebrate = useCelebrate(view.finished ? 'done' : null)

  if (view.finished) {
    return (
      <GameFrame gameId="deep">
        <HeartBurst show={celebrate} glyphs={['🌌', '💜', '✨', '💗']} />
        <div className="glass-strong p-7 text-center">
          <div className="text-5xl" aria-hidden>🌌</div>
          <h3 className="display mt-2 text-2xl font-bold">You finished the whole deck</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-white/60">{view.total} conversations that most couples never have. That is real closeness.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => act({ type: 'game.stop' })}>Choose another deck</button>
          </div>
        </div>
      </GameFrame>
    )
  }

  return (
    <GameFrame gameId="deep" unit="Card" progress={{ index: view.index, total: view.total }}>
      <motion.div key={view.index} initial={{ opacity: 0, y: 18, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} className="glass-strong p-6 sm:p-9">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="chip">{view.deckEmoji} {view.deckName}</span>
          <NameTag name={reader.name} emoji={reader.avatar} index={reader.index} />
        </div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-white/50 uppercase">{view.reader.isMe ? 'Read this aloud to your partner' : `${reader.name} reads this aloud`}</p>
        <p className="display text-[1.65rem] leading-snug font-bold text-balance sm:text-3xl">{view.text}</p>
        <p className="mt-5 text-sm text-white/55">Both of you answer out loud — take your time. Tap next when you have both shared.</p>
      </motion.div>
      <ReadyButton label="We talked about it 💬" meReady={view.me.ready} partnerName={partner.name} partnerReady={view.partner.ready} disabled={busy} onClick={() => send({ type: 'next' })} />
    </GameFrame>
  )
}
