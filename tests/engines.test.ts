import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initGame, reduceGame, viewGame, type GameState } from '../src/games/index.ts'
import type { GameEvent, Player } from '../src/games/types.ts'
import type { SimulView, SimulState } from '../src/games/engines/simul.ts'
import type { GuessView } from '../src/games/engines/guess.ts'
import type { TodView, TodState } from '../src/games/engines/tod.ts'
import type { CardsView } from '../src/games/engines/cards.ts'
import { c4Winner, tttWinner, type C4State, type MemoryState, type MemoryView, type TttState } from '../src/games/engines/board.ts'
import { DECKS } from '../src/games/content/deep.ts'

const A: Player = { id: 'ua', name: 'Priya' }
const B: Player = { id: 'ub', name: 'Ravi' }
const players = [A, B]

// deterministic pseudo-random so tests never flake
function seeded(seed = 7) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function act(state: GameState, actor: Player, event: GameEvent, rand = seeded(3)) {
  const r = reduceGame(state, event, actor.id, players, rand)
  return r
}
function ok(state: GameState, actor: Player, event: GameEvent, rand?: () => number) {
  const r = act(state, actor, event, rand)
  assert.equal(r.error, undefined, `unexpected error: ${r.error}`)
  return r
}
const start = (id: string, options = {}) => {
  const s = initGame(id, players, options, seeded(11))
  assert.ok(s, `could not start ${id}`)
  return s!
}

/* ---------------------------------- Same Wavelength ---------------------------------- */
test('quiz: partner answer stays hidden until both have answered, names replace me/you', () => {
  let s = start('quiz', { category: 'PLAYFUL' })
  const v0 = viewGame(s, A.id, players) as SimulView
  assert.equal(v0.stage, 'answering')
  assert.ok(!/\{\w+\}/.test(v0.prompt!.text), 'placeholders must be filled')
  assert.ok(v0.prompt!.options!.every((o) => !/\{\w+\}/.test(o)))
  const id = v0.prompt!.id

  s = ok(s, A, { type: 'answer', promptId: id, value: 0 }).state
  const vA = viewGame(s, A.id, players) as SimulView
  const vB = viewGame(s, B.id, players) as SimulView
  assert.equal(vA.stage, 'waiting')
  assert.equal(vB.stage, 'answering')
  assert.equal(vB.partner.answered, true, 'B may know that A answered')
  assert.equal(vB.partner.answer, undefined, 'but not what A answered')
  assert.ok(!JSON.stringify(vB).includes('"answers"'), 'raw answers must never be in a view')

  const r = ok(s, B, { type: 'answer', promptId: id, value: 0 })
  s = r.state
  assert.equal((viewGame(s, A.id, players) as SimulView).stage, 'reveal')
  assert.equal((viewGame(s, A.id, players) as SimulView).match, true)
  // 5 points each for answering + 10 each for matching
  assert.equal(r.points![A.id], 10)
  assert.equal(r.points![B.id], 15)
})

test('quiz: a match is only counted when both really picked the same option', () => {
  let s = start('quiz', { category: 'ROMANTIC' })
  const id = (viewGame(s, A.id, players) as SimulView).prompt!.id
  s = ok(s, A, { type: 'answer', promptId: id, value: 0 }).state
  const r = ok(s, B, { type: 'answer', promptId: id, value: 1 })
  assert.equal((viewGame(r.state, B.id, players) as SimulView).match, false)
  assert.equal(r.points![A.id], undefined)
  assert.equal(r.points![B.id], 5)
})

test('quiz: rejects double answers, stale questions, bad choices and skipping ahead', () => {
  let s = start('quiz')
  const v = viewGame(s, A.id, players) as SimulView
  const id = v.prompt!.id
  assert.ok(act(s, A, { type: 'answer', promptId: id, value: 99 }).error)
  assert.ok(act(s, A, { type: 'answer', promptId: id, value: -1 }).error)
  assert.ok(act(s, A, { type: 'answer', promptId: id, value: 'x' }).error)
  assert.ok(act(s, A, { type: 'answer', promptId: 'quiz.999', value: 0 }).error)
  assert.ok(act(s, A, { type: 'next' }).error, 'cannot advance before both answered')
  s = ok(s, A, { type: 'answer', promptId: id, value: 0 }).state
  assert.ok(act(s, A, { type: 'answer', promptId: id, value: 1 }).error, 'answers are locked in')
  assert.ok(act(s, { id: 'stranger', name: 'X' }, { type: 'answer', promptId: id, value: 0 }).error, 'outsiders cannot play')
})

test('quiz: full game reaches summary, awards completion, records perfect sync', () => {
  let s = start('quiz', { category: 'DREAMS' })
  const total = (viewGame(s, A.id, players) as SimulView).total
  assert.equal(total, 8)
  let last: ReturnType<typeof act> | null = null
  for (let i = 0; i < total; i++) {
    const id = (viewGame(s, A.id, players) as SimulView).prompt!.id
    s = ok(s, A, { type: 'answer', promptId: id, value: 2 }).state
    s = ok(s, B, { type: 'answer', promptId: id, value: 2 }).state
    s = ok(s, A, { type: 'next' }).state
    assert.equal((viewGame(s, A.id, players) as SimulView).me.ready, true, 'A is marked ready while waiting for B')
    last = ok(s, B, { type: 'next' })
    s = last.state
  }
  const v = viewGame(s, A.id, players) as SimulView
  assert.equal(v.stage, 'summary')
  assert.equal(v.summary!.percent, 100)
  assert.equal(v.summary!.matches, total)
  assert.equal(last!.stats!.perfectSync, 1)
  assert.equal(last!.stats!.gamesFinished, 1)
  assert.equal(last!.points![A.id], 20)
  assert.ok(act(s, A, { type: 'next' }).error, 'finished games accept no more input')
})

/* ---------------------------------- Would you rather / likely / nhie ---------------------------------- */
test('likely: options are the two real names for both players', () => {
  const s = start('likely')
  for (const p of players) {
    const v = viewGame(s, p.id, players) as SimulView
    assert.deepEqual(v.prompt!.options, ['Priya', 'Ravi'])
  }
})

test('wyr and nhie run a question to reveal', () => {
  for (const game of ['wyr', 'nhie']) {
    let s = start(game)
    const id = (viewGame(s, A.id, players) as SimulView).prompt!.id
    s = ok(s, A, { type: 'answer', promptId: id, value: 0 }).state
    s = ok(s, B, { type: 'answer', promptId: id, value: 1 }).state
    const v = viewGame(s, B.id, players) as SimulView
    assert.equal(v.stage, 'reveal')
    assert.ok(v.partner.answer && v.me.answer && v.partner.answer !== v.me.answer)
  }
})

/* ---------------------------------- Finish the sentence ---------------------------------- */
test('sentence: free text, per-viewer names, trimmed and length-limited', () => {
  let s = start('sentence', { category: 'SWEET' })
  const vA = viewGame(s, A.id, players) as SimulView
  const vB = viewGame(s, B.id, players) as SimulView
  assert.equal(vA.prompt!.freeText, true)
  assert.ok(vA.prompt!.text.includes('Ravi') && !vA.prompt!.text.includes('Priya'), 'Priya is asked about Ravi')
  assert.ok(vB.prompt!.text.includes('Priya') && !vB.prompt!.text.includes('Ravi'), 'Ravi is asked about Priya')
  const id = vA.prompt!.id
  assert.ok(act(s, A, { type: 'answer', promptId: id, value: '   ' }).error)
  s = ok(s, A, { type: 'answer', promptId: id, value: '  ' + 'x'.repeat(500) }).state
  s = ok(s, B, { type: 'answer', promptId: id, value: 'you make chai better' }).state
  const v = viewGame(s, A.id, players) as SimulView
  assert.equal(v.me.answer!.length, 200)
  assert.equal(v.partner.answer, 'you make chai better')
  assert.equal(v.match, null)
})

/* ---------------------------------- Love languages ---------------------------------- */
test('lovelang: independent progress, hidden until both finish, then results', () => {
  let s = start('lovelang')
  // A races through choosing option 0 every time
  for (let i = 0; i < 10; i++) {
    const v = viewGame(s, A.id, players) as SimulView
    assert.equal(v.stage, 'answering')
    assert.equal(v.index, i)
    s = ok(s, A, { type: 'answer', promptId: v.prompt!.id, value: 0 }).state
  }
  const vA = viewGame(s, A.id, players) as SimulView
  assert.equal(vA.stage, 'waiting')
  assert.equal(vA.summary, undefined, 'no results before the partner finishes')
  assert.equal((viewGame(s, B.id, players) as SimulView).index, 0, "B's progress is independent")

  let last
  for (let i = 0; i < 10; i++) {
    const v = viewGame(s, B.id, players) as SimulView
    last = ok(s, B, { type: 'answer', promptId: v.prompt!.id, value: 1 })
    s = last.state
  }
  const done = viewGame(s, A.id, players) as SimulView
  assert.equal(done.stage, 'summary')
  const love = done.summary!.love!
  const total = (o: Record<string, number>) => Object.values(o).reduce((x, y) => x + y, 0)
  assert.equal(total(love.mine.scores), 10)
  assert.equal(total(love.theirs.scores), 10)
  assert.ok(love.mine.top.length >= 1 && love.theirs.top.length >= 1)
  assert.equal(love.names.theirs, 'Ravi')
  assert.equal(last!.stats!.gamesFinished, 1)
})

/* ---------------------------------- How well do you know me ---------------------------------- */
test('knowme: self answers -> guesses -> reveal, scoring and no leaks', () => {
  let s = start('knowme')
  const total = (viewGame(s, A.id, players) as GuessView).total
  assert.equal(total, 8)

  let v = viewGame(s, A.id, players) as GuessView
  assert.equal(v.stage, 'self-answering')
  assert.ok(v.prompt!.text.includes('Priya'), 'A is asked about herself by name')
  assert.ok((viewGame(s, B.id, players) as GuessView).prompt!.text.includes('Ravi'))
  const id = v.prompt!.id

  assert.ok(act(s, A, { type: 'guess', promptId: id, value: 0 }).error, 'cannot guess before the self step')
  s = ok(s, A, { type: 'self', promptId: id, value: 1 }).state
  assert.equal((viewGame(s, A.id, players) as GuessView).stage, 'self-waiting')
  s = ok(s, B, { type: 'self', promptId: id, value: 2 }).state

  v = viewGame(s, A.id, players) as GuessView
  assert.equal(v.stage, 'guess-answering')
  assert.ok(v.prompt!.text.includes('Ravi'), 'A now guesses about Ravi')
  assert.ok(!JSON.stringify(v).includes('truth'), "the partner's real answer is not in the view yet")

  s = ok(s, A, { type: 'guess', promptId: id, value: 2 }).state // correct: Ravi picked 2
  const r = ok(s, B, { type: 'guess', promptId: id, value: 0 }) // wrong: Priya picked 1
  s = r.state
  assert.equal(r.stats!.guessRight, 1)
  assert.equal(r.points![A.id], 15, 'A guessed right at the reveal')
  assert.equal(r.points![B.id], 3, 'B only gets the answering points')

  v = viewGame(s, B.id, players) as GuessView
  assert.equal(v.stage, 'reveal')
  const rows = v.reveal!.rows
  assert.equal(rows.find((x) => x.name === 'Ravi')!.correct, true)
  assert.equal(rows.find((x) => x.name === 'Priya')!.correct, false)
  assert.ok(rows.every((x) => x.question.includes(x.name)))
  assert.equal(v.scores.mine, 0)
  assert.equal(v.scores.theirs, 1)
})

test('knowme: plays to a summary with a winner', () => {
  let s = start('knowme')
  let end
  for (let i = 0; i < 8; i++) {
    const id = (viewGame(s, A.id, players) as GuessView).prompt!.id
    s = ok(s, A, { type: 'self', promptId: id, value: 0 }).state
    s = ok(s, B, { type: 'self', promptId: id, value: 0 }).state
    s = ok(s, A, { type: 'guess', promptId: id, value: 0 }).state // A always right
    s = ok(s, B, { type: 'guess', promptId: id, value: i % 2 === 0 ? 0 : 1 }).state // B right half the time
    s = ok(s, A, { type: 'next' }).state
    end = ok(s, B, { type: 'next' })
    s = end.state
  }
  const v = viewGame(s, A.id, players) as GuessView
  assert.equal(v.stage, 'summary')
  assert.equal(v.scores.mine, 8)
  assert.equal(v.scores.theirs, 4)
  assert.equal(v.summary!.winner, 'me')
  assert.equal((viewGame(s, B.id, players) as GuessView).summary!.winner, 'partner')
  assert.equal(end!.stats!.gamesFinished, 1)
})

/* ---------------------------------- Truth or Dare ---------------------------------- */
test('tod: turn order, partner approval, points, skips and levels', () => {
  const rand = seeded(5)
  let s = start('tod', { level: 'SWEET' })
  let v = viewGame(s, A.id, players) as TodView
  assert.equal(v.level, 'SWEET')
  assert.equal(v.performer.name, 'Priya')
  assert.equal(v.performer.isMe, true)

  assert.ok(act(s, B, { type: 'pick', kind: 'TRUTH' }, rand).error, "cannot pick on your partner's turn")
  assert.ok(act(s, A, { type: 'pick', kind: 'NONSENSE' }, rand).error)
  s = ok(s, A, { type: 'level', level: 'FUN' }, rand).state
  assert.equal((s as TodState).level, 'FUN')
  s = ok(s, A, { type: 'pick', kind: 'DARE' }, rand).state
  v = viewGame(s, B.id, players) as TodView
  assert.equal(v.phase, 'card')
  assert.equal(v.card!.type, 'DARE')
  assert.ok(v.card!.text.includes('Priya'), 'card names the performer')
  assert.ok(!/\{\w+\}/.test(v.card!.text))
  assert.ok(act(s, A, { type: 'level', level: 'SWEET' }, rand).error, 'level locked mid-turn')

  assert.ok(act(s, B, { type: 'done' }, rand).error, 'only the performer marks done')
  s = ok(s, A, { type: 'done' }, rand).state
  assert.ok(act(s, A, { type: 'approve' }, rand).error, 'you cannot approve yourself')
  const rejected = ok(s, B, { type: 'reject' }, rand)
  assert.equal((rejected.state as TodState).phase, 'card')
  s = ok(rejected.state, A, { type: 'done' }, rand).state
  const approved = ok(s, B, { type: 'approve' }, rand)
  assert.equal(approved.points![A.id], 30)
  assert.equal(approved.points![B.id], 10)
  assert.equal(approved.stats!.daresDone, 1)
  s = approved.state
  v = viewGame(s, B.id, players) as TodView
  assert.equal(v.phase, 'choose')
  assert.equal(v.performer.name, 'Ravi', 'turn passes to the partner')
  assert.equal(v.completed, 1)

  // skips: two per player, then none
  for (let i = 0; i < 2; i++) {
    s = ok(s, B, { type: 'pick', kind: 'TRUTH' }, rand).state
    s = ok(s, B, { type: 'skip' }, rand).state // turn passes to A
    s = ok(s, A, { type: 'pick', kind: 'TRUTH' }, rand).state
    s = ok(s, A, { type: 'skip' }, rand).state // turn passes back to B
  }
  s = ok(s, B, { type: 'pick', kind: 'RANDOM' }, rand).state
  assert.ok(act(s, B, { type: 'skip' }, rand).error, 'out of skips')
})

test('tod: never repeats a card until the pool is exhausted', () => {
  const rand = seeded(9)
  let s = start('tod', { level: 'SWEET' })
  const seen = new Set<string>()
  for (let i = 0; i < 10; i++) {
    const performer = (s as TodState).turn === A.id ? A : B
    const judge = performer === A ? B : A
    s = ok(s, performer, { type: 'pick', kind: 'TRUTH' }, rand).state
    const id = (s as TodState).card!.id
    assert.ok(!seen.has(id), `card ${id} repeated`)
    seen.add(id)
    s = ok(s, performer, { type: 'done' }, rand).state
    s = ok(s, judge, { type: 'approve' }, rand).state
  }
  // the 11th draw of a 10-card pool must still work (pool resets)
  const performer = (s as TodState).turn === A.id ? A : B
  s = ok(s, performer, { type: 'pick', kind: 'TRUTH' }, rand).state
  assert.equal((s as TodState).phase, 'card')
})

/* ---------------------------------- Deep talk ---------------------------------- */
test('deep: both must tap next; reader alternates; finishes with the 12-card deck', () => {
  let s = start('deep', { deck: 'SET2' })
  let v = viewGame(s, A.id, players) as CardsView
  assert.equal(v.total, DECKS.SET2.cards.length)
  assert.equal(v.reader.name, 'Priya')
  s = ok(s, A, { type: 'next' }).state
  assert.equal((viewGame(s, A.id, players) as CardsView).index, 0, 'waits for the partner')
  assert.equal((viewGame(s, B.id, players) as CardsView).partner.ready, true)
  s = ok(s, B, { type: 'next' }).state
  v = viewGame(s, B.id, players) as CardsView
  assert.equal(v.index, 1)
  assert.equal(v.reader.name, 'Ravi')

  let r
  for (let i = 1; i < v.total; i++) {
    s = ok(s, A, { type: 'next' }).state
    r = ok(s, B, { type: 'next' })
    s = r.state
  }
  assert.equal((viewGame(s, A.id, players) as CardsView).finished, true)
  assert.equal(r!.stats!.gamesFinished, 1)
})

test('deep: unknown deck falls back to the default', () => {
  const s = start('deep', { deck: 'HACKED' })
  assert.equal((s as { deck: string }).deck, 'SET1')
})

/* ---------------------------------- Board games ---------------------------------- */
test('tictactoe: turns, win detection, draw, rematch alternates starter', () => {
  let s = start('ttt')
  assert.ok(act(s, B, { type: 'move', cell: 0 }).error, 'A starts')
  const moves: [Player, number][] = [[A, 0], [B, 3], [A, 1], [B, 4], [A, 2]]
  let r
  for (const [p, cell] of moves) {
    r = ok(s, p, { type: 'move', cell })
    s = r.state
  }
  const t = s as TttState
  assert.equal(t.winner, 0)
  assert.deepEqual(t.line, [0, 1, 2])
  assert.deepEqual(t.wins, [1, 0])
  assert.equal(r!.points![A.id], 25)
  assert.equal(r!.stats!.boardWins, 1)
  assert.ok(act(s, B, { type: 'move', cell: 5 }).error, 'round is over')

  s = ok(s, B, { type: 'rematch' }).state
  assert.equal((s as TttState).turn, 1, 'the loser starts the next round')
  assert.deepEqual((s as TttState).wins, [1, 0], 'series score persists')
  assert.ok(act(s, B, { type: 'move', cell: 0 }).error === undefined)
  assert.ok(act(s, B, { type: 'move', cell: 99 }).error)

  // a draw
  let d = start('ttt')
  const order: [Player, number][] = [[A, 0], [B, 1], [A, 2], [B, 4], [A, 3], [B, 5], [A, 7], [B, 6], [A, 8]]
  for (const [p, cell] of order) d = ok(d, p, { type: 'move', cell }).state
  assert.equal((d as TttState).winner, 'draw')
  assert.equal((d as TttState).draws, 1)
  assert.ok(act(d, A, { type: 'move', cell: 0 }).error)
})

test('tictactoe: winner helper covers every line', () => {
  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
  for (const l of lines) {
    const b: (0 | 1 | null)[] = Array(9).fill(null)
    l.forEach((i) => (b[i] = 1))
    assert.equal(tttWinner(b).winner, 1)
  }
  assert.equal(tttWinner(Array(9).fill(null)).winner, null)
})

test('connect four: gravity, wins in every direction, full column', () => {
  let s = start('c4')
  s = ok(s, A, { type: 'drop', col: 3 }).state
  assert.equal((s as C4State).board[5 * 7 + 3], 0, 'disc falls to the bottom row')
  s = ok(s, B, { type: 'drop', col: 3 }).state
  assert.equal((s as C4State).board[4 * 7 + 3], 1, 'and stacks')
  assert.ok(act(s, B, { type: 'drop', col: 3 }).error, 'not your turn')
  assert.ok(act(s, A, { type: 'drop', col: 9 }).error)

  // vertical win for A in column 0 (B plays column 1)
  let v = start('c4')
  let r
  for (let i = 0; i < 4; i++) {
    r = ok(v, A, { type: 'drop', col: 0 })
    v = r.state
    if (i < 3) v = ok(v, B, { type: 'drop', col: 1 }).state
  }
  assert.equal((v as C4State).winner, 0)
  assert.equal((v as C4State).line!.length, 4)
  assert.equal(r!.points![A.id], 25)

  // helper: horizontal, diagonal both ways
  const empty = () => Array(42).fill(null) as (0 | 1 | null)[]
  const set = (b: (0 | 1 | null)[], cells: [number, number][], who: 0 | 1) => cells.forEach(([r, c]) => (b[r * 7 + c] = who))
  const h = empty(); set(h, [[5, 1], [5, 2], [5, 3], [5, 4]], 1)
  assert.equal(c4Winner(h).winner, 1)
  const d1 = empty(); set(d1, [[5, 0], [4, 1], [3, 2], [2, 3]], 0)
  assert.equal(c4Winner(d1).winner, 0)
  const d2 = empty(); set(d2, [[5, 6], [4, 5], [3, 4], [2, 3]], 1)
  assert.equal(c4Winner(d2).winner, 1)
  const three = empty(); set(three, [[5, 0], [5, 1], [5, 2]], 0)
  assert.equal(c4Winner(three).winner, null)

  // fill a column: 6 discs
  let f = start('c4')
  for (let i = 0; i < 6; i++) f = ok(f, i % 2 === 0 ? A : B, { type: 'drop', col: 6 }).state
  assert.ok(act(f, A, { type: 'drop', col: 6 }).error, 'column full')
})

test('memory: hidden cards are not in the view; match keeps the turn; mismatch passes it and stays visible', () => {
  let s = start('memory')
  const m = s as MemoryState
  const view = (p: Player) => viewGame(s, p.id, players) as MemoryView
  assert.ok(view(A).cards.every((c) => c.symbol === null), 'no symbols leak before a flip')
  assert.ok(!JSON.stringify(view(B)).includes('symbols'))

  const first = 0
  const pair = m.symbols.findIndex((sym, i) => i !== first && sym === m.symbols[first])
  const other = m.symbols.findIndex((sym) => sym !== m.symbols[first])

  s = ok(s, A, { type: 'flip', i: first }).state
  assert.equal(view(B).cards[first].symbol, m.symbols[first], 'a flipped card is visible to both')
  assert.ok(act(s, B, { type: 'flip', i: pair }).error, "not B's turn")
  assert.ok(act(s, A, { type: 'flip', i: first }).error, 'cannot flip the same card twice')

  // mismatch
  s = ok(s, A, { type: 'flip', i: other }).state
  let v = view(B)
  assert.equal(v.lastWasMismatch, true)
  assert.equal(v.turn, 1)
  assert.equal(v.cards[first].symbol, m.symbols[first])
  assert.equal(v.cards[other].symbol, m.symbols[other], 'mismatch stays visible for both players')

  // B's next flip hides the previous mismatch; B then matches
  s = ok(s, B, { type: 'flip', i: first }).state
  v = view(A)
  assert.equal(v.cards[other].symbol, null, 'old mismatch is hidden again')
  s = ok(s, B, { type: 'flip', i: pair }).state
  v = view(A)
  assert.deepEqual(v.scores, [0, 1])
  assert.equal(v.turn, 1, 'a match keeps the turn')
  assert.equal(v.cards[pair].owner, 1)
  assert.ok(act(s, B, { type: 'flip', i: pair }).error, 'matched cards are locked')
})

test('memory: playing every pair ends the game with a winner and rematch reshuffles', () => {
  let s = start('memory')
  let r
  for (let round = 0; round < 8; round++) {
    const m = s as MemoryState
    const first = m.owner.findIndex((o) => o === null)
    const second = m.symbols.findIndex((sym, i) => i !== first && sym === m.symbols[first] && m.owner[i] === null)
    r = ok(s, A, { type: 'flip', i: first })
    r = ok(r.state, A, { type: 'flip', i: second })
    s = r.state
  }
  const m = s as MemoryState
  assert.equal(m.over, true)
  assert.deepEqual(m.scores, [8, 0])
  assert.equal(r!.points![A.id], 25)
  assert.equal(r!.stats!.boardWins, 1)
  assert.ok(act(s, A, { type: 'flip', i: 0 }).error)

  const before = m.symbols.join('')
  const again = ok(s, B, { type: 'rematch' }, seeded(99)).state as MemoryState
  assert.equal(again.over, false)
  assert.equal(again.turn, 1)
  assert.deepEqual(again.wins, [1, 0])
  assert.notEqual(again.symbols.join(''), before)
})

/* ---------------------------------- Plumbing ---------------------------------- */
test('every game can start, survives a JSON round-trip and produces a view for both players', () => {
  const ids = ['quiz', 'knowme', 'tod', 'wyr', 'likely', 'nhie', 'sentence', 'lovelang', 'deep', 'ttt', 'c4', 'memory']
  for (const id of ids) {
    const s = start(id)
    const revived = JSON.parse(JSON.stringify(s)) as GameState
    for (const p of players) {
      const v = viewGame(revived, p.id, players)
      assert.ok(v && typeof v === 'object', `${id} produced no view`)
      assert.ok(!/\{\w+\}/.test(JSON.stringify(v)), `${id} left an unfilled placeholder in its view`)
    }
  }
  assert.equal(initGame('nope', players), null)
  assert.equal(initGame('quiz', [A]), null, 'needs two players')
})

test('unknown categories fall back to the default instead of crashing', () => {
  const s = start('wyr', { category: 'DROP TABLE' }) as SimulState
  assert.equal(s.category, 'MIXED')
  const t = start('tod', { level: '???' }) as TodState
  assert.equal(t.level, 'FUN')
})
