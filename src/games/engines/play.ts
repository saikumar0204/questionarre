import type { Engine, GameEvent, Reduced } from '../types.ts'
import { fill, pick, playerVars, shuffle } from '../text.ts'
import { STORY_OPENERS } from '../content/newgames.ts'

/* =====================================================================================
 * Play games — competitive / creative games with hidden information.
 *   lie    Spot the Lie: two truths and a lie, guess your partner's lie
 *   hunt   Heart Hunt: hide three hearts, find your partner's first (hidden-board duel)
 *   story  Once Upon Us: co-write a story one sentence at a time
 * ===================================================================================== */

type Idx = 0 | 1

/* ---------------------------------- Spot the Lie ---------------------------------- */
export type LieState = {
  engine: 'lie'
  round: number
  phase: 'write' | 'guess' | 'reveal'
  entries: Record<string, { statements: string[]; lie: number }> // statements already shuffled; `lie` is the index of the lie
  guesses: Record<string, number>
  scores: Record<string, number>
}

export const LIE_POINTS = 20
const MIN_LEN = 4
const MAX_LEN = 120

export type LieView = {
  engine: 'lie'
  round: number
  phase: LieState['phase']
  me: { submitted: boolean; guessed: boolean }
  partner: { name: string; submitted: boolean; guessed: boolean }
  /** partner's statements to judge — the lie is NOT marked until reveal */
  toJudge?: { name: string; statements: string[] }
  reveal?: {
    rows: { name: string; statements: string[]; lie: number; guessedBy: string; guess: number; caught: boolean }[]
  }
  scores: { mine: number; theirs: number; myName: string; theirName: string }
}

export const lieEngine: Engine<LieState, LieView, { rand?: () => number }> = {
  init() {
    return { engine: 'lie', round: 1, phase: 'write', entries: {}, guesses: {}, scores: {} }
  },

  reduce(state, event: GameEvent, actor, players, rand = Math.random): Reduced<LieState> {
    const p = players.find((x) => x.id === actor)
    const other = players.find((x) => x.id !== actor)
    if (!p || !other) return { state, error: 'Not a player.' }

    if (event.type === 'submit') {
      if (state.phase !== 'write') return { state, error: 'Statements are already in.' }
      if (state.entries[actor]) return { state, error: 'Your statements are locked in.' }
      const raw = event.statements
      if (!Array.isArray(raw) || raw.length !== 3) return { state, error: 'Write three statements.' }
      const statements = raw.map((s) => String(s ?? '').trim().slice(0, MAX_LEN))
      if (statements.some((s) => s.length < MIN_LEN)) return { state, error: 'Each statement needs a few words.' }
      if (new Set(statements.map((s) => s.toLowerCase())).size !== 3) return { state, error: 'Make all three different.' }
      const lieIdx = Number(event.lie)
      if (!Number.isInteger(lieIdx) || lieIdx < 0 || lieIdx > 2) return { state, error: 'Mark which one is the lie.' }

      // shuffle so the lie is not always in the same slot
      const order = shuffle([0, 1, 2], rand)
      const entry = { statements: order.map((i) => statements[i]), lie: order.indexOf(lieIdx) }
      const entries = { ...state.entries, [actor]: entry }
      const both = players.every((x) => entries[x.id])
      return { state: { ...state, entries, phase: both ? 'guess' : 'write' }, points: { [actor]: 5 } }
    }

    if (event.type === 'guess') {
      if (state.phase !== 'guess') return { state, error: 'Not guessing yet.' }
      if (state.guesses[actor] !== undefined) return { state, error: 'Your guess is locked in.' }
      const g = Number(event.index)
      if (!Number.isInteger(g) || g < 0 || g > 2) return { state, error: 'Pick one of the three.' }
      const guesses = { ...state.guesses, [actor]: g }
      if (!players.every((x) => guesses[x.id] !== undefined)) return { state: { ...state, guesses } }

      const scores = { ...state.scores }
      const points: Record<string, number> = {}
      for (const guesser of players) {
        const writer = players.find((x) => x.id !== guesser.id)!
        const caught = guesses[guesser.id] === state.entries[writer.id].lie
        const winner = caught ? guesser : writer // spotting the lie scores for you; fooling your partner scores for you
        scores[winner.id] = (scores[winner.id] ?? 0) + 1
        points[winner.id] = (points[winner.id] ?? 0) + LIE_POINTS
      }
      return { state: { ...state, guesses, phase: 'reveal', scores }, points, stats: { lieRounds: 1, gamesFinished: 1 } }
    }

    if (event.type === 'again') {
      if (state.phase !== 'reveal') return { state, error: 'Finish this round first.' }
      return { state: { ...state, round: state.round + 1, phase: 'write', entries: {}, guesses: {} } }
    }
    return { state, error: 'Unknown action.' }
  },

  view(state, viewer, players): LieView {
    const me = players.find((x) => x.id === viewer)!
    const other = players.find((x) => x.id !== viewer)
    const scores = { mine: state.scores[viewer] ?? 0, theirs: other ? state.scores[other.id] ?? 0 : 0, myName: me.name, theirName: other?.name ?? 'Partner' }
    const base = {
      engine: 'lie' as const,
      round: state.round,
      phase: state.phase,
      me: { submitted: !!state.entries[viewer], guessed: state.guesses[viewer] !== undefined },
      partner: { name: other?.name ?? 'Partner', submitted: other ? !!state.entries[other.id] : false, guessed: other ? state.guesses[other.id] !== undefined : false },
      scores,
    }
    if (state.phase === 'guess' && other) {
      // only the statements, never which one is the lie
      return { ...base, toJudge: { name: other.name, statements: state.entries[other.id].statements } }
    }
    if (state.phase === 'reveal') {
      return {
        ...base,
        reveal: {
          rows: players.map((writer) => {
            const guesser = players.find((x) => x.id !== writer.id)!
            const e = state.entries[writer.id]
            return { name: writer.name, statements: e.statements, lie: e.lie, guessedBy: guesser.name, guess: state.guesses[guesser.id], caught: state.guesses[guesser.id] === e.lie }
          }),
        },
      }
    }
    return base
  },
}

/* ------------------------------------ Heart Hunt ------------------------------------ */
export const HUNT_SIZE = 5
export const HUNT_HEARTS = 3
const HUNT_CELLS = HUNT_SIZE * HUNT_SIZE

export type HuntState = {
  engine: 'hunt'
  phase: 'place' | 'play' | 'over'
  hearts: Record<string, number[]> // userId -> cells where THEY hid hearts
  shots: Record<string, number[]> // userId -> cells they fired at their partner's board
  turn: Idx
  winner: Idx | null
  wins: [number, number]
  round: number
  starter: Idx
}

export type HuntView = {
  engine: 'hunt'
  phase: HuntState['phase']
  size: number
  heartsToHide: number
  me: Idx
  names: [string, string]
  myTurn: boolean
  placed: { me: boolean; partner: boolean }
  /** my own hearts, and where my partner has fired at them */
  myBoard: { hearts: number[]; hitsAgainstMe: number[]; missesAgainstMe: number[] }
  /** where I have fired at my partner: hits are revealed, and their hearts are revealed only after the game ends */
  theirBoard: { hits: number[]; misses: number[]; hearts?: number[] }
  found: { me: number; partner: number }
  winner: Idx | null
  wins: [number, number]
  round: number
}

const idxOf = (players: { id: string }[], id: string): Idx | -1 => {
  const i = players.findIndex((p) => p.id === id)
  return i === 0 || i === 1 ? i : -1
}

export const huntEngine: Engine<HuntState, HuntView, Record<string, never>> = {
  init() {
    return { engine: 'hunt', phase: 'place', hearts: {}, shots: {}, turn: 0, winner: null, wins: [0, 0], round: 1, starter: 0 }
  },

  reduce(state, event: GameEvent, actor, players): Reduced<HuntState> {
    const me = idxOf(players, actor)
    if (me === -1) return { state, error: 'Not a player.' }
    const other = players[1 - me]

    if (event.type === 'place') {
      if (state.phase !== 'place') return { state, error: 'Hearts are already hidden.' }
      if (state.hearts[actor]) return { state, error: 'Your hearts are hidden. Waiting for your partner.' }
      const cells = event.cells
      if (!Array.isArray(cells) || cells.length !== HUNT_HEARTS || new Set(cells).size !== HUNT_HEARTS || !cells.every((c) => Number.isInteger(c) && c >= 0 && c < HUNT_CELLS)) {
        return { state, error: `Hide exactly ${HUNT_HEARTS} hearts on different squares.` }
      }
      const hearts = { ...state.hearts, [actor]: [...(cells as number[])].sort((a, b) => a - b) }
      const both = players.every((p) => hearts[p.id])
      return { state: { ...state, hearts, phase: both ? 'play' : 'place', turn: state.starter } }
    }

    if (event.type === 'shoot') {
      if (state.phase !== 'play') return { state, error: 'Not playing yet.' }
      if (state.turn !== me) return { state, error: `It is ${players[state.turn].name}'s turn.` }
      const cell = Number(event.cell)
      const mine = state.shots[actor] ?? []
      if (!Number.isInteger(cell) || cell < 0 || cell >= HUNT_CELLS) return { state, error: 'Pick a square.' }
      if (mine.includes(cell)) return { state, error: 'You already tried there.' }

      const shots = { ...state.shots, [actor]: [...mine, cell] }
      const hit = state.hearts[other.id].includes(cell)
      const foundAll = state.hearts[other.id].every((h) => shots[actor].includes(h))
      if (foundAll) {
        const wins: [number, number] = [...state.wins]
        wins[me]++
        return {
          state: { ...state, shots, phase: 'over', winner: me, wins },
          points: { [actor]: 30, [other.id]: 10 },
          stats: { boardWins: 1, gamesFinished: 1 },
        }
      }
      // a hit earns another shot
      return { state: { ...state, shots, turn: hit ? me : ((1 - me) as Idx) }, points: hit ? { [actor]: 3 } : undefined }
    }

    if (event.type === 'rematch') {
      if (state.phase !== 'over') return { state, error: 'Finish this round first.' }
      const starter = (1 - state.starter) as Idx
      return { state: { ...state, phase: 'place', hearts: {}, shots: {}, winner: null, round: state.round + 1, starter, turn: starter } }
    }
    return { state, error: 'Unknown action.' }
  },

  view(state, viewer, players): HuntView {
    const me = idxOf(players, viewer)
    const meI: Idx = me === -1 ? 0 : me
    const partner = players[1 - meI]
    const myHearts = state.hearts[viewer] ?? []
    const theirHearts = partner ? state.hearts[partner.id] ?? [] : []
    const myShots = state.shots[viewer] ?? []
    const theirShots = partner ? state.shots[partner.id] ?? [] : []
    const over = state.phase === 'over'
    return {
      engine: 'hunt',
      phase: state.phase,
      size: HUNT_SIZE,
      heartsToHide: HUNT_HEARTS,
      me: meI,
      names: [players[0].name, players[1]?.name ?? ''],
      myTurn: state.phase === 'play' && state.turn === meI,
      placed: { me: myHearts.length > 0, partner: theirHearts.length > 0 },
      myBoard: { hearts: myHearts, hitsAgainstMe: theirShots.filter((c) => myHearts.includes(c)), missesAgainstMe: theirShots.filter((c) => !myHearts.includes(c)) },
      theirBoard: {
        hits: myShots.filter((c) => theirHearts.includes(c)),
        misses: myShots.filter((c) => !theirHearts.includes(c)),
        hearts: over ? theirHearts : undefined, // never revealed before the game is over
      },
      found: { me: myShots.filter((c) => theirHearts.includes(c)).length, partner: theirShots.filter((c) => myHearts.includes(c)).length },
      winner: state.winner,
      wins: state.wins,
      round: state.round,
    }
  },
}

/* ---------------------------------- Once Upon Us ---------------------------------- */
export type StoryState = {
  engine: 'story'
  opener: string
  lines: { by: string; text: string }[]
  turn: Idx
  target: number // total lines to write
  finished: boolean
}

export const STORY_LINES = 10
export const STORY_MIN_TO_END = 6
const STORY_MAX = 160

export type StoryView = {
  engine: 'story'
  opener: string
  lines: { byName: string; byMe: boolean; text: string }[]
  myTurn: boolean
  turnName: string
  written: number
  target: number
  canEnd: boolean
  finished: boolean
}

export const storyEngine: Engine<StoryState, StoryView, { rand?: () => number }> = {
  init(players, options) {
    const [opener] = pick(STORY_OPENERS, 1, options.rand)
    return { engine: 'story', opener: fill(opener, playerVars(players)), lines: [], turn: 0, target: STORY_LINES, finished: false }
  },

  reduce(state, event: GameEvent, actor, players): Reduced<StoryState> {
    const me = idxOf(players, actor)
    if (me === -1) return { state, error: 'Not a player.' }
    if (state.finished) return { state, error: 'The story has ended.' }

    if (event.type === 'add') {
      if (state.turn !== me) return { state, error: `It is ${players[state.turn].name}'s turn to continue the story.` }
      const text = String(event.text ?? '').trim().slice(0, STORY_MAX)
      if (text.length < 3) return { state, error: 'Write a sentence to continue the story ✍️' }
      const lines = [...state.lines, { by: actor, text }]
      const done = lines.length >= state.target
      return {
        state: { ...state, lines, turn: (1 - me) as Idx, finished: done },
        points: done ? { [players[0].id]: 40, [players[1].id]: 40, [actor]: 50 } : { [actor]: 8 },
        stats: done ? { gamesFinished: 1, storiesWritten: 1 } : undefined,
      }
    }

    if (event.type === 'end') {
      if (state.lines.length < STORY_MIN_TO_END) return { state, error: `Write at least ${STORY_MIN_TO_END} lines first.` }
      return {
        state: { ...state, finished: true },
        points: { [players[0].id]: 30, [players[1].id]: 30 },
        stats: { gamesFinished: 1, storiesWritten: 1 },
      }
    }
    return { state, error: 'Unknown action.' }
  },

  view(state, viewer, players): StoryView {
    const me = idxOf(players, viewer)
    const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? ''
    return {
      engine: 'story',
      opener: state.opener,
      lines: state.lines.map((l) => ({ byName: nameOf(l.by), byMe: l.by === viewer, text: l.text })),
      myTurn: !state.finished && state.turn === me,
      turnName: players[state.turn].name,
      written: state.lines.length,
      target: state.target,
      canEnd: state.lines.length >= STORY_MIN_TO_END,
      finished: state.finished,
    }
  },
}
