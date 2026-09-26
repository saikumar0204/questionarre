import type { Engine, GameEvent, Reduced } from '../types.ts'
import { pick } from '../text.ts'
import { DOODLE_WORDS, EMOJI_PHRASES, type SecretWord } from '../content/newgames.ts'

/* =====================================================================================
 * Doodle Dash (draw) and Emoji Charades (emoji): one player sees a secret word and gives a clue
 * that is NOT text. The partner replays it and gets three guesses. Played together as a team.
 * The secret word is only ever sent to the clue-giver until the round is over.
 * ===================================================================================== */

export type CharadesMode = 'draw' | 'emoji'
/** c = colour index (0-7), w = brush index (0-2), p = points on a 0..1000 square */
export type Stroke = { c: number; w: number; p: [number, number][] }
export type Clue = Stroke[] | string

export const CHARADES_ROUNDS = 6
export const MAX_GUESSES = 3
const MAX_STROKES = 80
const MAX_POINTS_PER_STROKE = 400
const MAX_TOTAL_POINTS = 4000
const MAX_EMOJI = 8

export type CharadesState = {
  engine: 'charades'
  mode: CharadesMode
  round: number
  totalRounds: number
  giver: 0 | 1
  wordIds: string[]
  /** words swapped in with "another word" this game, keyed by round */
  rerolls: Record<number, string>
  rerollUsed: boolean
  phase: 'clue' | 'guess' | 'reveal'
  clue: Clue | null
  guesses: string[]
  solved: boolean
  history: { word: string; solved: boolean; guessesUsed: number }[]
  score: number
  finished: boolean
}

const bank = (mode: CharadesMode) => (mode === 'draw' ? DOODLE_WORDS : EMOJI_PHRASES)

export function validateStrokes(v: unknown): Stroke[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_STROKES) return null
  let total = 0
  const out: Stroke[] = []
  for (const s of v) {
    if (!s || typeof s !== 'object') return null
    const { c, w, p } = s as { c: unknown; w: unknown; p: unknown }
    if (!Number.isInteger(c) || (c as number) < 0 || (c as number) > 7) return null
    if (!Number.isInteger(w) || (w as number) < 0 || (w as number) > 2) return null
    if (!Array.isArray(p) || p.length === 0 || p.length > MAX_POINTS_PER_STROKE) return null
    total += p.length
    if (total > MAX_TOTAL_POINTS) return null
    const pts: [number, number][] = []
    for (const pt of p) {
      if (!Array.isArray(pt) || pt.length !== 2) return null
      const [x, y] = pt
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1000 || y < 0 || y > 1000) return null
      pts.push([Math.round(x), Math.round(y)])
    }
    out.push({ c: c as number, w: w as number, p: pts })
  }
  return out
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const EMOJI_RE = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F1E6}-\u{1F1FF}]{2})/u

/** Emoji clue: emoji only (no letters or digits, so nobody can just type the answer), at most eight. */
export function validateEmoji(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.replace(/\s+/g, '')
  if (!s || s.length > 80 || /[A-Za-z0-9]/.test(s)) return null
  const parts = [...segmenter.segment(s)].map((x) => x.segment)
  if (parts.length === 0 || parts.length > MAX_EMOJI) return null
  if (!parts.every((g) => EMOJI_RE.test(g))) return null
  return parts.join('')
}

export const normalizeGuess = (s: string) => {
  let t = s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  t = t.replace(/^(a|an|the) /, '')
  return t
}
const squash = (s: string) => {
  let t = normalizeGuess(s).replace(/ /g, '')
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) t = t.slice(0, -1)
  return t
}
function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}
/** Case, spacing and plural insensitive, and forgives one typo in longer words. */
export function isCorrectGuess(guess: string, word: string): boolean {
  const g = squash(guess)
  const w = squash(word)
  if (!g) return false
  if (g === w) return true
  return w.length >= 6 && levenshtein(g, w) <= 1
}

const wordFor = (s: CharadesState): SecretWord => {
  const id = s.rerolls[s.round] ?? s.wordIds[s.round - 1]
  return bank(s.mode).find((w) => w.id === id) as SecretWord
}

export type CharadesView = {
  engine: 'charades'
  mode: CharadesMode
  round: number
  totalRounds: number
  phase: CharadesState['phase']
  role: 'giver' | 'guesser'
  giverName: string
  category: string
  /** letters per word, e.g. [3, 5] — shown to the guesser as blanks */
  pattern: number[]
  /** the secret word: only for the clue-giver, or for everyone once the round is over */
  word?: string
  clue: Clue | null
  guesses: string[]
  guessesLeft: number
  solved: boolean
  rerollAvailable: boolean
  score: number
  maxScore: number
  history: CharadesState['history']
  finished: boolean
}

export const charadesEngine: Engine<CharadesState, CharadesView, { mode: CharadesMode; rand?: () => number }> = {
  init(_players, options) {
    const chosen = pick(bank(options.mode), CHARADES_ROUNDS, options.rand)
    return {
      engine: 'charades', mode: options.mode, round: 1, totalRounds: CHARADES_ROUNDS, giver: 0, wordIds: chosen.map((w) => w.id),
      rerolls: {}, rerollUsed: false, phase: 'clue', clue: null, guesses: [], solved: false, history: [], score: 0, finished: false,
    }
  },

  reduce(state, event: GameEvent, actor, players, rand = Math.random): Reduced<CharadesState> {
    const me = players.findIndex((p) => p.id === actor)
    if (me === -1) return { state, error: 'Not a player.' }
    if (state.finished) return { state, error: 'This game has finished.' }
    const word = wordFor(state)

    if (event.type === 'clue') {
      if (state.phase !== 'clue') return { state, error: 'The clue is already in.' }
      if (me !== state.giver) return { state, error: `${players[state.giver].name} gives the clue this round.` }
      const clue = state.mode === 'draw' ? validateStrokes(event.clue) : validateEmoji(event.clue)
      if (!clue) return { state, error: state.mode === 'draw' ? 'Draw something first ✏️' : 'Pick 1–8 emojis (no letters or numbers).' }
      return { state: { ...state, clue, phase: 'guess' } }
    }

    if (event.type === 'reroll') {
      if (state.phase !== 'clue' || me !== state.giver) return { state, error: 'Not possible right now.' }
      if (state.rerollUsed) return { state, error: 'One word swap per round.' }
      const used = new Set([...state.wordIds, ...Object.values(state.rerolls)])
      const fresh = bank(state.mode).filter((w) => !used.has(w.id))
      if (fresh.length === 0) return { state, error: 'No more words to swap.' }
      const next = fresh[Math.floor(rand() * fresh.length)]
      return { state: { ...state, rerolls: { ...state.rerolls, [state.round]: next.id }, rerollUsed: true } }
    }

    if (event.type === 'guess') {
      if (state.phase !== 'guess') return { state, error: 'Wait for the clue.' }
      if (me === state.giver) return { state, error: 'Your partner is guessing — no hints! 🤐' }
      const guess = String(event.text ?? '').trim().slice(0, 40)
      if (!guess) return { state, error: 'Type a guess first.' }
      if (isCorrectGuess(guess, word.word)) {
        const used = state.guesses.length + 1
        const pts = MAX_GUESSES + 1 - used // 3, 2, 1
        return {
          state: { ...state, phase: 'reveal', solved: true, guesses: [...state.guesses, guess], score: state.score + pts, history: [...state.history, { word: word.word, solved: true, guessesUsed: used }] },
          points: { [players[0].id]: pts * 10 + 5, [players[1].id]: pts * 10 + 5 },
          stats: { charadesSolved: 1 },
        }
      }
      const guesses = [...state.guesses, guess]
      if (guesses.length >= MAX_GUESSES) {
        return { state: { ...state, phase: 'reveal', solved: false, guesses, history: [...state.history, { word: word.word, solved: false, guessesUsed: guesses.length }] }, points: { [players[0].id]: 3, [players[1].id]: 3 } }
      }
      return { state: { ...state, guesses } }
    }

    if (event.type === 'next') {
      if (state.phase !== 'reveal') return { state, error: 'Nothing to continue.' }
      if (state.round >= state.totalRounds) {
        return { state: { ...state, finished: true }, points: { [players[0].id]: 20, [players[1].id]: 20 }, stats: { gamesFinished: 1 } }
      }
      return { state: { ...state, round: state.round + 1, giver: (1 - state.giver) as 0 | 1, phase: 'clue', clue: null, guesses: [], solved: false, rerollUsed: false } }
    }
    return { state, error: 'Unknown action.' }
  },

  view(state, viewer, players): CharadesView {
    const me = players.findIndex((p) => p.id === viewer)
    const role = me === state.giver ? 'giver' : 'guesser'
    const w = wordFor(state)
    const over = state.phase === 'reveal' || state.finished
    return {
      engine: 'charades',
      mode: state.mode,
      round: state.round,
      totalRounds: state.totalRounds,
      phase: state.phase,
      role,
      giverName: players[state.giver].name,
      category: w.cat,
      pattern: w.word.split(' ').map((x) => x.length),
      word: over || role === 'giver' ? w.word : undefined,
      // the clue only exists once the giver has sent it; guessers never see it earlier
      clue: state.clue,
      guesses: state.guesses,
      guessesLeft: MAX_GUESSES - state.guesses.length,
      solved: state.solved,
      rerollAvailable: role === 'giver' && state.phase === 'clue' && !state.rerollUsed,
      score: state.score,
      maxScore: state.totalRounds * MAX_GUESSES,
      history: state.history,
      finished: state.finished,
    }
  },
}
