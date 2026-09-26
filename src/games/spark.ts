import type { Player } from './types.ts'
import { fill, playerVars } from './text.ts'
import { SPARK_PROMPTS, sparkById, type SparkKind, type SparkPrompt } from './content/spark.ts'

/* ------------------------------------------------------------------------------------
 * Daily Spark: one tiny ritual a day, done by BOTH partners. The shared streak only grows
 * when both finish; answers stay hidden until then. Everything here is pure and tested.
 * ---------------------------------------------------------------------------------- */

export const MAX_FREEZES = 2
export const SPARK_POINTS = 15
export const MILESTONES: Record<number, number> = { 7: 50, 14: 75, 30: 150, 60: 250, 100: 500, 365: 1000 }
export const MAX_TEXT = 200

/** yyyy-mm-dd for `date` in the given IANA timezone (falls back to Asia/Kolkata if the zone is invalid). */
export function dayKey(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  }
}

export function isValidTz(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

const toUtc = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
export const daysBetween = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / 86_400_000)

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Consecutive days never repeat a prompt for a couple (until the whole bank is used); different couples are offset. */
export function promptForDay(roomId: string, day: string): SparkPrompt {
  const epochDay = Math.floor(toUtc(day) / 86_400_000)
  const offset = hash(roomId)
  return SPARK_PROMPTS[(offset + epochDay) % SPARK_PROMPTS.length]
}

/* ------------------------------------ streak maths ------------------------------------ */
export type StreakState = { streak: number; best: number; lastDay: string | null; freezes: number }
export type StreakAdvance = StreakState & { usedFreeze: boolean; earnedFreeze: boolean; milestone: number | null; bonus: number }

/** Called when both partners have completed today's spark. */
export function advanceStreak(s: StreakState, today: string): StreakAdvance {
  let { streak, freezes } = s
  let usedFreeze = false
  if (s.lastDay === today) {
    return { ...s, usedFreeze: false, earnedFreeze: false, milestone: null, bonus: 0 }
  }
  const gap = s.lastDay ? daysBetween(s.lastDay, today) : null
  if (gap === null) streak = 1
  else if (gap === 1) streak += 1
  else if (gap === 2 && freezes > 0) {
    freezes -= 1
    usedFreeze = true
    streak += 1
  } else streak = 1

  let earnedFreeze = false
  if (streak > 0 && streak % 7 === 0 && freezes < MAX_FREEZES) {
    freezes += 1
    earnedFreeze = true
  }
  const milestone = MILESTONES[streak] !== undefined ? streak : null
  return {
    streak,
    best: Math.max(s.best, streak),
    lastDay: today,
    freezes,
    usedFreeze,
    earnedFreeze,
    milestone,
    bonus: milestone ? MILESTONES[milestone] : 0,
  }
}

export type StreakStatus = 'new' | 'done' | 'alive' | 'freeze' | 'broken'
/** What to SHOW the couple today (without changing stored data). */
export function streakStatus(s: StreakState, today: string): { streak: number; status: StreakStatus } {
  if (!s.lastDay) return { streak: 0, status: 'new' }
  const gap = daysBetween(s.lastDay, today)
  if (gap <= 0) return { streak: s.streak, status: 'done' }
  if (gap === 1) return { streak: s.streak, status: 'alive' }
  if (gap === 2 && s.freezes > 0) return { streak: s.streak, status: 'freeze' }
  return { streak: 0, status: 'broken' }
}

/* ------------------------------------ answers ------------------------------------ */
export type SparkAnswers = Record<string, string>

export function parseAnswers(json: string | null | undefined): SparkAnswers {
  try {
    const v = JSON.parse(json || '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as SparkAnswers) : {}
  } catch {
    return {}
  }
}

export function validateAnswer(prompt: SparkPrompt, raw: unknown): { value: string } | { error: string } {
  if (prompt.kind === 'do') return { value: 'done' }
  if (prompt.kind === 'pick') {
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isInteger(n) || n < 0 || n >= (prompt.options?.length ?? 0)) return { error: 'Pick one of the options.' }
    return { value: String(n) }
  }
  const text = String(raw ?? '').trim().slice(0, MAX_TEXT)
  if (!text) return { error: 'Write a little something first 💗' }
  return { value: text }
}

export type SparkHistoryItem = { day: string; prompt: string; kind: SparkKind; mine: string; theirs: string }

export type SparkView = {
  day: string
  prompt: { id: string; kind: SparkKind; text: string; options?: string[] }
  streak: number
  best: number
  freezes: number
  status: StreakStatus
  /** today's spark completed by both */
  completed: boolean
  me: { answered: boolean; answer?: string }
  partner: { name: string; answered: boolean; answer?: string }
  history: SparkHistoryItem[]
  milestones: { days: number; bonus: number }[]
}

const label = (prompt: SparkPrompt, value: string | undefined, v: Record<string, string>) => {
  if (value === undefined) return undefined
  if (prompt.kind === 'pick') {
    const o = prompt.options?.[Number(value)]
    return o ? fill(o, v) : value
  }
  if (prompt.kind === 'do') return 'Done ✅'
  return value
}

export function buildSparkView(input: {
  day: string
  roomId: string
  room: StreakState
  answers: SparkAnswers
  viewer: string
  players: Player[]
  history: { day: string; promptId: string; answers: SparkAnswers }[]
}): SparkView {
  const { day, roomId, room, answers, viewer, players } = input
  const partner = players.find((p) => p.id !== viewer)
  const prompt = promptForDay(roomId, day)
  const v = { ...playerVars(players), me: players.find((p) => p.id === viewer)?.name ?? 'You', partner: partner?.name ?? 'your partner' }
  const mine = answers[viewer]
  const theirs = partner ? answers[partner.id] : undefined
  const completed = mine !== undefined && theirs !== undefined
  const { streak, status } = streakStatus(room, day)

  const history: SparkHistoryItem[] = input.history
    .filter((h) => Object.keys(h.answers).length === 2)
    .map((h) => {
      const p = sparkById(h.promptId)
      return p
        ? {
            day: h.day,
            prompt: fill(p.text, v),
            kind: p.kind,
            mine: label(p, h.answers[viewer], v) ?? '',
            theirs: label(p, partner ? h.answers[partner.id] : undefined, v) ?? '',
          }
        : null
    })
    .filter((x): x is SparkHistoryItem => x !== null)

  return {
    day,
    prompt: { id: prompt.id, kind: prompt.kind, text: fill(prompt.text, v), options: prompt.options?.map((o) => fill(o, v)) },
    streak,
    best: room.best,
    freezes: room.freezes,
    status,
    completed,
    me: { answered: mine !== undefined, answer: label(prompt, mine, v) },
    partner: {
      name: partner?.name ?? 'Partner',
      answered: theirs !== undefined,
      // hidden until BOTH have answered
      answer: completed ? label(prompt, theirs, v) : undefined,
    },
    history,
    milestones: Object.entries(MILESTONES).map(([d, bonus]) => ({ days: Number(d), bonus })),
  }
}
