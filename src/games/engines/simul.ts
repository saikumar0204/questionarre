import type { Engine, GameEvent, Player, Reduced } from '../types.ts'
import { fill, pick, playerVars, shuffle } from '../text.ts'
import { QUIZ } from '../content/quiz.ts'
import { LIKELY, NHIE, SENTENCE, WYR } from '../content/party.ts'
import { LOVELANG_QUESTIONS, LOVE_LANGS, type LoveLang } from '../content/lovelang.ts'

/**
 * "Answer separately, reveal together" engine. Powers six games:
 *   quiz (Same Wavelength), wyr, likely, nhie, sentence  -> reveal after every question
 *   lovelang                                             -> each answers all questions, reveal at the end
 * A partner's answer is never included in a view until both have answered.
 */
export type SimulGame = 'quiz' | 'wyr' | 'likely' | 'nhie' | 'sentence' | 'lovelang'

export type SimulState = {
  engine: 'simul'
  game: SimulGame
  category: string
  ids: string[]
  idx: number
  answers: Record<string, Record<string, string>>
  ready: string[]
  finished: boolean
}

export type SimulOptions = { game: SimulGame; category?: string; count?: number; rand?: () => number }

type Item = { id: string; cat: string; text: string; options?: string[]; tags?: LoveLang[] }

const DEFAULT_COUNT: Record<SimulGame, number> = { quiz: 8, wyr: 10, likely: 10, nhie: 10, sentence: 6, lovelang: 10 }
const ANSWER_POINTS = 5
const MATCH_POINTS = 10
const FINISH_POINTS = 20
export const MAX_TEXT = 200

const BANKS: Record<Exclude<SimulGame, 'lovelang'>, Item[]> = {
  quiz: QUIZ,
  wyr: WYR,
  likely: LIKELY,
  nhie: NHIE,
  sentence: SENTENCE,
}

const LOVELANG_ITEMS: Item[] = LOVELANG_QUESTIONS.map((q) => ({
  id: q.id,
  cat: 'ALL',
  text: q.text,
  options: q.options.map((o) => o[0]),
  tags: q.options.map((o) => o[1]),
}))

const bank = (game: SimulGame): Item[] => (game === 'lovelang' ? LOVELANG_ITEMS : BANKS[game])
const itemById = (game: SimulGame, id: string) => bank(game).find((i) => i.id === id)

/** quiz-like games compare answers; sentence is free text; lovelang reveals only at the end */
const isChoice = (g: SimulGame) => g !== 'sentence'
const revealPerQuestion = (g: SimulGame) => g !== 'lovelang'
const comparesMatches = (g: SimulGame) => g === 'quiz' || g === 'wyr' || g === 'likely' || g === 'nhie'

export type PromptView = { id: string; text: string; options?: string[]; freeText: boolean }
export type SummaryRow = { id: string; text: string; mine?: string; theirs?: string; match: boolean | null }
export type LoveLangResult = {
  mine: { top: LoveLang[]; scores: Record<LoveLang, number> }
  theirs: { top: LoveLang[]; scores: Record<LoveLang, number> }
  names: { mine: string; theirs: string }
  info: Record<LoveLang, { name: string; emoji: string; blurb: string; tip: string }>
}

export type SimulView = {
  engine: 'simul'
  game: SimulGame
  category: string
  total: number
  stage: 'answering' | 'waiting' | 'reveal' | 'summary'
  index: number
  prompt?: PromptView
  me: { answer?: string; ready: boolean }
  partner: { name: string; answered: boolean; ready: boolean; answer?: string }
  matchedSoFar: number
  match: boolean | null
  summary?: { rows: SummaryRow[]; matches: number; total: number; percent: number; love?: LoveLangResult }
}

function vars(players: Player[], viewer: string) {
  const me = players.find((p) => p.id === viewer)
  const partner = players.find((p) => p.id !== viewer)
  return { ...playerVars(players), me: me?.name ?? 'You', partner: partner?.name ?? 'your partner' }
}

function optionText(item: Item, value: string | undefined, v: Record<string, string>): string | undefined {
  if (value === undefined) return undefined
  if (!item.options) return value
  const idx = Number(value)
  return item.options[idx] !== undefined ? fill(item.options[idx], v) : undefined
}

function bothAnswered(s: SimulState, id: string, players: Player[]) {
  const a = s.answers[id] ?? {}
  return players.every((p) => a[p.id] !== undefined)
}

function currentId(s: SimulState) {
  return s.ids[s.idx]
}

function matched(s: SimulState, id: string, players: Player[]) {
  const a = s.answers[id] ?? {}
  const vals = players.map((p) => a[p.id])
  return vals.length === 2 && vals[0] !== undefined && vals[0] === vals[1]
}

function countMatches(s: SimulState, players: Player[]) {
  return s.ids.filter((id) => bothAnswered(s, id, players) && matched(s, id, players)).length
}

function loveScores(s: SimulState, userId: string): Record<LoveLang, number> {
  const scores: Record<LoveLang, number> = { WORDS: 0, TIME: 0, GIFTS: 0, SERVICE: 0, TOUCH: 0 }
  for (const id of s.ids) {
    const item = itemById('lovelang', id)
    const ans = s.answers[id]?.[userId]
    if (item?.tags && ans !== undefined && item.tags[Number(ans)]) scores[item.tags[Number(ans)]]++
  }
  return scores
}

function topLangs(scores: Record<LoveLang, number>): LoveLang[] {
  const max = Math.max(...Object.values(scores))
  return (Object.keys(scores) as LoveLang[]).filter((k) => scores[k] === max && max > 0)
}

function finishResult(s: SimulState, players: Player[], base: Reduced<SimulState>): Reduced<SimulState> {
  const points: Record<string, number> = { ...(base.points ?? {}) }
  for (const p of players) points[p.id] = (points[p.id] ?? 0) + FINISH_POINTS
  const stats: Record<string, number> = { ...(base.stats ?? {}), gamesFinished: 1 }
  if (s.game === 'quiz' && s.ids.length > 0 && countMatches(s, players) === s.ids.length) stats.perfectSync = 1
  return { ...base, state: { ...s, finished: true }, points, stats }
}

export const simulEngine: Engine<SimulState, SimulView, SimulOptions> = {
  init(_players, options) {
    const rand = options.rand ?? Math.random
    const game = options.game
    const all = bank(game)
    const category = options.category && options.category !== 'MIXED' && game !== 'lovelang' ? options.category : 'MIXED'
    const pool = category === 'MIXED' ? all : all.filter((i) => i.cat === category)
    const count = Math.min(options.count ?? DEFAULT_COUNT[game], pool.length)
    // lovelang always uses all 10 pairs (each language pair once), just in a random order
    const chosen = game === 'lovelang' ? shuffle(pool, rand) : pick(pool, count, rand)
    return { engine: 'simul', game, category, ids: chosen.map((i) => i.id), idx: 0, answers: {}, ready: [], finished: false }
  },

  reduce(state, event: GameEvent, actor, players): Reduced<SimulState> {
    if (state.finished) return { state, error: 'This game has finished.' }
    if (!players.some((p) => p.id === actor)) return { state, error: 'Not a player.' }

    if (event.type === 'answer') {
      const promptId = String(event.promptId ?? '')
      const raw = event.value
      if (!state.ids.includes(promptId)) return { state, error: 'Unknown question.' }
      if (revealPerQuestion(state.game) && promptId !== currentId(state)) return { state, error: 'That question is over.' }
      if (state.answers[promptId]?.[actor] !== undefined) return { state, error: 'Already answered.' }
      const item = itemById(state.game, promptId)
      if (!item) return { state, error: 'Unknown question.' }

      let value: string
      if (isChoice(state.game)) {
        const n = typeof raw === 'number' ? raw : Number(raw)
        if (!Number.isInteger(n) || n < 0 || n >= (item.options?.length ?? 0)) return { state, error: 'Invalid choice.' }
        value = String(n)
      } else {
        value = String(raw ?? '').trim().slice(0, MAX_TEXT)
        if (value.length < 1) return { state, error: 'Write something first 💗' }
      }

      const next: SimulState = {
        ...state,
        answers: { ...state.answers, [promptId]: { ...(state.answers[promptId] ?? {}), [actor]: value } },
      }
      const points: Record<string, number> = { [actor]: ANSWER_POINTS }
      const both = bothAnswered(next, promptId, players)

      if (both && comparesMatches(state.game) && matched(next, promptId, players)) {
        for (const p of players) points[p.id] = (points[p.id] ?? 0) + MATCH_POINTS
      }

      // lovelang has no per-question reveal: finish once both have answered every question
      if (state.game === 'lovelang') {
        const allDone = state.ids.every((id) => bothAnswered(next, id, players))
        if (allDone) return finishResult(next, players, { state: next, points })
      }
      return { state: next, points }
    }

    if (event.type === 'next') {
      if (!revealPerQuestion(state.game)) return { state, error: 'Nothing to continue.' }
      const id = currentId(state)
      if (!bothAnswered(state, id, players)) return { state, error: 'Wait for your partner to answer.' }
      const ready = state.ready.includes(actor) ? state.ready : [...state.ready, actor]
      if (ready.length < players.length) return { state: { ...state, ready } }
      const idx = state.idx + 1
      const next: SimulState = { ...state, idx, ready: [] }
      if (idx >= state.ids.length) return finishResult(next, players, { state: next })
      return { state: next }
    }

    return { state, error: 'Unknown action.' }
  },

  view(state, viewer, players): SimulView {
    const v = vars(players, viewer)
    const partner = players.find((p) => p.id !== viewer)
    const total = state.ids.length
    const base = {
      engine: 'simul' as const,
      game: state.game,
      category: state.category,
      total,
      partner: { name: partner?.name ?? 'Partner', answered: false, ready: false, answer: undefined as string | undefined },
      matchedSoFar: countMatches(state, players),
    }

    const mkPrompt = (id: string): PromptView | undefined => {
      const item = itemById(state.game, id)
      if (!item) return undefined
      return {
        id,
        text: fill(item.text, v),
        options: item.options?.map((o) => fill(o, v)),
        freeText: !isChoice(state.game),
      }
    }

    if (state.finished) {
      const rows: SummaryRow[] = state.ids.map((id) => {
        const item = itemById(state.game, id)
        const a = state.answers[id] ?? {}
        return {
          id,
          text: item ? fill(item.text, v) : id,
          mine: item ? optionText(item, a[viewer], v) : undefined,
          theirs: item && partner ? optionText(item, a[partner.id], v) : undefined,
          match: comparesMatches(state.game) ? matched(state, id, players) : null,
        }
      })
      const matches = rows.filter((r) => r.match).length
      const percent = total ? Math.round((matches / total) * 100) : 0
      const summary: NonNullable<SimulView['summary']> = { rows, matches, total, percent }
      if (state.game === 'lovelang' && partner) {
        const mineScores = loveScores(state, viewer)
        const theirScores = loveScores(state, partner.id)
        summary.love = {
          mine: { top: topLangs(mineScores), scores: mineScores },
          theirs: { top: topLangs(theirScores), scores: theirScores },
          names: { mine: v.me, theirs: v.partner },
          info: LOVE_LANGS,
        }
      }
      return { ...base, stage: 'summary', index: total, me: { ready: false }, match: null, summary }
    }

    // lovelang: each player moves through the questions independently
    if (state.game === 'lovelang') {
      const nextId = state.ids.find((id) => state.answers[id]?.[viewer] === undefined)
      const partnerDone = partner ? state.ids.every((id) => state.answers[id]?.[partner.id] !== undefined) : false
      const idx = nextId ? state.ids.indexOf(nextId) : total
      return {
        ...base,
        stage: nextId ? 'answering' : 'waiting',
        index: idx,
        prompt: nextId ? mkPrompt(nextId) : undefined,
        me: { ready: false },
        partner: { ...base.partner, answered: partnerDone, ready: false },
        match: null,
      }
    }

    const id = currentId(state)
    const mine = state.answers[id]?.[viewer]
    const theirs = partner ? state.answers[id]?.[partner.id] : undefined
    const both = mine !== undefined && theirs !== undefined
    const item = itemById(state.game, id)
    const stage: SimulView['stage'] = mine === undefined ? 'answering' : both ? 'reveal' : 'waiting'
    return {
      ...base,
      stage,
      index: state.idx,
      prompt: mkPrompt(id),
      me: { answer: mine !== undefined && item ? optionText(item, mine, v) : undefined, ready: state.ready.includes(viewer) },
      partner: {
        ...base.partner,
        answered: theirs !== undefined,
        ready: partner ? state.ready.includes(partner.id) : false,
        // partner's answer stays hidden until both have answered
        answer: both && item ? optionText(item, theirs, v) : undefined,
      },
      match: both && comparesMatches(state.game) ? matched(state, id, players) : null,
    }
  },
}
