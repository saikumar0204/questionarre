import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initGame, reduceGame, viewGame, type GameState } from '../src/games/index.ts'
import type { GameEvent, Player } from '../src/games/types.ts'
import { MELD_MAX_ROUNDS, TUNE_ROUNDS, normalizeWord, similarity, tuneScore, type MeldState, type MeldView, type RankView, type TuneState, type TuneView } from '../src/games/engines/sync.ts'
import { HUNT_HEARTS, STORY_LINES, type HuntState, type HuntView, type LieState, type LieView, type StoryView } from '../src/games/engines/play.ts'
import { SPECTRA, MELD_PAIRS, RANK_PROMPTS, STORY_OPENERS, DOODLE_WORDS, EMOJI_PHRASES } from '../src/games/content/newgames.ts'
import { CHARADES_ROUNDS, isCorrectGuess, validateEmoji, validateStrokes, type CharadesState, type CharadesView, type Stroke } from '../src/games/engines/charades.ts'

const A: Player = { id: 'ua', name: 'Priya' }
const B: Player = { id: 'ub', name: 'Ravi' }
const players = [A, B]

function seeded(seed = 7) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}
const act = (state: GameState, actor: Player, event: GameEvent, rand = seeded(3)) => reduceGame(state, event, actor.id, players, rand)
const ok = (state: GameState, actor: Player, event: GameEvent, rand?: () => number) => {
  const r = act(state, actor, event, rand)
  assert.equal(r.error, undefined, `unexpected error: ${r.error}`)
  return r
}
const start = (id: string) => initGame(id, players, {}, seeded(11))!

test('new content banks are populated with unique ids', () => {
  assert.ok(SPECTRA.length >= 30 && MELD_PAIRS.length >= 25 && RANK_PROMPTS.length >= 15 && STORY_OPENERS.length >= 10)
  assert.equal(new Set(SPECTRA.map((s) => s.id)).size, SPECTRA.length)
  for (const r of RANK_PROMPTS) assert.equal(r.items.length, 5, `${r.id} must have exactly five items`)
})

/* ------------------------------------ Tune In ------------------------------------ */
test('tune in: scoring bands', () => {
  assert.equal(tuneScore(50, 50), 4)
  assert.equal(tuneScore(50, 54), 4)
  assert.equal(tuneScore(50, 60), 3)
  assert.equal(tuneScore(50, 68), 2)
  assert.equal(tuneScore(50, 69), 0)
  assert.equal(tuneScore(0, 100), 0)
})

test('tune in: only the psychic sees the target; roles swap every round; full game', () => {
  let s = start('tunein')
  assert.equal((s as TuneState).psychic, 0)
  assert.equal((s as TuneState).target, null, 'the psychic chooses the target themselves')
  const target = 34

  const vP = viewGame(s, A.id, players) as TuneView
  let vG = viewGame(s, B.id, players) as TuneView
  assert.equal(vP.role, 'psychic')
  assert.equal(vP.target, undefined, 'nothing is set until the psychic places it')
  assert.equal(vG.role, 'guesser')
  assert.equal(vG.target, undefined, "the guesser must not receive the target")
  assert.ok(!JSON.stringify(vG).includes(`"target":${target}`))

  assert.ok(act(s, B, { type: 'clue', text: 'nope', target }).error, 'guesser cannot give the clue')
  assert.ok(act(s, A, { type: 'clue', text: '   ', target }).error)
  assert.ok(act(s, A, { type: 'clue', text: 'no target placed' }).error, 'the clue needs a target')
  assert.ok(act(s, A, { type: 'clue', text: 'off the dial', target: 101 }).error)
  assert.ok(act(s, A, { type: 'clue', text: 'not a number', target: 'x' }).error)
  assert.ok(act(s, A, { type: 'guess', value: 50 }).error, 'no guessing before the clue')
  s = ok(s, A, { type: 'clue', text: 'a perfect rainy chai', target }).state
  assert.equal((viewGame(s, A.id, players) as TuneView).target, target, 'the psychic still sees the target they placed')
  assert.ok(act(s, A, { type: 'guess', value: 50 }).error, 'the psychic cannot guess their own clue')
  assert.ok(act(s, B, { type: 'guess', value: 500 }).error)
  assert.ok(act(s, B, { type: 'guess', value: 'x' }).error)

  vG = viewGame(s, B.id, players) as TuneView
  assert.equal(vG.phase, 'guess')
  assert.equal(vG.clue, 'a perfect rainy chai')
  assert.equal(vG.target, undefined, 'still hidden during the guess')

  const r = ok(s, B, { type: 'guess', value: target })
  s = r.state
  assert.equal((s as TuneState).score, 4)
  assert.equal(r.points![A.id], 23)
  vG = viewGame(s, B.id, players) as TuneView
  assert.equal(vG.phase, 'reveal')
  assert.equal(vG.target, target, 'target is revealed after the guess')
  assert.equal(vG.lastPoints, 4)

  s = ok(s, A, { type: 'next' }).state
  assert.equal((s as TuneState).psychic, 1, 'roles swap')
  assert.equal((viewGame(s, B.id, players) as TuneView).role, 'psychic')

  let last
  for (let round = 2; round <= TUNE_ROUNDS; round++) {
    const psychic = (s as TuneState).psychic === 0 ? A : B
    const guesser = psychic === A ? B : A
    s = ok(s, psychic, { type: 'clue', text: 'clue ' + round, target: 10 + round * 10 }).state
    s = ok(s, guesser, { type: 'guess', value: 0 }).state
    last = ok(s, guesser, { type: 'next' })
    s = last.state
  }
  const v = viewGame(s, A.id, players) as TuneView
  assert.equal(v.finished, true)
  assert.equal(v.history.length, TUNE_ROUNDS)
  assert.ok(v.rating)
  assert.equal(last!.stats!.gamesFinished, 1)
  assert.ok(act(s, A, { type: 'clue', text: 'x' }).error)
})

/* ------------------------------------ Meet in the Middle ------------------------------------ */
test('meld: word normalisation treats case, punctuation and plurals as the same', () => {
  assert.equal(normalizeWord('  Chai! '), normalizeWord('chai'))
  assert.equal(normalizeWord('Cats'), normalizeWord('cat'))
  assert.equal(normalizeWord('Glass'), 'glass', 'double-s words keep their s')
  assert.notEqual(normalizeWord('sun'), normalizeWord('moon'))
  assert.equal(normalizeWord('  '), '')
})

test('meld: words are hidden until both submit, then bridge the last two words', () => {
  let s = start('meld')
  const startWords = (s as MeldState).start
  let v = viewGame(s, A.id, players) as MeldView
  assert.deepEqual(v.bridge, startWords)
  assert.equal(v.round, 1)

  assert.ok(act(s, A, { type: 'word', word: '   ' }).error)
  s = ok(s, A, { type: 'word', word: 'sunset' }).state
  assert.ok(act(s, A, { type: 'word', word: 'again' }).error, 'locked in')
  const vB = viewGame(s, B.id, players) as MeldView
  assert.equal(vB.partner.submitted, true)
  assert.ok(!JSON.stringify(vB).includes('sunset'), "Ravi cannot read Priya's word yet")
  assert.equal(vB.history.length, 0)

  s = ok(s, B, { type: 'word', word: 'beach' }).state
  v = viewGame(s, A.id, players) as MeldView
  assert.equal(v.round, 2)
  assert.deepEqual(v.bridge, ['sunset', 'beach'], 'next round bridges the two revealed words')
  assert.equal(v.history.length, 1)
  assert.equal(v.history[0].matched, false)
  assert.equal(v.finished, false)

  s = ok(s, A, { type: 'word', word: 'Waves' }).state
  const win = ok(s, B, { type: 'word', word: 'wave' })
  s = win.state
  v = viewGame(s, B.id, players) as MeldView
  assert.equal(v.won, true)
  assert.equal(v.finished, true)
  assert.equal(win.points![A.id], 62)
  assert.equal(win.stats!.meldWins, 1)
  assert.equal(win.stats!.meldFast, 1)
  assert.ok(act(s, A, { type: 'word', word: 'more' }).error)
})

test('meld: gives up gracefully after the maximum number of rounds', () => {
  let s = start('meld')
  let last
  for (let i = 0; i < MELD_MAX_ROUNDS; i++) {
    s = ok(s, A, { type: 'word', word: 'a' + i }).state
    last = ok(s, B, { type: 'word', word: 'b' + i })
    s = last.state
  }
  const v = viewGame(s, A.id, players) as MeldView
  assert.equal(v.finished, true)
  assert.equal(v.won, false)
  assert.equal(v.history.length, MELD_MAX_ROUNDS)
  assert.equal(last!.stats!.gamesFinished, 1)
})

/* ------------------------------------ Rank & Reveal ------------------------------------ */
test('rank: similarity is 100 for identical, 0 for reversed, in between otherwise', () => {
  assert.equal(similarity([0, 1, 2, 3, 4], [0, 1, 2, 3, 4]), 100)
  assert.equal(similarity([0, 1, 2, 3, 4], [4, 3, 2, 1, 0]), 0)
  const mid = similarity([0, 1, 2, 3, 4], [1, 0, 2, 3, 4])
  assert.ok(mid > 80 && mid < 100)
})

test('rank: validation, hidden partner ranking, reveal with biggest gap, summary', () => {
  let s = start('rank')
  let v = viewGame(s, A.id, players) as RankView
  assert.equal(v.stage, 'ranking')
  assert.equal(v.items.length, 5)
  const id = (s as { ids: string[] }).ids[0]

  assert.ok(act(s, A, { type: 'rank', promptId: id, order: [0, 1, 2] }).error)
  assert.ok(act(s, A, { type: 'rank', promptId: id, order: [0, 0, 1, 2, 3] }).error)
  assert.ok(act(s, A, { type: 'rank', promptId: id, order: [0, 1, 2, 3, 9] }).error)
  assert.ok(act(s, A, { type: 'rank', promptId: 'rank.999', order: [0, 1, 2, 3, 4] }).error)

  s = ok(s, A, { type: 'rank', promptId: id, order: [0, 1, 2, 3, 4] }).state
  assert.ok(act(s, A, { type: 'rank', promptId: id, order: [4, 3, 2, 1, 0] }).error, 'locked in')
  v = viewGame(s, B.id, players) as RankView
  assert.equal(v.partner.done, true)
  assert.equal(v.partner.order, undefined, "partner's ranking hidden")
  assert.equal(v.similarity, undefined)

  s = ok(s, B, { type: 'rank', promptId: id, order: [4, 1, 2, 3, 0] }).state
  v = viewGame(s, A.id, players) as RankView
  assert.equal(v.stage, 'reveal')
  assert.ok(v.similarity! > 0 && v.similarity! < 100)
  assert.deepEqual(v.partner.order, [4, 1, 2, 3, 0])
  assert.equal(v.biggestGap!.mine !== v.biggestGap!.theirs, true)

  let last
  for (let round = 0; round < 5; round++) {
    if (round > 0) {
      const rid = (viewGame(s, A.id, players) as RankView) && (s as { ids: string[]; idx: number }).ids[(s as { idx: number }).idx]
      s = ok(s, A, { type: 'rank', promptId: rid, order: [0, 1, 2, 3, 4] }).state
      s = ok(s, B, { type: 'rank', promptId: rid, order: [0, 1, 2, 3, 4] }).state
    }
    s = ok(s, A, { type: 'next' }).state
    last = ok(s, B, { type: 'next' })
    s = last.state
  }
  v = viewGame(s, A.id, players) as RankView
  assert.equal(v.stage, 'summary')
  assert.equal(v.finished, true)
  assert.ok(v.average! > 80, 'four identical rounds pull the average up')
  assert.equal(last!.stats!.gamesFinished, 1)
})

/* ------------------------------------ Spot the Lie ------------------------------------ */
test('lie: validation, hidden lie index during guessing, scoring both ways', () => {
  let s = start('lie')
  const good = ['I have been to Paris', 'I can whistle with two fingers', 'I once met a famous cricketer']
  assert.ok(act(s, A, { type: 'submit', statements: good.slice(0, 2), lie: 0 }).error)
  assert.ok(act(s, A, { type: 'submit', statements: ['a', 'b', 'c'], lie: 0 }).error, 'too short')
  assert.ok(act(s, A, { type: 'submit', statements: [good[0], good[0], good[1]], lie: 0 }).error, 'duplicates')
  assert.ok(act(s, A, { type: 'submit', statements: good, lie: 5 }).error)

  const rand = seeded(21)
  s = ok(s, A, { type: 'submit', statements: good, lie: 2 }, rand).state // the lie: "I once met a famous cricketer"
  let v = viewGame(s, B.id, players) as LieView
  assert.equal(v.phase, 'write')
  assert.equal(v.partner.submitted, true)
  assert.equal(v.toJudge, undefined, 'nothing to judge until both have written')
  s = ok(s, B, { type: 'submit', statements: ['I hate pizza', 'I have a twin', 'I speak three languages'], lie: 0 }, rand).state

  v = viewGame(s, B.id, players) as LieView
  assert.equal(v.phase, 'guess')
  assert.equal(v.toJudge!.name, 'Priya')
  assert.equal(v.toJudge!.statements.length, 3)
  assert.ok(!JSON.stringify(v).includes('"lie":'), 'the lie index never reaches the guesser')
  assert.deepEqual([...v.toJudge!.statements].sort(), [...good].sort(), 'same statements, shuffled')

  // find the shuffled index of A's lie, and B's lie
  const aLie = (s as LieState).entries[A.id].lie
  const bLie = (s as LieState).entries[B.id].lie
  assert.equal((s as LieState).entries[A.id].statements[aLie], 'I once met a famous cricketer')

  s = ok(s, B, { type: 'guess', index: aLie }).state // Ravi catches Priya's lie
  assert.ok(act(s, B, { type: 'guess', index: 0 }).error, 'locked in')
  const r = ok(s, A, { type: 'guess', index: (bLie + 1) % 3 }) // Priya is fooled by Ravi
  s = r.state
  assert.equal(r.points![B.id], 40, 'Ravi both caught the lie AND fooled Priya')
  assert.equal(r.points![A.id], undefined)
  v = viewGame(s, A.id, players) as LieView
  assert.equal(v.phase, 'reveal')
  assert.equal(v.scores.theirs, 2)
  assert.equal(v.scores.mine, 0)
  assert.equal(v.reveal!.rows.find((x) => x.name === 'Priya')!.caught, true)
  assert.equal(v.reveal!.rows.find((x) => x.name === 'Ravi')!.caught, false)

  s = ok(s, A, { type: 'again' }).state
  v = viewGame(s, A.id, players) as LieView
  assert.equal(v.phase, 'write')
  assert.equal(v.round, 2)
  assert.equal(v.scores.theirs, 2, 'scores carry over between rounds')
})

/* ------------------------------------ Heart Hunt ------------------------------------ */
test('hunt: hidden placement, hits give another shot, hearts stay secret until the end', () => {
  let s = start('hunt')
  assert.ok(act(s, A, { type: 'place', cells: [1, 2] }).error)
  assert.ok(act(s, A, { type: 'place', cells: [1, 1, 2] }).error)
  assert.ok(act(s, A, { type: 'place', cells: [1, 2, 99] }).error)
  assert.ok(act(s, A, { type: 'shoot', cell: 0 }).error, 'cannot shoot before hiding')

  s = ok(s, A, { type: 'place', cells: [0, 1, 2] }).state
  assert.ok(act(s, A, { type: 'place', cells: [5, 6, 7] }).error, 'placement is final')
  let vB = viewGame(s, B.id, players) as HuntView
  assert.equal(vB.placed.partner, true)
  assert.deepEqual(vB.myBoard.hearts, [])
  assert.ok(!JSON.stringify(vB).includes('[0,1,2]'), "A's hearts must not be in B's view")

  s = ok(s, B, { type: 'place', cells: [10, 11, 12] }).state
  assert.equal((s as HuntState).phase, 'play')
  assert.ok(act(s, B, { type: 'shoot', cell: 3 }).error, 'A starts')

  // miss -> turn passes
  s = ok(s, A, { type: 'shoot', cell: 24 }).state
  assert.equal((s as HuntState).turn, 1)
  // B hits -> B shoots again
  let r = ok(s, B, { type: 'shoot', cell: 0 })
  s = r.state
  assert.equal((s as HuntState).turn, 1, 'a hit earns another shot')
  assert.equal(r.points![B.id], 3)
  const vA = viewGame(s, A.id, players) as HuntView
  assert.deepEqual(vA.myBoard.hitsAgainstMe, [0])
  assert.equal(vA.found.partner, 1)
  assert.equal((viewGame(s, B.id, players) as HuntView).theirBoard.hearts, undefined)
  assert.ok(act(s, B, { type: 'shoot', cell: 0 }).error, 'already tried')

  // B finds the remaining two hearts and wins
  s = ok(s, B, { type: 'shoot', cell: 1 }).state
  r = ok(s, B, { type: 'shoot', cell: 2 })
  s = r.state
  assert.equal((s as HuntState).phase, 'over')
  assert.equal((s as HuntState).winner, 1)
  assert.equal(r.points![B.id], 30)
  assert.equal(r.stats!.boardWins, 1)
  vB = viewGame(s, B.id, players) as HuntView
  assert.deepEqual(vB.theirBoard.hearts, [0, 1, 2], 'hearts are revealed once the game is over')
  assert.ok(act(s, A, { type: 'shoot', cell: 5 }).error)

  s = ok(s, A, { type: 'rematch' }).state
  const t = s as HuntState
  assert.equal(t.phase, 'place')
  assert.deepEqual(t.wins, [0, 1])
  assert.equal(t.starter, 1, 'starter alternates')
  assert.equal(HUNT_HEARTS, 3)
})

/* ------------------------------------ Once Upon Us ------------------------------------ */
test('story: alternating turns, names in the opener, ends at 10 lines', () => {
  let s = start('story')
  let v = viewGame(s, A.id, players) as StoryView
  assert.ok(v.opener.includes('Priya') || v.opener.includes('Ravi') || !/\{\w+\}/.test(v.opener))
  assert.ok(!/\{\w+\}/.test(v.opener))
  assert.equal(v.myTurn, true)
  assert.ok(act(s, B, { type: 'add', text: 'Not my turn' }).error)
  assert.ok(act(s, A, { type: 'add', text: 'x' }).error, 'too short')
  assert.ok(act(s, A, { type: 'end' }).error, 'cannot end an empty story')

  let last
  for (let i = 0; i < STORY_LINES; i++) {
    const writer = i % 2 === 0 ? A : B
    if (i === 3) {
      assert.equal((viewGame(s, A.id, players) as StoryView).canEnd, false)
    }
    last = ok(s, writer, { type: 'add', text: `Line number ${i + 1} of our story.` })
    s = last.state
  }
  v = viewGame(s, B.id, players) as StoryView
  assert.equal(v.finished, true)
  assert.equal(v.lines.length, STORY_LINES)
  assert.equal(v.lines[0].byName, 'Priya')
  assert.equal(v.lines[1].byMe, true)
  assert.equal(last!.stats!.storiesWritten, 1)
  assert.ok(act(s, A, { type: 'add', text: 'More more more' }).error)
})

test('story: can be ended early after six lines', () => {
  let s = start('story')
  for (let i = 0; i < 6; i++) s = ok(s, i % 2 === 0 ? A : B, { type: 'add', text: `Chapter ${i} begins here` }).state
  assert.equal((viewGame(s, A.id, players) as StoryView).canEnd, true)
  const r = ok(s, B, { type: 'end' })
  assert.equal((viewGame(r.state, A.id, players) as StoryView).finished, true)
  assert.equal(r.stats!.storiesWritten, 1)
})

test('all 20 games start, round-trip through JSON and never leave placeholders', () => {
  const ids = ['quiz', 'knowme', 'tod', 'wyr', 'likely', 'nhie', 'sentence', 'lovelang', 'deep', 'ttt', 'c4', 'memory', 'tunein', 'meld', 'rank', 'lie', 'hunt', 'story', 'doodle', 'emoji']
  for (const id of ids) {
    const s = start(id)
    const revived = JSON.parse(JSON.stringify(s)) as GameState
    for (const p of players) {
      const v = viewGame(revived, p.id, players)
      assert.ok(v, `${id} has no view`)
      assert.ok(!/\{\w+\}/.test(JSON.stringify(v)), `${id} leaves a placeholder`)
    }
  }
})

/* ------------------------------------ Doodle Dash & Emoji Charades ------------------------------------ */
const stroke = (n = 5, c = 0, w = 1): Stroke => ({ c, w, p: Array.from({ length: n }, (_, i) => [i * 40, i * 30] as [number, number]) })

test('charades: word banks are healthy and emoji phrases contain no digits', () => {
  assert.ok(DOODLE_WORDS.length >= 40 && EMOJI_PHRASES.length >= 30)
  assert.equal(new Set([...DOODLE_WORDS, ...EMOJI_PHRASES].map((w) => w.id)).size, DOODLE_WORDS.length + EMOJI_PHRASES.length)
})

test('charades: guess matching forgives case, spacing, plurals and one typo in long words', () => {
  assert.equal(isCorrectGuess('PIZZA', 'Pizza'), true)
  assert.equal(isCorrectGuess('  the pizza ', 'Pizza'), true)
  assert.equal(isCorrectGuess('ice cream', 'Ice cream'), true)
  assert.equal(isCorrectGuess('icecream', 'Ice cream'), true)
  assert.equal(isCorrectGuess('elephants', 'Elephant'), true)
  assert.equal(isCorrectGuess('lighthose', 'Lighthouse'), true, 'one typo in a long word')
  assert.equal(isCorrectGuess('pizzo', 'Pizza'), false, 'no typo forgiveness in short words')
  assert.equal(isCorrectGuess('burger', 'Pizza'), false)
  assert.equal(isCorrectGuess('', 'Pizza'), false)
})

test('charades: stroke validation rejects junk and oversize payloads', () => {
  assert.ok(validateStrokes([stroke()]))
  assert.equal(validateStrokes([]), null)
  assert.equal(validateStrokes('x'), null)
  assert.equal(validateStrokes([{ c: 9, w: 1, p: [[1, 1]] }]), null, 'colour out of range')
  assert.equal(validateStrokes([{ c: 1, w: 5, p: [[1, 1]] }]), null, 'brush out of range')
  assert.equal(validateStrokes([{ c: 1, w: 1, p: [[1, 2000]] }]), null, 'point off the canvas')
  assert.equal(validateStrokes([{ c: 1, w: 1, p: [[1, 'a']] }]), null)
  assert.equal(validateStrokes(Array.from({ length: 81 }, () => stroke(2))), null, 'too many strokes')
  assert.equal(validateStrokes([stroke(401)]), null, 'stroke too long')
  assert.equal(validateStrokes(Array.from({ length: 11 }, () => stroke(400))), null, 'too many points overall')
})

test('charades: emoji clues must be emoji only', () => {
  assert.equal(validateEmoji('☕💕'), '☕💕')
  assert.equal(validateEmoji(' 🍕 🌙 '), '🍕🌙', 'spaces are removed')
  assert.equal(validateEmoji('🇮🇳🏏'), '🇮🇳🏏', 'flags count as one emoji')
  assert.equal(validateEmoji('pizza 🍕'), null, 'letters would let you type the answer')
  assert.equal(validateEmoji('🍕1'), null)
  assert.equal(validateEmoji(''), null)
  assert.equal(validateEmoji('😀😀😀😀😀😀😀😀😀'), null, 'more than eight')
  assert.equal(validateEmoji(42), null)
})

test('charades (draw): the secret word never reaches the guesser; three guesses; scoring; roles alternate', () => {
  let s = start('doodle')
  const vG0 = viewGame(s, B.id, players) as CharadesView
  const vA0 = viewGame(s, A.id, players) as CharadesView
  assert.equal(vA0.role, 'giver')
  assert.ok(vA0.word, 'the giver sees the word')
  assert.equal(vG0.word, undefined, 'the guesser does not')
  assert.ok(!JSON.stringify(vG0).includes(vA0.word!), 'the word is nowhere in the guesser payload')
  assert.equal(vG0.pattern.reduce((a, b) => a + b, 0) > 0, true)
  assert.ok(vG0.category)

  assert.ok(act(s, B, { type: 'clue', clue: [stroke()] }).error, 'guesser cannot draw')
  assert.ok(act(s, A, { type: 'clue', clue: [] }).error)
  assert.ok(act(s, B, { type: 'guess', text: 'x' }).error)
  s = ok(s, A, { type: 'clue', clue: [stroke(), stroke(3, 2, 0)] }).state
  assert.ok(act(s, A, { type: 'reroll' }).error, 'no word swap after drawing')

  let vG = viewGame(s, B.id, players) as CharadesView
  assert.equal(vG.phase, 'guess')
  assert.equal(vG.word, undefined, 'still hidden while guessing')
  assert.equal((vG.clue as Stroke[]).length, 2)
  assert.ok(act(s, A, { type: 'guess', text: vA0.word }).error, 'the drawer cannot guess')

  s = ok(s, B, { type: 'guess', text: 'definitely wrong' }).state
  vG = viewGame(s, B.id, players) as CharadesView
  assert.equal(vG.guessesLeft, 2)
  assert.deepEqual(vG.guesses, ['definitely wrong'])
  const win = ok(s, B, { type: 'guess', text: vA0.word!.toUpperCase() })
  assert.equal(win.points![A.id], 25, 'second guess = 2 pts → 2*10+5')
  assert.equal(win.stats!.charadesSolved, 1)
  s = win.state
  vG = viewGame(s, B.id, players) as CharadesView
  assert.equal(vG.phase, 'reveal')
  assert.equal(vG.solved, true)
  assert.equal(vG.word, vA0.word, 'the word is revealed after the round')
  assert.equal(vG.score, 2)

  s = ok(s, B, { type: 'next' }).state
  const vB = viewGame(s, B.id, players) as CharadesView
  assert.equal(vB.role, 'giver', 'roles swap')
  assert.equal(vB.round, 2)
  assert.ok(vB.word)
})

test('charades: three wrong guesses end the round with no team point', () => {
  let s = start('doodle')
  s = ok(s, A, { type: 'clue', clue: [stroke()] }).state
  s = ok(s, B, { type: 'guess', text: 'aaa' }).state
  s = ok(s, B, { type: 'guess', text: 'bbb' }).state
  const r = ok(s, B, { type: 'guess', text: 'ccc' })
  const v = viewGame(r.state, B.id, players) as CharadesView
  assert.equal(v.phase, 'reveal')
  assert.equal(v.solved, false)
  assert.equal(v.score, 0)
  assert.ok(v.word, 'the answer is shown so you can laugh about it')
  assert.ok(act(r.state, B, { type: 'guess', text: 'ddd' }).error)
})

test('charades: one word swap per round, giver only', () => {
  let s = start('emoji')
  const before = (viewGame(s, A.id, players) as CharadesView).word
  assert.ok(act(s, B, { type: 'reroll' }).error)
  s = ok(s, A, { type: 'reroll' }).state
  const after = (viewGame(s, A.id, players) as CharadesView).word
  assert.notEqual(before, after)
  assert.ok(act(s, A, { type: 'reroll' }).error, 'only once')
  assert.equal((viewGame(s, A.id, players) as CharadesView).rerollAvailable, false)
})

test('charades (emoji): letters are rejected, a full game reaches the summary', () => {
  let s = start('emoji')
  assert.ok(act(s, A, { type: 'clue', clue: 'coffee' }).error)
  assert.ok(act(s, A, { type: 'clue', clue: '☕💕1' }).error)
  let last
  for (let round = 1; round <= CHARADES_ROUNDS; round++) {
    const giver = (s as CharadesState).giver === 0 ? A : B
    const guesser = giver === A ? B : A
    const w = (viewGame(s, giver.id, players) as CharadesView).word!
    s = ok(s, giver, { type: 'clue', clue: '☕💕' }).state
    assert.equal((viewGame(s, guesser.id, players) as CharadesView).clue, '☕💕')
    s = ok(s, guesser, { type: 'guess', text: w }).state
    last = ok(s, giver, { type: 'next' })
    s = last.state
  }
  const v = viewGame(s, A.id, players) as CharadesView
  assert.equal(v.finished, true)
  assert.equal(v.history.length, CHARADES_ROUNDS)
  assert.equal(v.score, CHARADES_ROUNDS * 3, 'every first-guess solve scores 3')
  assert.equal(last!.stats!.gamesFinished, 1)
})
