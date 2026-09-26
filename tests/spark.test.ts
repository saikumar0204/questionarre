import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MILESTONES, advanceStreak, buildSparkView, dayKey, daysBetween, isValidTz, parseAnswers, promptForDay, streakStatus, validateAnswer, type StreakState } from '../src/games/spark.ts'
import { SPARK_PROMPTS } from '../src/games/content/spark.ts'

const A = { id: 'ua', name: 'Priya' }
const B = { id: 'ub', name: 'Ravi' }
const fresh: StreakState = { streak: 0, best: 0, lastDay: null, freezes: 1 }

test('dayKey follows the room timezone (IST is ahead of UTC)', () => {
  const t = new Date('2026-09-26T20:30:00Z') // 02:00 next day in India, 13:30 in LA
  assert.equal(dayKey(t, 'Asia/Kolkata'), '2026-09-27')
  assert.equal(dayKey(t, 'UTC'), '2026-09-26')
  assert.equal(dayKey(t, 'America/Los_Angeles'), '2026-09-26')
  assert.equal(dayKey(t, 'Not/AZone'), '2026-09-27', 'invalid zone falls back to India')
  assert.equal(isValidTz('Asia/Kolkata'), true)
  assert.equal(isValidTz('Nope/Nope'), false)
  assert.equal(isValidTz(42), false)
})

test('daysBetween handles month, year and leap boundaries', () => {
  assert.equal(daysBetween('2026-09-26', '2026-09-27'), 1)
  assert.equal(daysBetween('2026-09-30', '2026-10-01'), 1)
  assert.equal(daysBetween('2026-12-31', '2027-01-01'), 1)
  assert.equal(daysBetween('2028-02-28', '2028-03-01'), 2)
  assert.equal(daysBetween('2026-09-26', '2026-09-26'), 0)
})

test('the prompt of the day is stable, and consecutive days never repeat', () => {
  assert.equal(promptForDay('room1', '2026-09-26').id, promptForDay('room1', '2026-09-26').id)
  const seen = new Set<string>()
  for (let i = 0; i < SPARK_PROMPTS.length; i++) {
    const d = new Date(Date.UTC(2026, 8, 26 + i))
    seen.add(promptForDay('room1', dayKey(d, 'UTC')).id)
  }
  assert.equal(seen.size, SPARK_PROMPTS.length, 'a full cycle uses every prompt exactly once')
  // different couples start at different points
  const starts = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((r) => promptForDay(r, '2026-09-26').id))
  assert.ok(starts.size > 1)
})

test('streak grows by one per consecutive day and is idempotent within a day', () => {
  let s = advanceStreak(fresh, '2026-09-26')
  assert.equal(s.streak, 1)
  assert.equal(s.lastDay, '2026-09-26')
  const same = advanceStreak(s, '2026-09-26')
  assert.equal(same.streak, 1)
  assert.equal(same.bonus, 0)
  s = advanceStreak(s, '2026-09-27')
  assert.equal(s.streak, 2)
  assert.equal(s.best, 2)
})

test('missing exactly one day spends a freeze; missing more (or no freeze) resets', () => {
  const s: StreakState = { streak: 5, best: 5, lastDay: '2026-09-24', freezes: 1 }
  const saved = advanceStreak(s, '2026-09-26') // skipped the 25th
  assert.equal(saved.streak, 6)
  assert.equal(saved.freezes, 0)
  assert.equal(saved.usedFreeze, true)

  const noFreeze = advanceStreak({ ...s, freezes: 0 }, '2026-09-26')
  assert.equal(noFreeze.streak, 1)
  assert.equal(noFreeze.best, 5, 'best streak is remembered')

  const long = advanceStreak(s, '2026-09-29')
  assert.equal(long.streak, 1)
  assert.equal(long.freezes, 1, 'freeze is kept when the streak was already lost')
})

test('milestones pay a bonus and every 7th day earns a freeze (capped at 2)', () => {
  const at6: StreakState = { streak: 6, best: 6, lastDay: '2026-09-26', freezes: 0 }
  const seven = advanceStreak(at6, '2026-09-27')
  assert.equal(seven.streak, 7)
  assert.equal(seven.milestone, 7)
  assert.equal(seven.bonus, MILESTONES[7])
  assert.equal(seven.earnedFreeze, true)
  assert.equal(seven.freezes, 1)

  const capped = advanceStreak({ ...at6, freezes: 2 }, '2026-09-27')
  assert.equal(capped.freezes, 2)
  assert.equal(capped.earnedFreeze, false)

  const day8 = advanceStreak(seven, '2026-09-28')
  assert.equal(day8.milestone, null)
  assert.equal(day8.bonus, 0)
})

test('streakStatus tells the couple what is happening today', () => {
  const s: StreakState = { streak: 9, best: 12, lastDay: '2026-09-25', freezes: 1 }
  assert.deepEqual(streakStatus(fresh, '2026-09-26'), { streak: 0, status: 'new' })
  assert.deepEqual(streakStatus({ ...s, lastDay: '2026-09-26' }, '2026-09-26'), { streak: 9, status: 'done' })
  assert.deepEqual(streakStatus(s, '2026-09-26'), { streak: 9, status: 'alive' })
  assert.deepEqual(streakStatus(s, '2026-09-27'), { streak: 9, status: 'freeze' })
  assert.deepEqual(streakStatus({ ...s, freezes: 0 }, '2026-09-27'), { streak: 0, status: 'broken' })
  assert.deepEqual(streakStatus(s, '2026-09-30'), { streak: 0, status: 'broken' })
})

test('answer validation per prompt kind', () => {
  const pick = SPARK_PROMPTS.find((p) => p.kind === 'pick')!
  const write = SPARK_PROMPTS.find((p) => p.kind === 'write')!
  const doIt = SPARK_PROMPTS.find((p) => p.kind === 'do')!
  assert.deepEqual(validateAnswer(pick, 1), { value: '1' })
  assert.ok('error' in validateAnswer(pick, 99))
  assert.ok('error' in validateAnswer(pick, 'abc'))
  assert.ok('error' in validateAnswer(write, '   '))
  const long = validateAnswer(write, 'y'.repeat(999))
  assert.ok('value' in long && long.value.length === 200)
  assert.deepEqual(validateAnswer(doIt, 'anything'), { value: 'done' })
  assert.deepEqual(parseAnswers('not json'), {})
  assert.deepEqual(parseAnswers('[1,2]'), {})
})

test("view: partner's answer stays hidden until both answered; names replace pronouns", () => {
  const players = [A, B]
  const day = '2026-09-26'
  const room: StreakState = { streak: 3, best: 3, lastDay: '2026-09-25', freezes: 1 }
  const prompt = promptForDay('room1', day)
  const val = prompt.kind === 'pick' ? '1' : prompt.kind === 'do' ? 'done' : 'I love your chai'

  let v = buildSparkView({ day, roomId: 'room1', room, answers: { [A.id]: val }, viewer: B.id, players, history: [] })
  assert.equal(v.me.answered, false)
  assert.equal(v.partner.answered, true)
  assert.equal(v.partner.answer, undefined, 'hidden before Ravi answers')
  assert.equal(v.completed, false)
  assert.equal(v.status, 'alive')
  assert.ok(!/\{\w+\}/.test(JSON.stringify(v)))

  v = buildSparkView({ day, roomId: 'room1', room, answers: { [A.id]: val, [B.id]: val }, viewer: B.id, players, history: [] })
  assert.equal(v.completed, true)
  assert.ok(v.partner.answer)
  assert.ok(v.me.answer)
})

test('history only lists sparks both partners completed', () => {
  const players = [A, B]
  const p = SPARK_PROMPTS.find((x) => x.kind === 'write')!
  const v = buildSparkView({
    day: '2026-09-26', roomId: 'r', room: fresh, answers: {}, viewer: A.id, players,
    history: [
      { day: '2026-09-25', promptId: p.id, answers: { [A.id]: 'mine', [B.id]: 'theirs' } },
      { day: '2026-09-24', promptId: p.id, answers: { [A.id]: 'only me' } },
      { day: '2026-09-23', promptId: 'gone.forever', answers: { [A.id]: 'x', [B.id]: 'y' } },
    ],
  })
  assert.equal(v.history.length, 1)
  assert.deepEqual([v.history[0].mine, v.history[0].theirs], ['mine', 'theirs'])
})
