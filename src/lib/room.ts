import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { AVATARS, levelFor, type LevelInfo } from './level'
import { makeCode, normalizeCode, cleanName } from './codes'
import { GAMES } from '@/games/registry'
import { initGame, reduceGame, viewGame, type GameView, type StartOptions, type GameState } from '@/games/index'
import type { GameEvent, Player } from '@/games/types'
import { advanceStreak, buildSparkView, dayKey, daysBetween, isValidTz, parseAnswers, promptForDay, validateAnswer, SPARK_POINTS, type SparkView } from '@/games/spark'
import { BADGES, GIFT_TYPES } from '@/games/content/extras'

/* ------------------------------------------------------------------------------------------------
 * Everything the browser knows about a room comes from buildSnapshot(), tailored to ONE viewer.
 * Hidden information (a partner's unrevealed answers, unflipped memory cards…) is removed here,
 * on the server, so it can never be read from the network tab.
 * ---------------------------------------------------------------------------------------------- */

export type PlayerInfo = { id: string; name: string; avatar: string; points: number }
export type GiftInfo = { id: string; type: string; content: string | null; fromMe: boolean; senderName: string; at: number; seen: boolean }
export type CouponInfo = { id: string; title: string; emoji: string; note: string | null; fromMe: boolean; redeemed: boolean; at: number; redeemedAt: number | null }
export type BucketInfo = { id: string; text: string; emoji: string; done: boolean; mine: boolean }
export type BadgeInfo = { id: string; emoji: string; name: string; desc: string; progress: number; goal: number; unlocked: boolean }

export type Snapshot = {
  v: number
  roomId: string
  code: string
  me: PlayerInfo
  /** 0 = joined first (rose), 1 = joined second (violet) */
  myIndex: 0 | 1
  partner: PlayerInfo | null
  level: LevelInfo
  anniversary: string | null
  together: { days: number; future: boolean } | null
  activeGame: string | null
  game: GameView | null
  spark: SparkView | null
  gifts: GiftInfo[]
  incoming: GiftInfo | null
  coupons: CouponInfo[]
  bucket: BucketInfo[]
  badges: BadgeInfo[]
  stats: Record<string, number>
  /** how many times each game has been started across all rooms (used to order the menu) */
  plays: Record<string, number>
}

const roomInclude = {
  users: { orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }] },
  gifts: { orderBy: { createdAt: 'desc' }, take: 40 },
  coupons: { orderBy: { createdAt: 'desc' }, take: 50 },
  bucket: { orderBy: { createdAt: 'desc' }, take: 100 },
  sparks: { orderBy: { day: 'desc' }, take: 16 },
} satisfies Prisma.RoomInclude

type RoomFull = Prisma.RoomGetPayload<{ include: typeof roomInclude }>

export async function loadRoom(id: string): Promise<RoomFull | null> {
  return prisma.room.findUnique({ where: { id }, include: roomInclude })
}

/** Most actions only need the two players; skipping gifts/coupons/bucket/sparks saves several DB round trips per tap. */
async function loadRoomLite(id: string): Promise<RoomFull | null> {
  const room = await prisma.room.findUnique({ where: { id }, include: { users: roomInclude.users } })
  return room ? ({ ...room, gifts: [], coupons: [], bucket: [], sparks: [] } as RoomFull) : null
}

let playsCache: { at: number; data: Record<string, number> } | null = null
async function getPlays(): Promise<Record<string, number>> {
  if (playsCache && Date.now() - playsCache.at < 60_000) return playsCache.data
  try {
    const rows = await prisma.gamePlay.findMany()
    playsCache = { at: Date.now(), data: Object.fromEntries(rows.map((r) => [r.game, r.count])) }
  } catch {
    playsCache = { at: Date.now(), data: playsCache?.data ?? {} } // the menu order is cosmetic: never fail a request for it
  }
  return playsCache.data
}
const countPlay = (game: string) =>
  prisma.gamePlay.upsert({ where: { game }, create: { game, count: 1 }, update: { count: { increment: 1 } } }).then(() => { playsCache = null }).catch(() => {})

const NEEDS_CHILDREN = new Set(['spark.answer', 'coupon.redeem', 'bucket.add', 'bucket.toggle'])

const parseJson = <T>(s: string | null | undefined, fallback: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : fallback
  } catch {
    return fallback
  }
}

const toPlayers = (room: RoomFull): Player[] => room.users.map((u) => ({ id: u.id, name: u.name }))
const info = (u: RoomFull['users'][number]): PlayerInfo => ({ id: u.id, name: u.name, avatar: u.avatar, points: u.points })

export function buildSnapshot(room: RoomFull, viewerId: string, now = new Date(), plays: Record<string, number> = {}): Snapshot | null {
  const meRow = room.users.find((u) => u.id === viewerId)
  if (!meRow) return null
  const partnerRow = room.users.find((u) => u.id !== viewerId) ?? null
  const players = toPlayers(room)
  const today = dayKey(now, room.tz)
  const stats: Record<string, number> = { ...parseJson<Record<string, number>>(room.stats, {}), bestStreak: room.bestStreak }

  let game: GameView | null = null
  if (room.activeGame && room.gameState && players.length === 2) {
    const state = parseJson<GameState | null>(room.gameState, null)
    if (state) game = viewGame(state, viewerId, players)
  }

  let spark: SparkView | null = null
  if (players.length === 2) {
    const todayRow = room.sparks.find((s) => s.day === today)
    spark = buildSparkView({
      day: today,
      roomId: room.id,
      room: { streak: room.streak, best: room.bestStreak, lastDay: room.lastSparkDay, freezes: room.freezes },
      answers: parseAnswers(todayRow?.answers),
      viewer: viewerId,
      players,
      history: room.sparks.filter((s) => s.completedAt).map((s) => ({ day: s.day, promptId: s.promptId, answers: parseAnswers(s.answers) })),
    })
  }

  const giftInfo = (g: RoomFull['gifts'][number]): GiftInfo => ({
    id: g.id,
    type: g.type,
    content: g.content,
    fromMe: g.senderId === viewerId,
    senderName: room.users.find((u) => u.id === g.senderId)?.name ?? '',
    at: g.createdAt.getTime(),
    seen: g.seen,
  })
  const gifts = room.gifts.map(giftInfo)
  const incoming = gifts.find((g) => !g.fromMe && !g.seen) ?? null

  const totalPoints = room.users.reduce((n, u) => n + u.points, 0)
  let together: Snapshot['together'] = null
  if (room.anniversary) {
    const d = daysBetween(room.anniversary, today)
    together = { days: Math.abs(d), future: d < 0 }
  }

  return {
    v: room.version,
    roomId: room.id,
    code: room.code,
    me: info(meRow),
    myIndex: room.users[0]?.id === viewerId ? 0 : 1,
    partner: partnerRow ? info(partnerRow) : null,
    level: levelFor(totalPoints),
    anniversary: room.anniversary,
    together,
    activeGame: room.activeGame,
    game,
    spark,
    gifts,
    incoming,
    coupons: room.coupons.map((c) => ({
      id: c.id, title: c.title, emoji: c.emoji, note: c.note, fromMe: c.fromId === viewerId,
      redeemed: !!c.redeemedAt, at: c.createdAt.getTime(), redeemedAt: c.redeemedAt?.getTime() ?? null,
    })),
    bucket: room.bucket.map((b) => ({ id: b.id, text: b.text, emoji: b.emoji, done: b.done, mine: b.addedById === viewerId })),
    badges: BADGES.map((b) => {
      const progress = Math.min(stats[b.stat] ?? 0, b.goal)
      return { id: b.id, emoji: b.emoji, name: b.name, desc: b.desc, progress, goal: b.goal, unlocked: progress >= b.goal }
    }),
    stats,
    plays,
  }
}

export async function snapshotFor(roomId: string, userId: string): Promise<Snapshot | null> {
  const [room, plays] = await Promise.all([loadRoom(roomId), getPlays()])
  return room ? buildSnapshot(room, userId, new Date(), plays) : null
}

/* ------------------------------------------ rooms ------------------------------------------ */

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; status?: number }
const fail = (error: string, status = 400): { ok: false; error: string; status: number } => ({ ok: false, error, status })

function pickAvatar(wanted: unknown, taken: string[]): string {
  const av = typeof wanted === 'string' && AVATARS.includes(wanted) ? wanted : AVATARS[0]
  if (!taken.includes(av)) return av
  return AVATARS.find((a) => !taken.includes(a)) ?? av
}

export async function createRoom(input: { name: unknown; avatar: unknown; tz: unknown }): Promise<Result<{ roomId: string; code: string; userId: string }>> {
  const name = cleanName(input.name)
  if (!name) return fail('Please enter your name.')
  const tz = isValidTz(input.tz) ? input.tz : 'Asia/Kolkata'

  // Tidy up rooms nobody has touched for two months (keeps the database small; best-effort).
  prisma.room.deleteMany({ where: { lastActiveAt: { lt: new Date(Date.now() - 60 * 86_400_000) } } }).catch(() => {})

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeCode()
    try {
      const room = await prisma.room.create({
        data: { code, tz, users: { create: { name, avatar: pickAvatar(input.avatar, []) } } },
        include: { users: true },
      })
      return { ok: true, roomId: room.id, code: room.code, userId: room.users[0].id }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue // code collision, retry
      throw e
    }
  }
  return fail('Could not create a room. Please try again.', 500)
}

export async function joinRoom(input: { roomId?: unknown; code?: unknown; name: unknown; avatar: unknown }): Promise<Result<{ roomId: string; userId: string }>> {
  const name = cleanName(input.name)
  if (!name) return fail('Please enter your name.')
  let room: RoomFull | null = null
  if (typeof input.roomId === 'string' && input.roomId) room = await loadRoom(input.roomId)
  else {
    const code = normalizeCode(input.code)
    if (!code) return fail('That room code does not look right.')
    const found = await prisma.room.findUnique({ where: { code }, select: { id: true } })
    room = found ? await loadRoom(found.id) : null
  }
  if (!room) return fail('We could not find that room. Check the link or code.', 404)
  if (room.users.length >= 2) return fail('This room already has two people.', 409)

  const user = await prisma.user.create({ data: { roomId: room.id, name, avatar: pickAvatar(input.avatar, room.users.map((u) => u.avatar)) } })
  // Guard against two people joining at the very same moment.
  const count = await prisma.user.count({ where: { roomId: room.id } })
  if (count > 2) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
    return fail('This room already has two people.', 409)
  }
  await prisma.room.update({ where: { id: room.id }, data: { version: { increment: 1 }, lastActiveAt: new Date() } })
  return { ok: true, roomId: room.id, userId: user.id }
}

/* ------------------------------------------ actions ------------------------------------------ */

export type ActBody = { type: string; [k: string]: unknown }

const bump = { version: { increment: 1 }, lastActiveAt: new Date() }

function mergeStats(current: string, add: Record<string, number> | undefined): string {
  const stats = parseJson<Record<string, number>>(current, {})
  for (const [k, v] of Object.entries(add ?? {})) if (Number.isFinite(v)) stats[k] = (stats[k] ?? 0) + v
  return JSON.stringify(stats)
}

async function givePoints(tx: Prisma.TransactionClient, room: RoomFull, points: Record<string, number> | undefined) {
  for (const [uid, n] of Object.entries(points ?? {})) {
    if (!room.users.some((u) => u.id === uid) || !Number.isFinite(n) || n <= 0) continue
    await tx.user.update({ where: { id: uid }, data: { points: { increment: Math.round(n) } } })
  }
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function act(roomId: string, userId: string, body: ActBody): Promise<Result<{ snapshot: Snapshot; toast?: string }>> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const room = await (NEEDS_CHILDREN.has(body.type) ? loadRoom(roomId) : loadRoomLite(roomId))
    if (!room) return fail('Room not found.', 404)
    if (!room.users.some((u) => u.id === userId)) return fail('You are not in this room.', 403)
    const players = toPlayers(room)
    const partner = room.users.find((u) => u.id !== userId)
    const needPartner = () => (players.length < 2 ? fail('Wait for your partner to join first 💕') : null)

    let outcome: { toast?: string } | 'retry' | { error: string }

    switch (body.type) {
      case 'game.start': {
        const n = needPartner(); if (n) return n
        // Never replace a game in progress unless the player explicitly chose "Play again".
        if (room.activeGame && body.replace !== true) return fail('A game is already in progress. Finish or exit it first.', 409)
        const state = initGame(String(body.game), players, (body.options ?? {}) as StartOptions)
        if (!state) return fail('Unknown game.')
        outcome = await optimistic(room, { activeGame: String(body.game), gameState: JSON.stringify(state) })
        if (typeof outcome === 'object' && !('error' in outcome)) void countPlay(String(body.game))
        break
      }

      case 'game.stop': {
        outcome = await optimistic(room, { activeGame: null, gameState: null })
        break
      }

      case 'game.event': {
        const n = needPartner(); if (n) return n
        const state = parseJson<GameState | null>(room.gameState, null)
        if (!room.activeGame || !state) return fail('No game is running.')
        const event = body.event as GameEvent | undefined
        if (!event || typeof event.type !== 'string') return fail('Bad event.')
        const r = reduceGame(state, event, userId, players)
        if (r.error) return fail(r.error)
        outcome = await optimistic(room, { gameState: JSON.stringify(r.state), stats: mergeStats(room.stats, r.stats) }, r.points)
        break
      }

      case 'spark.answer': {
        const n = needPartner(); if (n) return n
        outcome = await answerSpark(room, userId, body.value)
        break
      }

      case 'gift.send': {
        if (!partner) return fail('Wait for your partner to join first 💕')
        const type = String(body.gift ?? '')
        const def = GIFT_TYPES.find((g) => g.id === type)
        if (!def) return fail('Unknown gift.')
        const content = def.id === 'NOTE' ? text(body.content, 200) : ''
        if (def.id === 'NOTE' && !content) return fail('Write a little note first 💌')
        const recent = await prisma.gift.count({ where: { senderId: userId, createdAt: { gt: new Date(Date.now() - 86_400_000) } } })
        outcome = await write(room, async (tx) => {
          await tx.gift.create({ data: { roomId, senderId: userId, receiverId: partner.id, type, content: content || null } })
          if (recent < 10) await tx.user.update({ where: { id: userId }, data: { points: { increment: 15 } } })
          await tx.room.update({ where: { id: roomId }, data: { stats: mergeStats(room.stats, { giftsSent: 1 }) } })
        })
        break
      }

      case 'gift.seen': {
        outcome = await write(room, async (tx) => {
          await tx.gift.updateMany({ where: { id: String(body.id), roomId, receiverId: userId }, data: { seen: true } })
        })
        break
      }

      case 'coupon.send': {
        if (!partner) return fail('Wait for your partner to join first 💕')
        const title = text(body.title, 80)
        if (!title) return fail('Give your coupon a title.')
        const emoji = text(body.emoji, 8) || '🎟️'
        const note = text(body.note, 160) || null
        outcome = await write(room, async (tx) => {
          await tx.coupon.create({ data: { roomId, fromId: userId, toId: partner.id, title, emoji, note } })
          await tx.user.update({ where: { id: userId }, data: { points: { increment: 10 } } })
        })
        break
      }

      case 'coupon.redeem': {
        const c = room.coupons.find((x) => x.id === String(body.id))
        if (!c || c.toId !== userId) return fail('That coupon is not yours to redeem.')
        if (c.redeemedAt) return fail('Already redeemed.')
        outcome = await write(room, async (tx) => {
          const upd = await tx.coupon.updateMany({ where: { id: c.id, redeemedAt: null }, data: { redeemedAt: new Date() } })
          if (upd.count === 0) return
          await tx.user.update({ where: { id: c.fromId }, data: { points: { increment: 15 } } })
          await tx.room.update({ where: { id: roomId }, data: { stats: mergeStats(room.stats, { couponsRedeemed: 1 }) } })
        })
        if (typeof outcome === 'object' && !('error' in outcome)) outcome = { toast: `Redeemed! ${partner ? partner.name : 'Your partner'} owes you: ${c.title} ${c.emoji}` }
        break
      }

      case 'bucket.add': {
        const t = text(body.text, 120)
        if (!t) return fail('Write an idea first.')
        const emoji = text(body.emoji, 8) || '✨'
        if (room.bucket.length >= 100) return fail('Your bucket list is full — finish some dates first!')
        outcome = await write(room, async (tx) => {
          await tx.bucketItem.create({ data: { roomId, text: t, emoji, addedById: userId } })
        })
        break
      }

      case 'bucket.toggle': {
        const item = room.bucket.find((b) => b.id === String(body.id))
        if (!item) return fail('Item not found.')
        outcome = await write(room, async (tx) => {
          const done = !item.done
          await tx.bucketItem.update({ where: { id: item.id }, data: { done, doneAt: done ? new Date() : null } })
          if (done) {
            for (const u of room.users) await tx.user.update({ where: { id: u.id }, data: { points: { increment: 20 } } })
            await tx.room.update({ where: { id: roomId }, data: { stats: mergeStats(room.stats, { bucketDone: 1 }) } })
          }
        })
        break
      }

      case 'bucket.remove': {
        outcome = await write(room, async (tx) => {
          await tx.bucketItem.deleteMany({ where: { id: String(body.id), roomId } })
        })
        break
      }

      case 'anniversary.set': {
        const raw = body.date
        if (raw !== null && !(typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw)))) return fail('Pick a valid date.')
        outcome = await write(room, async (tx) => {
          await tx.room.update({ where: { id: roomId }, data: { anniversary: raw as string | null } })
        })
        break
      }

      case 'profile.update': {
        const name = cleanName(body.name) ?? undefined
        const avatar = typeof body.avatar === 'string' && AVATARS.includes(body.avatar) && !(partner && partner.avatar === body.avatar) ? body.avatar : undefined
        outcome = await write(room, async (tx) => {
          await tx.user.update({ where: { id: userId }, data: { ...(name ? { name } : {}), ...(avatar ? { avatar } : {}) } })
        })
        break
      }

      default:
        return fail('Unknown action.')
    }

    if (outcome === 'retry') continue
    if ('error' in outcome) return fail(outcome.error)
    const snapshot = await snapshotFor(roomId, userId)
    if (!snapshot) return fail('Room not found.', 404)
    return { ok: true, snapshot, toast: outcome.toast }
  }
  return fail('Things are busy — please try again.', 409)
}

/** Runs writes and bumps the room version so both browsers pick the change up. */
async function write(room: RoomFull, fn: (tx: Prisma.TransactionClient) => Promise<void>): Promise<{ toast?: string } | { error: string }> {
  await prisma.$transaction(async (tx) => {
    await fn(tx)
    await tx.room.update({ where: { id: room.id }, data: { ...bump } })
  })
  return {}
}

/** Optimistic-concurrency write for game state: if the other player changed the room in the meantime, retry. */
async function optimistic(room: RoomFull, data: Prisma.RoomUpdateManyMutationInput, points?: Record<string, number>): Promise<{ toast?: string } | 'retry'> {
  const ok = await prisma.$transaction(async (tx) => {
    const upd = await tx.room.updateMany({ where: { id: room.id, version: room.version }, data: { ...data, ...bump } })
    if (upd.count === 0) return false
    await givePoints(tx, room, points)
    return true
  })
  return ok ? {} : 'retry'
}

async function answerSpark(room: RoomFull, userId: string, value: unknown): Promise<{ toast?: string } | 'retry' | { error: string }> {
  const players = toPlayers(room)
  const today = dayKey(new Date(), room.tz)
  const prompt = promptForDay(room.id, today)
  const valid = validateAnswer(prompt, value)
  if ('error' in valid) return { error: valid.error }

  const existing = room.sparks.find((s) => s.day === today)
  const answers = parseAnswers(existing?.answers)
  if (answers[userId] !== undefined) return { error: 'You already did today’s spark 💗' }
  answers[userId] = valid.value
  const completed = players.every((p) => answers[p.id] !== undefined)

  let toast: string | undefined
  try {
    await prisma.$transaction(async (tx) => {
      // optimistic lock on the room version keeps streak maths safe if both partners answer at the same moment
      const lock = await tx.room.updateMany({ where: { id: room.id, version: room.version }, data: { ...bump } })
      if (lock.count === 0) throw new Error('RETRY')

      if (existing) await tx.spark.update({ where: { id: existing.id }, data: { answers: JSON.stringify(answers), completedAt: completed ? new Date() : null } })
      else await tx.spark.create({ data: { roomId: room.id, day: today, promptId: prompt.id, answers: JSON.stringify(answers), completedAt: completed ? new Date() : null } })

      await tx.user.update({ where: { id: userId }, data: { points: { increment: 5 } } })

      if (completed) {
        const adv = advanceStreak({ streak: room.streak, best: room.bestStreak, lastDay: room.lastSparkDay, freezes: room.freezes }, today)
        for (const p of players) await tx.user.update({ where: { id: p.id }, data: { points: { increment: SPARK_POINTS + adv.bonus } } })
        await tx.room.update({
          where: { id: room.id },
          data: { streak: adv.streak, bestStreak: adv.best, lastSparkDay: adv.lastDay, freezes: adv.freezes, stats: mergeStats(room.stats, { sparksDone: 1 }) },
        })
        toast = `🔥 ${adv.streak}-day streak!`
        if (adv.usedFreeze) toast += ' A streak freeze saved you yesterday.'
        if (adv.earnedFreeze) toast += ' You earned a streak freeze ❄️'
        if (adv.milestone) toast += ` Milestone bonus: +${adv.bonus} 💕 each!`
      }
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'RETRY') return 'retry'
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return 'retry' // both created today's row at once
    throw e
  }
  return { toast }
}

export const gameIds = GAMES.map((g) => g.id)
