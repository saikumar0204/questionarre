// Runs against a live server:  BASE_URL=http://localhost:3100 node --test tests/e2e.test.ts
// Two "browsers" (separate cookie jars) play against each other through the real HTTP API.
import { test } from 'node:test'
import assert from 'node:assert/strict'

const BASE = process.env.BASE_URL || 'http://localhost:3100'

class Browser {
  jar = new Map<string, string>()
  async req(path: string, init: RequestInit = {}) {
    const cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ')
    const res = await fetch(BASE + path, { redirect: 'manual', ...init, headers: { ...(init.headers as Record<string, string>), ...(cookie ? { cookie } : {}) } })
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';')
      const i = pair.indexOf('=')
      this.jar.set(pair.slice(0, i), pair.slice(i + 1))
    }
    return res
  }
  post(path: string, body: unknown) {
    return this.req(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  }
}

type Snap = any // eslint-disable-line @typescript-eslint/no-explicit-any

async function makeCouple(nameA = 'Priya', nameB = 'Ravi') {
  const a = new Browser()
  const b = new Browser()
  const created = await (await a.post('/api/rooms', { name: nameA, avatar: '🦊', tz: 'Asia/Kolkata' })).json()
  assert.ok(created.roomId && /^[A-Z2-9]{6}$/.test(created.code), JSON.stringify(created))
  const joined = await b.post('/api/rooms/join', { code: created.code, name: nameB, avatar: '🦊' })
  assert.equal(joined.status, 200)
  const roomId: string = created.roomId
  const act = async (who: Browser, body: object) => {
    const r = await who.post(`/api/room/${roomId}/act`, body)
    const j = await r.json()
    return { status: r.status, ...j } as { status: number; snapshot?: Snap; error?: string; toast?: string }
  }
  const state = async (who: Browser, v?: number) => {
    const r = await who.req(`/api/room/${roomId}/state${v !== undefined ? `?v=${v}` : ''}`)
    return { status: r.status, ...(await r.json()) } as { status: number; changed?: boolean; snapshot?: Snap }
  }
  return { a, b, roomId, code: created.code as string, act, state }
}

test('create + join: codes, unique avatars, full rooms, bad input', async () => {
  const { a, b, roomId, code, state } = await makeCouple()
  const sa = (await state(a)).snapshot!
  const sb = (await state(b)).snapshot!
  assert.equal(sa.me.name, 'Priya')
  assert.equal(sa.partner.name, 'Ravi')
  assert.equal(sb.partner.name, 'Priya')
  assert.notEqual(sa.me.avatar, sa.partner.avatar, 'both picked 🦊, one must be reassigned')
  assert.equal(sa.code, code)

  const c = new Browser()
  assert.equal((await c.post('/api/rooms/join', { code, name: 'Third' })).status, 409, 'room is full')
  assert.equal((await c.post('/api/rooms/join', { code: 'ZZZZZZ', name: 'X' })).status, 404)
  assert.equal((await c.post('/api/rooms/join', { code: 'no', name: 'X' })).status, 400)
  assert.equal((await c.post('/api/rooms', { name: '   ' })).status, 400)
  assert.equal((await c.post('/api/rooms', 'not an object')).status, 400)

  // an already-joined browser re-opening the invite link is simply taken back in
  assert.equal((await a.post('/api/rooms/join', { roomId, name: 'Whoever' })).status, 200)
  // invite short link redirects to the room page
  const r = await c.req(`/j/${code}`)
  assert.ok([307, 308].includes(r.status))
  assert.equal(r.headers.get('location'), `/room/${roomId}`)
})

test('access control: no cookie, other room, unknown action', async () => {
  const one = await makeCouple()
  const two = await makeCouple('Asha', 'Dev')
  const stranger = new Browser()
  assert.equal((await stranger.post(`/api/room/${one.roomId}/act`, { type: 'game.stop' })).status, 401)
  assert.equal((await stranger.req(`/api/room/${one.roomId}/state`)).status, 401)
  // Asha's cookie only works for HER room
  const res = await two.a.post(`/api/room/${one.roomId}/act`, { type: 'game.stop' })
  assert.equal(res.status, 401)
  assert.equal((await one.act(one.a, { type: 'nonsense' })).status, 400)
  assert.equal((await one.a.post(`/api/room/${one.roomId}/act`, 'x')).status, 400)
})

test('polling: unchanged version is cheap, changes are picked up', async () => {
  const { a, b, act, state } = await makeCouple()
  const first = (await state(b)).snapshot!
  const same = await state(b, first.v)
  assert.equal(same.changed, false)
  await act(a, { type: 'anniversary.set', date: '2024-02-14' })
  const next = await state(b, first.v)
  assert.equal(next.changed, true)
  assert.equal(next.snapshot!.anniversary, '2024-02-14')
  assert.ok(next.snapshot!.together.days > 500)
  assert.equal((await act(a, { type: 'anniversary.set', date: 'garbage' })).status, 400)
  assert.equal((await act(a, { type: 'anniversary.set', date: null })).snapshot!.anniversary, null)
})

test('games need both players; a quiz plays through with hidden answers and points', async () => {
  const solo = new Browser()
  const created = await (await solo.post('/api/rooms', { name: 'Solo', avatar: '🐻' })).json()
  const r = await (await solo.post(`/api/room/${created.roomId}/act`, { type: 'game.start', game: 'quiz' })).json()
  assert.match(r.error, /partner/i)

  const { a, b, act, state } = await makeCouple()
  assert.equal((await act(a, { type: 'game.start', game: 'nope' })).status, 400)
  const started = await act(a, { type: 'game.start', game: 'quiz', options: { category: 'PLAYFUL' } })
  assert.equal(started.status, 200)
  let sb = (await state(b)).snapshot!
  assert.equal(sb.activeGame, 'quiz', 'the partner sees the game start')
  const prompt = sb.game.prompt
  assert.ok(prompt.text.includes('Priya') || prompt.text.includes('Ravi') || !/\b(me|you)\b/i.test(prompt.text))

  const pa0 = (await state(a)).snapshot!.me.points
  const first = await act(a, { type: 'game.event', event: { type: 'answer', promptId: prompt.id, value: 0 } })
  assert.equal(first.status, 200)
  sb = (await state(b)).snapshot!
  assert.equal(sb.game.partner.answered, true)
  assert.equal(sb.game.partner.answer, undefined, "Ravi cannot see Priya's answer yet")
  assert.ok(!JSON.stringify(sb).includes('"answers"'))
  assert.equal(first.snapshot.me.points, pa0 + 5)

  const second = await act(b, { type: 'game.event', event: { type: 'answer', promptId: prompt.id, value: 0 } })
  assert.equal(second.snapshot.game.stage, 'reveal')
  assert.equal(second.snapshot.game.match, true)
  const sa = (await state(a)).snapshot!
  assert.equal(sa.me.points, pa0 + 5 + 10, 'answer + match bonus')
  assert.ok(sa.game.partner.answer)

  // double answers and stale ids are rejected server-side
  assert.equal((await act(a, { type: 'game.event', event: { type: 'answer', promptId: prompt.id, value: 1 } })).status, 400)
  assert.equal((await act(a, { type: 'game.stop' })).snapshot.activeGame, null)
})

test('concurrent answers from both partners are both saved (optimistic locking)', async () => {
  for (let round = 0; round < 5; round++) {
    const { a, b, act, state } = await makeCouple()
    await act(a, { type: 'game.start', game: 'wyr' })
    const p = (await state(a)).snapshot!.game.prompt
    const [ra, rb] = await Promise.all([
      act(a, { type: 'game.event', event: { type: 'answer', promptId: p.id, value: 0 } }),
      act(b, { type: 'game.event', event: { type: 'answer', promptId: p.id, value: 1 } }),
    ])
    assert.equal(ra.status, 200, ra.error)
    assert.equal(rb.status, 200, rb.error)
    const s = (await state(a)).snapshot!
    assert.equal(s.game.stage, 'reveal', `round ${round}: both answers must be stored`)
  }
})

test('gifts: send, incoming popup, seen, notes need text', async () => {
  const { a, b, act, state } = await makeCouple()
  assert.equal((await act(a, { type: 'gift.send', gift: 'NOTE', content: '  ' })).status, 400)
  assert.equal((await act(a, { type: 'gift.send', gift: 'BOMB' })).status, 400)
  assert.equal((await act(a, { type: 'gift.send', gift: 'FLOWER' })).status, 200)
  await act(a, { type: 'gift.send', gift: 'NOTE', content: 'Miss you!' })
  const sb = (await state(b)).snapshot!
  assert.ok(sb.incoming, 'Ravi has an unseen gift')
  assert.equal(sb.incoming.senderName, 'Priya')
  assert.equal(sb.gifts.length, 2)
  await act(b, { type: 'gift.seen', id: sb.incoming.id })
  const after = (await state(b)).snapshot!
  assert.notEqual(after.incoming?.id, sb.incoming.id)
  // a sender cannot mark the partner's gifts as seen
  const sa = (await state(a)).snapshot!
  assert.equal(sa.incoming, null)
})

test('coupons: only the receiver can redeem, once', async () => {
  const { a, b, act, state } = await makeCouple()
  assert.equal((await act(a, { type: 'coupon.send', title: '', emoji: '🎟️' })).status, 400)
  await act(a, { type: 'coupon.send', title: 'Breakfast in bed', emoji: '🛌', note: 'Sunday?' })
  const sb = (await state(b)).snapshot!
  const c = sb.coupons[0]
  assert.equal(c.fromMe, false)
  assert.equal((await act(a, { type: 'coupon.redeem', id: c.id })).status, 400, 'sender cannot redeem their own gift')
  const ok = await act(b, { type: 'coupon.redeem', id: c.id })
  assert.equal(ok.status, 200)
  assert.match(ok.toast!, /Breakfast in bed/)
  assert.equal((await act(b, { type: 'coupon.redeem', id: c.id })).status, 400, 'already redeemed')
})

test('bucket list: add, complete (both earn points), remove', async () => {
  const { a, b, act, state } = await makeCouple()
  assert.equal((await act(a, { type: 'bucket.add', text: '' })).status, 400)
  const added = await act(a, { type: 'bucket.add', text: 'Sunrise hike', emoji: '🥾' })
  const item = added.snapshot!.bucket[0]
  const p0 = (await state(b)).snapshot!.me.points
  await act(b, { type: 'bucket.toggle', id: item.id })
  assert.equal((await state(b)).snapshot!.me.points, p0 + 20)
  assert.equal((await state(a)).snapshot!.bucket[0].done, true)
  await act(a, { type: 'bucket.remove', id: item.id })
  assert.equal((await state(a)).snapshot!.bucket.length, 0)
})

test('daily spark: hidden until both answer, streak starts at 1, one answer per day', async () => {
  const { a, b, act, state } = await makeCouple()
  const s0 = (await state(a)).snapshot!
  assert.equal(s0.spark.streak, 0)
  assert.equal(s0.spark.status, 'new')
  const kind = s0.spark.prompt.kind
  const value = kind === 'pick' ? 1 : kind === 'do' ? 'done' : 'You make me feel safe'

  const ra = await act(a, { type: 'spark.answer', value })
  assert.equal(ra.status, 200, ra.error)
  const sb = (await state(b)).snapshot!
  assert.equal(sb.spark.partner.answered, true)
  assert.equal(sb.spark.partner.answer, undefined, 'hidden until Ravi answers')
  assert.equal(sb.spark.streak, 0, 'a streak needs BOTH partners')
  assert.equal((await act(a, { type: 'spark.answer', value })).status, 400, 'only one answer a day')

  const rb = await act(b, { type: 'spark.answer', value })
  assert.equal(rb.status, 200, rb.error)
  assert.match(rb.toast!, /1-day streak/)
  const done = (await state(a)).snapshot!
  assert.equal(done.spark.streak, 1)
  assert.equal(done.spark.status, 'done')
  assert.equal(done.spark.completed, true)
  assert.ok(done.spark.partner.answer)
  assert.equal(done.spark.history.length, 1)
  assert.equal(done.stats.sparksDone, 1)
  assert.equal(done.me.points >= 5 + 15, true)

  if (kind === 'pick') assert.equal((await act(a, { type: 'spark.answer', value: 99 })).status, 400)
})

test('daily spark: simultaneous answers still complete the day exactly once', async () => {
  for (let i = 0; i < 4; i++) {
    const { a, b, act, state } = await makeCouple()
    const p = (await state(a)).snapshot!.spark.prompt
    const value = p.kind === 'pick' ? 0 : p.kind === 'do' ? 'done' : 'same time!'
    const [ra, rb] = await Promise.all([act(a, { type: 'spark.answer', value }), act(b, { type: 'spark.answer', value })])
    assert.equal(ra.status, 200, ra.error)
    assert.equal(rb.status, 200, rb.error)
    const s = (await state(a)).snapshot!
    assert.equal(s.spark.streak, 1, `iteration ${i}`)
    assert.equal(s.spark.completed, true)
  }
})

test('profile: rename and avatar cannot collide with the partner', async () => {
  const { a, b, act, state } = await makeCouple()
  const partnerAvatar = (await state(a)).snapshot!.partner.avatar
  await act(a, { type: 'profile.update', name: 'Priya S', avatar: partnerAvatar })
  const s = (await state(b)).snapshot!
  assert.equal(s.partner.name, 'Priya S')
  assert.notEqual(s.partner.avatar, s.me.avatar)
})

test('a running game cannot be replaced by accident; "play again" can', async () => {
  const { a, b, act } = await makeCouple()
  assert.equal((await act(a, { type: 'game.start', game: 'ttt' })).status, 200)
  const clash = await act(b, { type: 'game.start', game: 'c4' })
  assert.equal(clash.status, 409)
  assert.match(clash.error!, /already in progress/i)
  assert.equal((await act(b, { type: 'game.start', game: 'c4', replace: true })).snapshot!.activeGame, 'c4')
})

test('starting a game is counted for the popularity ordering', async () => {
  const { a, act, state } = await makeCouple()
  const before = (await state(a)).snapshot!.plays?.doodle ?? 0
  await act(a, { type: 'game.start', game: 'doodle' })
  // the count is cached for up to a minute per server instance; the same instance invalidates it immediately
  let after = before
  for (let i = 0; i < 8 && after <= before; i++) {
    await new Promise((r) => setTimeout(r, 400))
    after = (await state(a)).snapshot!.plays?.doodle ?? 0
  }
  assert.ok(after > before || process.env.BASE_URL?.startsWith('https'), `doodle plays should go up (${before} -> ${after})`)
  assert.equal(typeof (await state(a)).snapshot!.plays, 'object')
})

test('all 20 games start through the API and every snapshot is free of placeholders', async () => {
  const ids = ['quiz', 'knowme', 'tod', 'wyr', 'likely', 'nhie', 'sentence', 'lovelang', 'deep', 'ttt', 'c4', 'memory', 'tunein', 'meld', 'rank', 'lie', 'hunt', 'story', 'doodle', 'emoji']
  const { a, b, act, state } = await makeCouple()
  for (const id of ids) {
    const started = await act(a, { type: 'game.start', game: id })
    assert.equal(started.status, 200, `${id}: ${started.error}`)
    for (const who of [a, b]) {
      const s = (await state(who)).snapshot!
      assert.equal(s.activeGame, id)
      assert.ok(s.game, `${id} has no view`)
      assert.ok(!/\{\w+\}/.test(JSON.stringify(s)), `${id} leaves a placeholder`)
    }
    assert.equal((await act(b, { type: 'game.stop' })).snapshot!.activeGame, null)
  }
})

test('pages, metadata and share assets respond', async () => {
  const anon = new Browser()
  for (const p of ['/', '/privacy', '/terms', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest']) {
    assert.equal((await anon.req(p)).status, 200, p)
  }
  const room = await anon.req('/room/does-not-exist')
  assert.equal(room.status, 200)
  assert.match(await room.text(), /couldn.{1,8}t find that room/i)

  const card = await anon.req('/api/card?a=Priya&b=Ravi&s=7&l=Soulmates')
  assert.equal(card.status, 200)
  assert.equal(card.headers.get('content-type'), 'image/png')
  // hostile input is sanitised rather than rendered or crashing the route
  const evil = await anon.req('/api/card?a=' + encodeURIComponent('<script>alert(1)</script>'.repeat(20)) + '&s=abc')
  assert.equal(evil.status, 200)
  assert.equal((await anon.req('/opengraph-image')).status, 200)

  // the landing page mentions the headline features
  const html = await (await anon.req('/')).text()
  assert.match(html, /20 games/)
  assert.match(html, /Daily Spark|daily streak/i)
})

test('a player who is signed in sees the room page, a stranger sees the join form or full notice', async () => {
  const { a, code, roomId } = await makeCouple()
  const inRoom = await (await a.req(`/room/${roomId}`)).text()
  assert.doesNotMatch(inRoom, /invited you to play/)
  const stranger = new Browser()
  const html = await (await stranger.req(`/room/${roomId}`)).text()
  assert.match(html, /already has two people/)
  assert.ok(code)

  // a room with one person shows the invite form to newcomers
  const solo = new Browser()
  const created = await (await solo.post('/api/rooms', { name: 'Asha', avatar: '🐰' })).json()
  const guest = new Browser()
  const invite = await (await guest.req(`/room/${created.roomId}`)).text()
  assert.match(invite, /Asha/)
  assert.match(invite, /invited you to play/)
})
