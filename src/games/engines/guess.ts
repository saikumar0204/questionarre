import type { Engine, GameEvent, Player, Reduced } from '../types.ts'
import { fill, pick } from '../text.ts'
import { KNOWME } from '../content/knowme.ts'

/**
 * How Well Do You Know Me?
 * Per question: (1) both answer about THEMSELVES in secret, (2) both GUESS their partner's answer,
 * (3) reveal. Every question is worded with a name ("What is Priya's …?") so nothing is ambiguous.
 */
export type GuessState = {
  engine: 'guess'
  ids: string[]
  idx: number
  phase: 'self' | 'guess' | 'reveal'
  self: Record<string, Record<string, string>>
  guess: Record<string, Record<string, string>>
  ready: string[]
  scores: Record<string, number>
  finished: boolean
}

export type GuessOptions = { count?: number; rand?: () => number }

const GUESS_POINTS = 15
const FINISH_POINTS = 20
const ANSWER_POINTS = 3

const byId = (id: string) => KNOWME.find((q) => q.id === id)

type SummaryPerson = { name: string; question: string; truth: string; guess: string; correct: boolean }

export type GuessView = {
  engine: 'guess'
  total: number
  index: number
  stage: 'self-answering' | 'self-waiting' | 'guess-answering' | 'guess-waiting' | 'reveal' | 'summary'
  prompt?: { id: string; text: string; options: string[]; aboutName: string; aboutMe: boolean }
  partner: { name: string; done: boolean; ready: boolean }
  me: { ready: boolean }
  reveal?: {
    rows: { name: string; question: string; truth: string; guessedBy: string; guess: string; correct: boolean }[]
  }
  scores: { mine: number; theirs: number; myName: string; theirName: string }
  summary?: {
    rows: { a: SummaryPerson; b: SummaryPerson }[]
    winner: 'me' | 'partner' | 'tie'
  }
}

function both(map: Record<string, string> | undefined, players: Player[]) {
  return !!map && players.every((p) => map[p.id] !== undefined)
}

export const guessEngine: Engine<GuessState, GuessView, GuessOptions> = {
  init(_players, options) {
    const chosen = pick(KNOWME, options.count ?? 8, options.rand)
    return { engine: 'guess', ids: chosen.map((q) => q.id), idx: 0, phase: 'self', self: {}, guess: {}, ready: [], scores: {}, finished: false }
  },

  reduce(state, event: GameEvent, actor, players): Reduced<GuessState> {
    if (state.finished) return { state, error: 'This game has finished.' }
    if (!players.some((p) => p.id === actor)) return { state, error: 'Not a player.' }
    const id = state.ids[state.idx]
    const q = byId(id)
    if (!q?.options) return { state, error: 'Unknown question.' }

    const readChoice = () => {
      const n = typeof event.value === 'number' ? event.value : Number(event.value)
      return Number.isInteger(n) && n >= 0 && n < q.options!.length ? String(n) : null
    }

    if (event.type === 'self' || event.type === 'guess') {
      const phase = event.type === 'self' ? 'self' : 'guess'
      if (state.phase !== phase) return { state, error: 'Not the right step yet.' }
      if (String(event.promptId ?? '') !== id) return { state, error: 'That question is over.' }
      const bucket = phase === 'self' ? state.self : state.guess
      if (bucket[id]?.[actor] !== undefined) return { state, error: 'Already answered.' }
      const value = readChoice()
      if (value === null) return { state, error: 'Invalid choice.' }

      const updated = { ...bucket, [id]: { ...(bucket[id] ?? {}), [actor]: value } }
      let next: GuessState = phase === 'self' ? { ...state, self: updated } : { ...state, guess: updated }
      const points: Record<string, number> = { [actor]: ANSWER_POINTS }
      const stats: Record<string, number> = {}

      if (phase === 'self' && both(updated[id], players)) next = { ...next, phase: 'guess' }
      if (phase === 'guess' && both(updated[id], players)) {
        const scores = { ...next.scores }
        for (const p of players) {
          const other = players.find((o) => o.id !== p.id)!
          if (next.guess[id]?.[p.id] === next.self[id]?.[other.id]) {
            scores[p.id] = (scores[p.id] ?? 0) + 1
            points[p.id] = (points[p.id] ?? 0) + GUESS_POINTS
            stats.guessRight = (stats.guessRight ?? 0) + 1
          }
        }
        next = { ...next, phase: 'reveal', scores }
      }
      return { state: next, points, stats }
    }

    if (event.type === 'next') {
      if (state.phase !== 'reveal') return { state, error: 'Nothing to continue.' }
      const ready = state.ready.includes(actor) ? state.ready : [...state.ready, actor]
      if (ready.length < players.length) return { state: { ...state, ready } }
      const idx = state.idx + 1
      if (idx >= state.ids.length) {
        const points: Record<string, number> = {}
        for (const p of players) points[p.id] = FINISH_POINTS
        return { state: { ...state, idx, phase: 'self', ready: [], finished: true }, points, stats: { gamesFinished: 1 } }
      }
      return { state: { ...state, idx, phase: 'self', ready: [] } }
    }

    return { state, error: 'Unknown action.' }
  },

  view(state, viewer, players): GuessView {
    const me = players.find((p) => p.id === viewer)!
    const partner = players.find((p) => p.id !== viewer)
    const total = state.ids.length
    const scores = {
      mine: state.scores[viewer] ?? 0,
      theirs: partner ? state.scores[partner.id] ?? 0 : 0,
      myName: me.name,
      theirName: partner?.name ?? 'Partner',
    }
    const partnerInfo = { name: partner?.name ?? 'Partner', done: false, ready: false }

    const label = (qid: string, uid: string | undefined, bucket: Record<string, Record<string, string>>) => {
      const q = byId(qid)
      const v = uid ? bucket[qid]?.[uid] : undefined
      return q?.options && v !== undefined ? q.options[Number(v)] : ''
    }

    if (state.finished) {
      const rows = state.ids.map((qid) => {
        const q = byId(qid)!
        const rowFor = (p: Player) => {
          const other = players.find((o) => o.id !== p.id)
          return {
            name: p.name,
            question: fill(q.text, { who: p.name }),
            truth: label(qid, p.id, state.self),
            guess: label(qid, other?.id, state.guess),
            correct: state.guess[qid]?.[other?.id ?? ''] === state.self[qid]?.[p.id],
          }
        }
        return { a: rowFor(players[0]), b: rowFor(players[1]) }
      })
      let winner: 'me' | 'partner' | 'tie' = 'tie'
      if (scores.mine > scores.theirs) winner = 'me'
      else if (scores.theirs > scores.mine) winner = 'partner'
      // rows keep absolute player order; the client maps names
      return { engine: 'guess', total, index: total, stage: 'summary', partner: partnerInfo, me: { ready: false }, scores, summary: { rows, winner } }
    }

    const id = state.ids[state.idx]
    const q = byId(id)!
    const opts = q.options!

    if (state.phase === 'self') {
      const answered = state.self[id]?.[viewer] !== undefined
      partnerInfo.done = partner ? state.self[id]?.[partner.id] !== undefined : false
      return {
        engine: 'guess', total, index: state.idx, stage: answered ? 'self-waiting' : 'self-answering',
        prompt: { id, text: fill(q.text, { who: me.name }), options: opts, aboutName: me.name, aboutMe: true },
        partner: partnerInfo, me: { ready: false }, scores,
      }
    }

    if (state.phase === 'guess') {
      const guessed = state.guess[id]?.[viewer] !== undefined
      partnerInfo.done = partner ? state.guess[id]?.[partner.id] !== undefined : false
      return {
        engine: 'guess', total, index: state.idx, stage: guessed ? 'guess-waiting' : 'guess-answering',
        prompt: { id, text: fill(q.text, { who: partner?.name ?? 'them' }), options: opts, aboutName: partner?.name ?? 'Partner', aboutMe: false },
        partner: partnerInfo, me: { ready: false }, scores,
      }
    }

    // reveal
    const rows = players.map((p) => {
      const other = players.find((o) => o.id !== p.id)!
      return {
        name: p.name,
        question: fill(q.text, { who: p.name }),
        truth: label(id, p.id, state.self),
        guessedBy: other.name,
        guess: label(id, other.id, state.guess),
        correct: state.guess[id]?.[other.id] === state.self[id]?.[p.id],
      }
    })
    partnerInfo.ready = partner ? state.ready.includes(partner.id) : false
    return {
      engine: 'guess', total, index: state.idx, stage: 'reveal',
      prompt: { id, text: '', options: opts, aboutName: '', aboutMe: false },
      partner: partnerInfo, me: { ready: state.ready.includes(viewer) }, scores, reveal: { rows },
    }
  },
}
