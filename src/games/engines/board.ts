import type { Engine, GameEvent, Reduced } from '../types.ts'
import { shuffle } from '../text.ts'

/* =====================================================================================
 * Board games for two: Tic-Tac-Toe, Connect Four, Memory Match.
 * Players are referenced by index (0 = first to join, 1 = second). Series scores persist
 * across rematches until the couple goes back to the menu.
 * ===================================================================================== */

const WIN_POINTS = 25
const PLAY_POINTS = 10

type Idx = 0 | 1
const idxOf = (players: { id: string }[], id: string): Idx | -1 => {
  const i = players.findIndex((p) => p.id === id)
  return i === 0 || i === 1 ? i : -1
}

/* ------------------------------- Tic-Tac-Toe ------------------------------- */
export type TttState = {
  engine: 'ttt'
  board: (Idx | null)[]
  turn: Idx
  starter: Idx
  winner: Idx | 'draw' | null
  line: number[] | null
  wins: [number, number]
  draws: number
  round: number
}

const TTT_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]

export function tttWinner(board: (Idx | null)[]): { winner: Idx | null; line: number[] | null } {
  for (const l of TTT_LINES) {
    const [a, b, c] = l
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line: l }
  }
  return { winner: null, line: null }
}

export type BoardView<S> = S & { me: Idx; names: [string, string]; myTurn: boolean }

export const tttEngine: Engine<TttState, BoardView<TttState>, Record<string, never>> = {
  init() {
    return { engine: 'ttt', board: Array(9).fill(null), turn: 0, starter: 0, winner: null, line: null, wins: [0, 0], draws: 0, round: 1 }
  },

  reduce(state, event: GameEvent, actor, players): Reduced<TttState> {
    const me = idxOf(players, actor)
    if (me === -1) return { state, error: 'Not a player.' }

    if (event.type === 'rematch') {
      if (state.winner === null) return { state, error: 'Finish this round first.' }
      const starter = (1 - state.starter) as Idx
      return { state: { ...state, board: Array(9).fill(null), turn: starter, starter, winner: null, line: null, round: state.round + 1 } }
    }

    if (event.type !== 'move') return { state, error: 'Unknown action.' }
    if (state.winner !== null) return { state, error: 'Round is over — start a rematch!' }
    if (state.turn !== me) return { state, error: `It is ${players[state.turn].name}'s turn.` }
    const cell = Number(event.cell)
    if (!Number.isInteger(cell) || cell < 0 || cell > 8 || state.board[cell] !== null) return { state, error: 'Pick an empty square.' }

    const board = [...state.board]
    board[cell] = me
    const { winner, line } = tttWinner(board)
    if (winner !== null) {
      const wins: [number, number] = [...state.wins]
      wins[winner]++
      return {
        state: { ...state, board, winner, line, wins },
        points: { [players[winner].id]: WIN_POINTS, [players[1 - winner].id]: PLAY_POINTS },
        stats: { boardWins: 1, gamesFinished: 1 },
      }
    }
    if (board.every((c) => c !== null)) {
      return {
        state: { ...state, board, winner: 'draw', draws: state.draws + 1 },
        points: { [players[0].id]: PLAY_POINTS, [players[1].id]: PLAY_POINTS },
        stats: { gamesFinished: 1 },
      }
    }
    return { state: { ...state, board, turn: (1 - me) as Idx } }
  },

  view(state, viewer, players) {
    const me = idxOf(players, viewer)
    return { ...state, me: me === -1 ? 0 : me, names: [players[0].name, players[1]?.name ?? ''], myTurn: state.winner === null && state.turn === me }
  },
}

/* ------------------------------- Connect Four ------------------------------- */
export const C4_ROWS = 6
export const C4_COLS = 7

export type C4State = {
  engine: 'c4'
  board: (Idx | null)[] // row-major, row 0 is the top
  turn: Idx
  starter: Idx
  winner: Idx | 'draw' | null
  line: number[] | null
  wins: [number, number]
  draws: number
  round: number
  lastMove: number | null
}

export function c4Winner(board: (Idx | null)[]): { winner: Idx | null; line: number[] | null } {
  const at = (r: number, c: number) => (r >= 0 && r < C4_ROWS && c >= 0 && c < C4_COLS ? board[r * C4_COLS + c] : null)
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      const v = at(r, c)
      if (v === null) continue
      for (const [dr, dc] of dirs) {
        const line = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k])
        if (line.every(([rr, cc]) => at(rr, cc) === v)) return { winner: v, line: line.map(([rr, cc]) => rr * C4_COLS + cc) }
      }
    }
  }
  return { winner: null, line: null }
}

export const c4Engine: Engine<C4State, BoardView<C4State>, Record<string, never>> = {
  init() {
    return { engine: 'c4', board: Array(C4_ROWS * C4_COLS).fill(null), turn: 0, starter: 0, winner: null, line: null, wins: [0, 0], draws: 0, round: 1, lastMove: null }
  },

  reduce(state, event: GameEvent, actor, players): Reduced<C4State> {
    const me = idxOf(players, actor)
    if (me === -1) return { state, error: 'Not a player.' }

    if (event.type === 'rematch') {
      if (state.winner === null) return { state, error: 'Finish this round first.' }
      const starter = (1 - state.starter) as Idx
      return { state: { ...state, board: Array(C4_ROWS * C4_COLS).fill(null), turn: starter, starter, winner: null, line: null, lastMove: null, round: state.round + 1 } }
    }

    if (event.type !== 'drop') return { state, error: 'Unknown action.' }
    if (state.winner !== null) return { state, error: 'Round is over — start a rematch!' }
    if (state.turn !== me) return { state, error: `It is ${players[state.turn].name}'s turn.` }
    const col = Number(event.col)
    if (!Number.isInteger(col) || col < 0 || col >= C4_COLS) return { state, error: 'Pick a column.' }

    let row = -1
    for (let r = C4_ROWS - 1; r >= 0; r--) {
      if (state.board[r * C4_COLS + col] === null) { row = r; break }
    }
    if (row === -1) return { state, error: 'That column is full.' }

    const board = [...state.board]
    const cell = row * C4_COLS + col
    board[cell] = me
    const { winner, line } = c4Winner(board)
    if (winner !== null) {
      const wins: [number, number] = [...state.wins]
      wins[winner]++
      return {
        state: { ...state, board, winner, line, wins, lastMove: cell },
        points: { [players[winner].id]: WIN_POINTS, [players[1 - winner].id]: PLAY_POINTS },
        stats: { boardWins: 1, gamesFinished: 1 },
      }
    }
    if (board.every((c) => c !== null)) {
      return {
        state: { ...state, board, winner: 'draw', draws: state.draws + 1, lastMove: cell },
        points: { [players[0].id]: PLAY_POINTS, [players[1].id]: PLAY_POINTS },
        stats: { gamesFinished: 1 },
      }
    }
    return { state: { ...state, board, turn: (1 - me) as Idx, lastMove: cell } }
  },

  view(state, viewer, players) {
    const me = idxOf(players, viewer)
    return { ...state, me: me === -1 ? 0 : me, names: [players[0].name, players[1]?.name ?? ''], myTurn: state.winner === null && state.turn === me }
  },
}

/* ------------------------------- Memory Match ------------------------------- */
const MEMORY_SYMBOLS = ['🌹', '💍', '🍫', '🧸', '🎁', '🌙', '☕', '🎶', '🦋', '🍓', '🏝️', '📸']

export type MemoryState = {
  engine: 'memory'
  symbols: string[] // hidden from clients until revealed
  owner: (Idx | null)[] // who matched each card
  open: number[] // face-up, unmatched cards (max 2)
  turn: Idx
  scores: [number, number]
  over: boolean
  starter: Idx
  round: number
  wins: [number, number]
}

export type MemoryView = {
  engine: 'memory'
  cards: { symbol: string | null; owner: Idx | null; open: boolean }[]
  turn: Idx
  scores: [number, number]
  over: boolean
  wins: [number, number]
  round: number
  me: Idx
  names: [string, string]
  myTurn: boolean
  lastWasMismatch: boolean
}

const PAIRS = 8
const newDeck = (rand: () => number) => shuffle([...MEMORY_SYMBOLS.slice(0, PAIRS), ...MEMORY_SYMBOLS.slice(0, PAIRS)], rand)

export const memoryEngine: Engine<MemoryState, MemoryView, { rand?: () => number }> = {
  init(_players, options) {
    return {
      engine: 'memory', symbols: newDeck(options.rand ?? Math.random), owner: Array(PAIRS * 2).fill(null), open: [], turn: 0,
      scores: [0, 0], over: false, starter: 0, round: 1, wins: [0, 0],
    }
  },

  reduce(state, event: GameEvent, actor, players, rand = Math.random): Reduced<MemoryState> {
    const me = idxOf(players, actor)
    if (me === -1) return { state, error: 'Not a player.' }

    if (event.type === 'rematch') {
      if (!state.over) return { state, error: 'Finish this round first.' }
      const starter = (1 - state.starter) as Idx
      return { state: { ...state, symbols: newDeck(rand), owner: Array(PAIRS * 2).fill(null), open: [], turn: starter, starter, scores: [0, 0], over: false, round: state.round + 1 } }
    }

    if (event.type !== 'flip') return { state, error: 'Unknown action.' }
    if (state.over) return { state, error: 'Round is over — start a rematch!' }
    if (state.turn !== me) return { state, error: `It is ${players[state.turn].name}'s turn.` }
    const i = Number(event.i)
    if (!Number.isInteger(i) || i < 0 || i >= state.symbols.length) return { state, error: 'Pick a card.' }
    if (state.owner[i] !== null) return { state, error: 'That pair is already matched.' }

    // a previous mismatch stays visible until the next player makes their first flip
    let open = state.open.length === 2 ? [] : state.open
    if (open.includes(i)) return { state, error: 'Already flipped.' }
    open = [...open, i]
    if (open.length === 1) return { state: { ...state, open } }

    const [a, b] = open
    if (state.symbols[a] === state.symbols[b]) {
      const owner = [...state.owner]
      owner[a] = me
      owner[b] = me
      const scores: [number, number] = [...state.scores]
      scores[me]++
      const over = owner.every((o) => o !== null)
      if (!over) return { state: { ...state, owner, open: [], scores } }
      const wins: [number, number] = [...state.wins]
      const winner: Idx | null = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1
      if (winner !== null) wins[winner]++
      return {
        state: { ...state, owner, open: [], scores, over: true, wins },
        points: winner === null
          ? { [players[0].id]: PLAY_POINTS, [players[1].id]: PLAY_POINTS }
          : { [players[winner].id]: WIN_POINTS, [players[1 - winner].id]: PLAY_POINTS },
        stats: winner === null ? { gamesFinished: 1 } : { boardWins: 1, gamesFinished: 1 },
      }
    }
    return { state: { ...state, open, turn: (1 - me) as Idx } }
  },

  view(state, viewer, players): MemoryView {
    const me = idxOf(players, viewer)
    return {
      engine: 'memory',
      cards: state.symbols.map((symbol, i) => {
        const revealed = state.owner[i] !== null || state.open.includes(i)
        return { symbol: revealed ? symbol : null, owner: state.owner[i], open: state.open.includes(i) }
      }),
      turn: state.turn,
      scores: state.scores,
      over: state.over,
      wins: state.wins,
      round: state.round,
      me: me === -1 ? 0 : me,
      names: [players[0].name, players[1]?.name ?? ''],
      myTurn: !state.over && state.turn === me,
      lastWasMismatch: state.open.length === 2,
    }
  },
}
