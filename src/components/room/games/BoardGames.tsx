'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { BoardView, C4State, MemoryView, TttState } from '@/games/engines/board'
import { C4_COLS, C4_ROWS } from '@/games/engines/board'
import type { HuntView } from '@/games/engines/play'
import { useRoom } from '../store'
import { GameFrame, usePlayers } from './Frame'
import { cn, HeartBurst, PLAYER_COLORS, useCelebrate } from '@/components/ui'

type Idx = 0 | 1

function Series({ names, wins, turn, over, draws, myTurn, winner }: { names: [string, string]; wins: [number, number]; turn?: Idx; over: boolean; draws?: number; myTurn: boolean; winner?: Idx | 'draw' | null }) {
  const { ordered } = usePlayers()
  return (
    <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      {[0, 1].map((i) => {
        const c = PLAYER_COLORS[i]
        const active = !over && turn === i
        return (
          <div key={i} className={cn('rounded-2xl border px-3 py-2 transition', c.bg, active ? `${c.border} ring-2 ${c.ring}` : 'border-white/10 opacity-80', i === 1 && 'order-3 text-right')}>
            <p className={cn('truncate text-xs font-bold', c.text)}>{ordered[i].avatar} {names[i]}</p>
            <p className="display text-2xl font-black">{wins[i]}</p>
          </div>
        )
      })}
      <div className="order-2 text-center text-[11px] leading-tight font-bold text-white/55">
        {over ? (winner === 'draw' ? 'Draw!' : 'Round over') : myTurn ? <span className="text-pink-200">Your turn</span> : 'Their turn'}
        {typeof draws === 'number' && draws > 0 && <div className="font-normal">{draws} draw{draws > 1 ? 's' : ''}</div>}
      </div>
    </div>
  )
}

function ResultBar({ winner, me, names, onRematch, busy }: { winner: Idx | 'draw'; me: Idx; names: [string, string]; onRematch: () => void; busy: boolean }) {
  const won = winner === me
  return (
    <div className="glass mt-4 flex flex-col items-center gap-3 p-4 text-center">
      <p className="display text-xl font-bold">{winner === 'draw' ? "It's a draw! 🤝" : won ? 'You win! 🎉' : `${names[winner]} wins! 👏`}</p>
      <button className="btn btn-primary" disabled={busy} onClick={onRematch}>Rematch 🔁</button>
    </div>
  )
}

/* ------------------------------- Tic-Tac-Toe ------------------------------- */
export function TttGame({ view }: { view: BoardView<TttState> }) {
  const { send, busy } = useRoom()
  const [pending, setPending] = useState<number | null>(null)
  const { ordered } = usePlayers()
  const celebrate = useCelebrate(view.winner === view.me ? `w${view.round}` : null)
  return (
    <GameFrame gameId="ttt">
      <HeartBurst show={celebrate} />
      <Series names={view.names} wins={view.wins} turn={view.turn} over={view.winner !== null} draws={view.draws} myTurn={view.myTurn} winner={view.winner} />
      <div className="mx-auto grid aspect-square w-full max-w-sm grid-cols-3 gap-2.5">
        {view.board.map((cell, i) => {
          const inLine = view.line?.includes(i)
          return (
            <button key={i} aria-label={`Square ${i + 1}`} disabled={busy || cell !== null || !view.myTurn || view.winner !== null} onClick={async () => { setPending(i); await send({ type: 'move', cell: i }); setPending(null) }} className={cn('glass grid place-items-center text-5xl transition active:scale-95 sm:text-6xl', cell === null && view.myTurn && view.winner === null && 'hover:bg-white/15', inLine && 'border-pink-300 bg-pink-500/25')}>
              {(cell !== null || pending === i) && <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} className={cell === null ? 'opacity-60' : ''} transition={{ type: 'spring', stiffness: 320, damping: 14 }}>{ordered[cell ?? view.me].avatar}</motion.span>}
            </button>
          )
        })}
      </div>
      {view.winner !== null && <ResultBar winner={view.winner} me={view.me} names={view.names} busy={busy} onRematch={() => send({ type: 'rematch' })} />}
    </GameFrame>
  )
}

/* ------------------------------- Connect Four ------------------------------- */
export function C4Game({ view }: { view: BoardView<C4State> }) {
  const { send, busy } = useRoom()
  const { ordered } = usePlayers()
  const celebrate = useCelebrate(view.winner === view.me ? `w${view.round}` : null)
  return (
    <GameFrame gameId="c4">
      <HeartBurst show={celebrate} />
      <Series names={view.names} wins={view.wins} turn={view.turn} over={view.winner !== null} draws={view.draws} myTurn={view.myTurn} winner={view.winner} />
      <div className="glass mx-auto w-full max-w-md p-2.5">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${C4_COLS}, minmax(0, 1fr))` }}>
          {Array.from({ length: C4_COLS }, (_, col) => (
            <button key={`h${col}`} aria-label={`Drop in column ${col + 1}`} disabled={busy || !view.myTurn || view.winner !== null || view.board[col] !== null} onClick={() => send({ type: 'drop', col })} className="btn btn-soft !min-h-8 !rounded-lg !p-0 text-xs">▼</button>
          ))}
          {view.board.map((cell, i) => {
            const inLine = view.line?.includes(i)
            const last = view.lastMove === i
            return (
              <div key={i} className={cn('grid aspect-square place-items-center rounded-full bg-black/40 text-2xl sm:text-3xl', inLine && 'bg-pink-500/30 ring-2 ring-pink-300')}>
                {cell !== null && <motion.span initial={last ? { y: -180, opacity: 0.5 } : false} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>{ordered[cell].avatar}</motion.span>}
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-white/45">{C4_ROWS}×{C4_COLS} · get four in a row</p>
      {view.winner !== null && <ResultBar winner={view.winner} me={view.me} names={view.names} busy={busy} onRematch={() => send({ type: 'rematch' })} />}
    </GameFrame>
  )
}

/* ------------------------------- Memory Match ------------------------------- */
export function MemoryGame({ view }: { view: MemoryView }) {
  const { send, busy } = useRoom()
  const winner: Idx | 'draw' | null = view.over ? (view.scores[0] === view.scores[1] ? 'draw' : view.scores[0] > view.scores[1] ? 0 : 1) : null
  const celebrate = useCelebrate(winner === view.me ? `w${view.round}` : null)
  const { ordered } = usePlayers()
  return (
    <GameFrame gameId="memory">
      <HeartBurst show={celebrate} />
      <div className="mb-3 grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className={cn('rounded-2xl border px-3 py-2', PLAYER_COLORS[i].bg, !view.over && view.turn === i ? `${PLAYER_COLORS[i].border} ring-2 ${PLAYER_COLORS[i].ring}` : 'border-white/10 opacity-80')}>
            <p className={cn('truncate text-xs font-bold', PLAYER_COLORS[i].text)}>{ordered[i].avatar} {view.names[i]} {!view.over && view.turn === i && '· turn'}</p>
            <p className="display text-2xl font-black">{view.scores[i]} <span className="text-xs font-semibold text-white/45">pairs · {view.wins[i]} wins</span></p>
          </div>
        ))}
      </div>
      <div className="mx-auto grid max-w-sm grid-cols-4 gap-2.5">
        {view.cards.map((c, i) => {
          const faceUp = c.symbol !== null
          return (
            <button key={i} aria-label={faceUp ? `Card ${c.symbol}` : `Hidden card ${i + 1}`} disabled={busy || !view.myTurn || c.owner !== null || c.open} onClick={() => send({ type: 'flip', i })} className={cn('relative aspect-square [perspective:600px]')}>
              <motion.div className="absolute inset-0 [transform-style:preserve-3d]" initial={false} animate={{ rotateY: faceUp ? 180 : 0 }} transition={{ duration: 0.4 }}>
                <span className="glass absolute inset-0 grid place-items-center rounded-2xl text-2xl [backface-visibility:hidden]">💗</span>
                <span className={cn('absolute inset-0 grid [transform:rotateY(180deg)] place-items-center rounded-2xl border text-3xl [backface-visibility:hidden]', c.owner === null ? 'border-white/25 bg-white/15' : `${PLAYER_COLORS[c.owner].bg} ${PLAYER_COLORS[c.owner].border}`)}>{c.symbol}</span>
              </motion.div>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-white/55">{view.over ? '' : view.myTurn ? (view.lastWasMismatch ? 'No match — remember those! Your turn 🧠' : 'Flip two cards') : `${view.names[view.turn]} is flipping…`}</p>
      {winner !== null && <ResultBar winner={winner} me={view.me} names={view.names} busy={busy} onRematch={() => send({ type: 'rematch' })} />}
    </GameFrame>
  )
}

/* ------------------------------- Heart Hunt ------------------------------- */

export function HuntGame({ view }: { view: HuntView }) {
  const { send, busy } = useRoom()
  const { partner } = usePlayers()
  const [picked, setPicked] = useState<number[]>([])
  const [pending, setPending] = useState<number | null>(null)
  const celebrate = useCelebrate(view.winner === view.me ? `w${view.round}` : null)
  const shoot = async (i: number) => {
    setPending(i) // show the tap instantly; the server confirms hit or miss a moment later
    await send({ type: 'shoot', cell: i })
    setPending(null)
  }
  const cells = Array.from({ length: view.size * view.size }, (_, i) => i)
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < view.heartsToHide ? [...p, i] : p))
  const partnerName = partner.name

  return (
    <GameFrame gameId="hunt">
      <HeartBurst show={celebrate} glyphs={['💘', '💖', '🎯', '✨']} />
      <div className="mb-3 grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className={cn('rounded-2xl border px-3 py-2', PLAYER_COLORS[i].bg, view.phase === 'play' && (view.myTurn ? view.me === i : view.me !== i) ? `${PLAYER_COLORS[i].border} ring-2 ${PLAYER_COLORS[i].ring}` : 'border-white/10 opacity-80')}>
            <p className={cn('truncate text-xs font-bold', PLAYER_COLORS[i].text)}>{view.names[i]}</p>
            <p className="display text-xl font-black">{view.wins[i]} <span className="text-xs font-semibold text-white/45">wins</span></p>
          </div>
        ))}
      </div>

      {view.phase === 'place' && (
        <div className="glass-strong p-5 text-center">
          {view.placed.me ? (
            <>
              <div className="text-4xl" aria-hidden>🙈</div>
              <h3 className="display mt-2 text-xl font-bold">Hearts hidden!</h3>
              <p className="mt-1 text-sm text-white/60">Waiting for {partnerName} to hide theirs…</p>
              <Grid size={view.size} cells={cells} render={(i) => (view.myBoard.hearts.includes(i) ? '💗' : '')} />
            </>
          ) : (
            <>
              <h3 className="display text-xl font-bold">Hide {view.heartsToHide} hearts 💗</h3>
              <p className="mt-1 text-sm text-white/60">Tap {view.heartsToHide} squares. {partnerName} will try to find them.</p>
              <Grid size={view.size} cells={cells} onCell={toggle} render={(i) => (picked.includes(i) ? '💗' : '')} active={(i) => picked.includes(i)} />
              <button className="btn btn-primary mt-4" disabled={busy || picked.length !== view.heartsToHide} onClick={() => send({ type: 'place', cells: picked })}>Hide them ({picked.length}/{view.heartsToHide})</button>
            </>
          )}
        </div>
      )}

      {view.phase !== 'place' && (
        <div className="space-y-4">
          <div className="glass-strong p-4">
            <p className="mb-2 text-center text-sm font-bold">
              {view.phase === 'over' ? (view.winner === view.me ? 'You found every heart! 🎉' : `${view.names[view.winner ?? 0]} found all your hearts`) : view.myTurn ? `Your turn — find ${partnerName}’s hearts (${view.found.me}/${view.heartsToHide})` : `${partnerName} is searching…`}
            </p>
            <Grid
              size={view.size}
              cells={cells}
              onCell={view.myTurn && view.phase === 'play' ? shoot : undefined}
              disabled={(i) => busy || view.theirBoard.hits.includes(i) || view.theirBoard.misses.includes(i)}
              render={(i) => (view.theirBoard.hits.includes(i) ? '💗' : view.theirBoard.misses.includes(i) ? '·' : view.theirBoard.hearts?.includes(i) ? '💔' : pending === i ? '🔍' : '')}
              active={(i) => view.theirBoard.hits.includes(i)}
            />
            <p className="mt-2 text-center text-[11px] text-white/45">A hit earns another shot!</p>
          </div>
          <div className="glass p-4">
            <p className="mb-2 text-center text-xs font-bold text-white/60">Your hidden hearts ({view.found.partner}/{view.heartsToHide} found by {partnerName})</p>
            <Grid size={view.size} cells={cells} small render={(i) => (view.myBoard.hitsAgainstMe.includes(i) ? '💔' : view.myBoard.hearts.includes(i) ? '💗' : view.myBoard.missesAgainstMe.includes(i) ? '·' : '')} />
          </div>
          {view.phase === 'over' && (
            <div className="glass flex flex-col items-center gap-3 p-4 text-center">
              <button className="btn btn-primary" disabled={busy} onClick={() => send({ type: 'rematch' })}>Rematch 🔁</button>
            </div>
          )}
        </div>
      )}
    </GameFrame>
  )
}

function Grid({ size, cells, render, onCell, disabled, active, small }: { size: number; cells: number[]; render: (i: number) => string; onCell?: (i: number) => void; disabled?: (i: number) => boolean; active?: (i: number) => boolean; small?: boolean }) {
  return (
    <div className={cn('mx-auto mt-3 grid gap-1.5', small ? 'max-w-[15rem]' : 'max-w-xs')} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
      {cells.map((i) => (
        <button key={i} type="button" aria-label={`Square ${i + 1}`} disabled={!onCell || disabled?.(i)} onClick={() => onCell?.(i)} className={cn('grid aspect-square place-items-center rounded-xl border border-white/10 bg-white/[0.06] transition', small ? 'text-lg' : 'text-2xl', onCell && !disabled?.(i) && 'hover:bg-white/15 active:scale-90', active?.(i) && 'border-pink-300/70 bg-pink-500/25')}>
          {render(i)}
        </button>
      ))}
    </div>
  )
}
