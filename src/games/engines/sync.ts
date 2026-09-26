import type { Engine, GameEvent, Reduced } from '../types.ts'
import { pick } from '../text.ts'
import { MELD_PAIRS, RANK_PROMPTS, SPECTRA, type Spectrum } from '../content/newgames.ts'

/* =====================================================================================
 * "Sync" games — cooperative games where you win TOGETHER by thinking alike.
 *   tunein  a dial game: one gives a clue, the other guesses where it sits on a spectrum
 *   meld    "Meet in the Middle": both say a word; keep bridging until you say the SAME word
 *   rank    both rank five things secretly; reveal how in-sync you are
 * ===================================================================================== */

/* ---------------------------------- Tune In ---------------------------------- */
export type TuneState = {
  engine: 'tunein'
  round: number
  totalRounds: number
  psychic: 0 | 1
  spectrumIds: string[]
  target: number // 0..100, only the psychic may see it until the reveal
  clue: string | null
  guess: number | null
  phase: 'clue' | 'guess' | 'reveal'
  history: { spectrum: string; clue: string; target: number; guess: number; points: number }[]
  score: number
  finished: boolean
}

export const TUNE_ROUNDS = 6
export const tuneScore = (target: number, guess: number) => {
  const d = Math.abs(target - guess)
  return d <= 4 ? 4 : d <= 10 ? 3 : d <= 18 ? 2 : 0
}
const spectrumById = (id: string) => SPECTRA.find((s) => s.id === id) as Spectrum

export type TuneView = {
  engine: 'tunein'
  round: number
  totalRounds: number
  phase: TuneState['phase']
  spectrum: { left: string; right: string }
  role: 'psychic' | 'guesser'
  psychicName: string
  target?: number // psychic during clue/guess, everybody at reveal
  clue: string | null
  guess: number | null
  lastPoints?: number
  score: number
  maxScore: number
  history: TuneState['history']
  finished: boolean
  rating?: string
}

const tuneRating = (score: number, max: number) => {
  const p = score / max
  return p >= 0.85 ? 'Telepathic! 🔮' : p >= 0.65 ? 'Beautifully in tune 💞' : p >= 0.4 ? 'Getting there 🎶' : 'Opposites attract 🙃'
}

export const tuneEngine: Engine<TuneState, TuneView, { rand?: () => number }> = {
  init(_players, options) {
    const rand = options.rand ?? Math.random
    const chosen = pick(SPECTRA, TUNE_ROUNDS, rand)
    return {
      engine: 'tunein', round: 1, totalRounds: TUNE_ROUNDS, psychic: 0, spectrumIds: chosen.map((s) => s.id),
      target: 8 + Math.floor(rand() * 85), clue: null, guess: null, phase: 'clue', history: [], score: 0, finished: false,
    }
  },

  reduce(state, event: GameEvent, actor, players, rand = Math.random): Reduced<TuneState> {
    const me = players.findIndex((p) => p.id === actor)
    if (me === -1) return { state, error: 'Not a player.' }
    if (state.finished) return { state, error: 'This game has finished.' }

    if (event.type === 'clue') {
      if (state.phase !== 'clue') return { state, error: 'The clue is already in.' }
      if (me !== state.psychic) return { state, error: `${players[state.psychic].name} gives the clue this round.` }
      const clue = String(event.text ?? '').trim().slice(0, 60)
      if (clue.length < 1) return { state, error: 'Give a clue first 💭' }
      return { state: { ...state, clue, phase: 'guess' } }
    }

    if (event.type === 'guess') {
      if (state.phase !== 'guess') return { state, error: 'Wait for the clue.' }
      if (me === state.psychic) return { state, error: 'Your partner is guessing this one — no peeking 😉' }
      const g = Number(event.value)
      if (!Number.isFinite(g) || g < 0 || g > 100) return { state, error: 'Move the dial.' }
      const guess = Math.round(g)
      const pts = tuneScore(state.target, guess)
      const entry = { spectrum: state.spectrumIds[state.round - 1], clue: state.clue ?? '', target: state.target, guess, points: pts }
      return {
        state: { ...state, guess, phase: 'reveal', score: state.score + pts, history: [...state.history, entry] },
        points: { [players[0].id]: pts * 5 + 3, [players[1].id]: pts * 5 + 3 },
      }
    }

    if (event.type === 'next') {
      if (state.phase !== 'reveal') return { state, error: 'Nothing to continue.' }
      if (state.round >= state.totalRounds) {
        const points = { [players[0].id]: 20, [players[1].id]: 20 }
        return { state: { ...state, finished: true }, points, stats: { gamesFinished: 1, tuneBest: state.score >= 18 ? 1 : 0 } }
      }
      return {
        state: {
          ...state, round: state.round + 1, psychic: (1 - state.psychic) as 0 | 1, target: 8 + Math.floor(rand() * 85),
          clue: null, guess: null, phase: 'clue',
        },
      }
    }
    return { state, error: 'Unknown action.' }
  },

  view(state, viewer, players): TuneView {
    const me = players.findIndex((p) => p.id === viewer)
    const role = me === state.psychic ? 'psychic' : 'guesser'
    const idx = Math.min(state.round, state.totalRounds) - 1
    const s = spectrumById(state.spectrumIds[idx])
    const last = state.history[state.history.length - 1]
    const revealed = state.phase === 'reveal' || state.finished
    return {
      engine: 'tunein',
      round: state.round,
      totalRounds: state.totalRounds,
      phase: state.phase,
      spectrum: { left: s.left, right: s.right },
      role,
      psychicName: players[state.psychic].name,
      // the target is only sent to the psychic, or to everyone once revealed
      target: revealed || role === 'psychic' ? state.target : undefined,
      clue: state.clue,
      guess: state.phase === 'reveal' ? state.guess : null,
      lastPoints: state.phase === 'reveal' ? last?.points : undefined,
      score: state.score,
      maxScore: state.totalRounds * 4,
      history: state.history,
      finished: state.finished,
      rating: state.finished ? tuneRating(state.score, state.totalRounds * 4) : undefined,
    }
  },
}

/* ------------------------------ Meet in the Middle ------------------------------ */
export type MeldState = {
  engine: 'meld'
  start: [string, string]
  rounds: { a?: string; b?: string }[] // index 0 = first player, b = second player
  maxRounds: number
  won: boolean
  finished: boolean
}

export const MELD_MAX_ROUNDS = 8
export const normalizeWord = (w: string) => {
  let s = w.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()
  if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1)
  return s
}

export type MeldView = {
  engine: 'meld'
  start: [string, string]
  round: number
  maxRounds: number
  /** the two words to bridge this round */
  bridge: [string, string]
  me: { word?: string }
  partner: { name: string; submitted: boolean }
  history: { a: string; b: string; names: [string, string]; matched: boolean }[]
  won: boolean
  finished: boolean
}

export const meldEngine: Engine<MeldState, MeldView, { rand?: () => number }> = {
  init(_players, options) {
    const [pair] = pick(MELD_PAIRS, 1, options.rand)
    const flip = (options.rand ?? Math.random)() < 0.5
    return { engine: 'meld', start: flip ? [pair[1], pair[0]] : pair, rounds: [{}], maxRounds: MELD_MAX_ROUNDS, won: false, finished: false }
  },

  reduce(state, event: GameEvent, actor, players): Reduced<MeldState> {
    const me = players.findIndex((p) => p.id === actor)
    if (me === -1) return { state, error: 'Not a player.' }
    if (state.finished) return { state, error: 'This game has finished.' }
    if (event.type !== 'word') return { state, error: 'Unknown action.' }

    const word = String(event.word ?? '').trim().slice(0, 30)
    if (!normalizeWord(word)) return { state, error: 'Type a word first 💭' }
    const cur = state.rounds[state.rounds.length - 1]
    const key = me === 0 ? 'a' : 'b'
    if (cur[key] !== undefined) return { state, error: 'Your word is locked in.' }

    const rounds = [...state.rounds.slice(0, -1), { ...cur, [key]: word }]
    const done = rounds[rounds.length - 1]
    if (done.a === undefined || done.b === undefined) return { state: { ...state, rounds } }

    const matched = normalizeWord(done.a) === normalizeWord(done.b)
    if (matched) {
      const n = rounds.length
      const pts = Math.max(20, 70 - (n - 1) * 8)
      return {
        state: { ...state, rounds, won: true, finished: true },
        points: { [players[0].id]: pts, [players[1].id]: pts },
        stats: { gamesFinished: 1, meldWins: 1, ...(n <= 3 ? { meldFast: 1 } : {}) },
      }
    }
    if (rounds.length >= state.maxRounds) {
      return { state: { ...state, rounds, finished: true }, points: { [players[0].id]: 10, [players[1].id]: 10 }, stats: { gamesFinished: 1 } }
    }
    return { state: { ...state, rounds: [...rounds, {}] } }
  },

  view(state, viewer, players): MeldView {
    const meIdx = players.findIndex((p) => p.id === viewer)
    const cur = state.rounds[state.rounds.length - 1]
    const completed = state.rounds.filter((r) => r.a !== undefined && r.b !== undefined)
    const last = completed[completed.length - 1]
    const myWord = meIdx === 0 ? cur.a : cur.b
    const theirWord = meIdx === 0 ? cur.b : cur.a
    const bridge: [string, string] = last ? [last.a as string, last.b as string] : state.start
    return {
      engine: 'meld',
      start: state.start,
      round: Math.min(state.rounds.length, state.maxRounds),
      maxRounds: state.maxRounds,
      bridge,
      me: { word: myWord },
      partner: { name: players[1 - meIdx]?.name ?? 'Partner', submitted: theirWord !== undefined },
      // a round is only shown in history once BOTH words are in
      history: completed.map((r) => ({
        a: r.a as string, b: r.b as string, names: [players[0].name, players[1].name] as [string, string],
        matched: normalizeWord(r.a as string) === normalizeWord(r.b as string),
      })),
      won: state.won,
      finished: state.finished,
    }
  },
}

/* --------------------------------- Rank & Reveal --------------------------------- */
export type RankState = {
  engine: 'rank'
  ids: string[]
  idx: number
  orders: Record<string, Record<string, number[]>> // promptId -> userId -> order (item indices, best first)
  ready: string[]
  sims: number[] // similarity % of each finished round
  finished: boolean
}

export const RANK_ROUNDS = 5
const N = 5
const MAX_DIST = 12 // sum of |position differences| between a ranking and its exact reverse (n = 5)

export function similarity(a: number[], b: number[]): number {
  const posB = new Map(b.map((item, i) => [item, i]))
  let dist = 0
  a.forEach((item, i) => (dist += Math.abs(i - (posB.get(item) ?? 0))))
  return Math.round((1 - dist / MAX_DIST) * 100)
}

const isPermutation = (v: unknown): v is number[] =>
  Array.isArray(v) && v.length === N && new Set(v).size === N && v.every((x) => Number.isInteger(x) && x >= 0 && x < N)

export type RankView = {
  engine: 'rank'
  index: number
  total: number
  stage: 'ranking' | 'waiting' | 'reveal' | 'summary'
  promptId: string
  title: string
  items: string[]
  me: { order?: number[]; ready: boolean }
  partner: { name: string; done: boolean; ready: boolean; order?: number[] }
  similarity?: number
  biggestGap?: { item: string; mine: number; theirs: number }
  average?: number
  finished: boolean
}

const rankPrompt = (id: string) => RANK_PROMPTS.find((p) => p.id === id)!

export const rankEngine: Engine<RankState, RankView, { rand?: () => number }> = {
  init(_players, options) {
    return { engine: 'rank', ids: pick(RANK_PROMPTS, RANK_ROUNDS, options.rand).map((p) => p.id), idx: 0, orders: {}, ready: [], sims: [], finished: false }
  },

  reduce(state, event: GameEvent, actor, players): Reduced<RankState> {
    if (!players.some((p) => p.id === actor)) return { state, error: 'Not a player.' }
    if (state.finished) return { state, error: 'This game has finished.' }
    const id = state.ids[state.idx]

    if (event.type === 'rank') {
      if (String(event.promptId ?? '') !== id) return { state, error: 'That round is over.' }
      if (!isPermutation(event.order)) return { state, error: 'Rank all five items.' }
      if (state.orders[id]?.[actor]) return { state, error: 'Your ranking is locked in.' }
      const orders = { ...state.orders, [id]: { ...(state.orders[id] ?? {}), [actor]: event.order } }
      const next = { ...state, orders }
      const both = players.every((p) => orders[id][p.id])
      if (!both) return { state: next, points: { [actor]: 5 } }
      const sim = similarity(orders[id][players[0].id], orders[id][players[1].id])
      const bonus = Math.round(sim * 0.15)
      return {
        state: { ...next, sims: [...state.sims, sim] },
        points: { [players[0].id]: 5 + bonus, [players[1].id]: 5 + bonus },
      }
    }

    if (event.type === 'next') {
      const both = players.every((p) => state.orders[id]?.[p.id])
      if (!both) return { state, error: 'Wait for your partner to rank.' }
      const ready = state.ready.includes(actor) ? state.ready : [...state.ready, actor]
      if (ready.length < 2) return { state: { ...state, ready } }
      const idx = state.idx + 1
      if (idx >= state.ids.length) {
        const avg = Math.round(state.sims.reduce((a, b) => a + b, 0) / Math.max(1, state.sims.length))
        return {
          state: { ...state, idx, ready: [], finished: true },
          points: { [players[0].id]: 20, [players[1].id]: 20 },
          stats: { gamesFinished: 1, ...(avg >= 80 ? { perfectSync: 1 } : {}) },
        }
      }
      return { state: { ...state, idx, ready: [] } }
    }
    return { state, error: 'Unknown action.' }
  },

  view(state, viewer, players): RankView {
    const partner = players.find((p) => p.id !== viewer)
    const total = state.ids.length
    const base = { engine: 'rank' as const, total, finished: state.finished }
    const average = state.sims.length ? Math.round(state.sims.reduce((a, b) => a + b, 0) / state.sims.length) : 0
    const id = state.ids[Math.min(state.idx, total - 1)]
    const p = rankPrompt(id)
    const mine = state.orders[id]?.[viewer]
    const theirs = partner ? state.orders[id]?.[partner.id] : undefined
    const both = !!mine && !!theirs

    if (state.finished) {
      return { ...base, index: total, stage: 'summary', promptId: '', title: '', items: [], me: { ready: false }, partner: { name: partner?.name ?? 'Partner', done: true, ready: false }, average }
    }

    let gap: RankView['biggestGap']
    if (both) {
      let worst = -1
      p.items.forEach((_, item) => {
        const d = Math.abs(mine!.indexOf(item) - theirs!.indexOf(item))
        if (d > worst) {
          worst = d
          gap = { item: p.items[item], mine: mine!.indexOf(item) + 1, theirs: theirs!.indexOf(item) + 1 }
        }
      })
    }
    return {
      ...base,
      index: state.idx,
      stage: both ? 'reveal' : mine ? 'waiting' : 'ranking',
      promptId: id,
      title: p.title,
      items: p.items,
      me: { order: mine, ready: state.ready.includes(viewer) },
      partner: {
        name: partner?.name ?? 'Partner',
        done: !!theirs,
        ready: partner ? state.ready.includes(partner.id) : false,
        order: both ? theirs : undefined, // hidden until both have ranked
      },
      similarity: both ? similarity(mine!, theirs!) : undefined,
      biggestGap: gap,
      average,
    }
  },
}

