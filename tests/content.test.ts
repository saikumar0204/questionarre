import { test } from 'node:test'
import assert from 'node:assert/strict'
import { QUIZ } from '../src/games/content/quiz.ts'
import { KNOWME } from '../src/games/content/knowme.ts'
import { LIKELY, NHIE, SENTENCE, WYR } from '../src/games/content/party.ts'
import { LOVELANG_QUESTIONS } from '../src/games/content/lovelang.ts'
import { DECKS } from '../src/games/content/deep.ts'
import { TOD_CARDS } from '../src/games/content/tod.ts'
import { DATE_IDEAS, COUPON_TEMPLATES, BADGES, GIFT_TYPES } from '../src/games/content/extras.ts'
import { GAMES, GROUP_ORDER } from '../src/games/registry.ts'

const banks = { QUIZ, KNOWME, WYR, LIKELY, NHIE, SENTENCE }

test('every prompt has a unique id, text and sane options', () => {
  const seen = new Set<string>()
  for (const [name, bank] of Object.entries(banks)) {
    assert.ok(bank.length >= 20, `${name} should have at least 20 prompts (has ${bank.length})`)
    for (const q of bank) {
      assert.ok(!seen.has(q.id), `duplicate id ${q.id}`)
      seen.add(q.id)
      assert.ok(q.text.trim().length > 8, `${q.id} text too short`)
      if (name === 'SENTENCE') {
        assert.equal(q.options, undefined)
      } else {
        assert.ok(q.options && q.options.length >= 2 && q.options.length <= 5, `${q.id} needs 2-5 options`)
        assert.equal(new Set(q.options).size, q.options!.length, `${q.id} has duplicate options`)
        for (const o of q.options!) assert.ok(o.trim().length > 0 && !o.includes('|'), `${q.id} bad option`)
      }
    }
  }
})

test('questions use names, never the confusing "me / you" wording', () => {
  // This is the bug the old version had: "Me (…)" vs "You (…)" meant opposite people to each partner.
  const banned = /\b(you|your|yours|yourself|me|my|mine|myself)\b/i
  const perspectiveFree = { QUIZ, KNOWME, LIKELY, WYR } as const
  const offenders: string[] = []
  for (const bank of Object.values(perspectiveFree)) {
    for (const q of bank) {
      const text = q.text.replace(/would you rather/i, '').replace(/"I love you"/g, '')
      if (banned.test(text)) offenders.push(`${q.id} text: ${q.text}`)
      for (const o of q.options ?? []) if (banned.test(o)) offenders.push(`${q.id} option: ${o}`)
    }
  }
  assert.deepEqual(offenders, [])
})

test('placeholders are only the ones each game fills in', () => {
  const allowed: Record<string, string[]> = {
    QUIZ: ['a', 'b'], WYR: ['a', 'b'], LIKELY: ['a', 'b'], NHIE: ['a', 'b'], KNOWME: ['who'], SENTENCE: ['partner', 'me'],
  }
  for (const [name, bank] of Object.entries(banks)) {
    for (const q of bank) {
      for (const s of [q.text, ...(q.options ?? [])]) {
        for (const m of s.matchAll(/\{(\w+)\}/g)) assert.ok(allowed[name].includes(m[1]), `${q.id} uses {${m[1]}}`)
      }
    }
  }
  for (const q of LOVELANG_QUESTIONS) for (const [t] of q.options) for (const m of t.matchAll(/\{(\w+)\}/g)) assert.equal(m[1], 'partner')
  for (const c of TOD_CARDS) for (const m of c.text.matchAll(/\{(\w+)\}/g)) assert.ok(['p', 'o'].includes(m[1]), `${c.id} uses {${m[1]}}`)
  for (const deck of Object.values(DECKS)) for (const t of deck.cards) for (const m of t.matchAll(/\{(\w+)\}/g)) assert.ok(['a', 'b'].includes(m[1]))
})

test('every category referenced by a game exists in its bank', () => {
  const cats = (bank: { cat: string }[]) => new Set(bank.map((q) => q.cat))
  for (const game of GAMES) {
    if (!game.option || game.option.key !== 'category') continue
    const bank = { quiz: QUIZ, wyr: WYR, likely: LIKELY, nhie: NHIE, sentence: SENTENCE }[game.id as 'quiz']
    for (const c of game.option.choices) {
      if (c.id === 'MIXED') continue
      assert.ok(cats(bank).has(c.id), `${game.id}: category ${c.id} has no prompts`)
      assert.ok(bank.filter((q) => q.cat === c.id).length >= 8, `${game.id}: category ${c.id} has fewer than 8 prompts`)
    }
  }
})

test('love language pairs: all 10 unique combinations, each language appears 4 times', () => {
  assert.equal(LOVELANG_QUESTIONS.length, 10)
  const pairs = new Set(LOVELANG_QUESTIONS.map((q) => q.options.map((o) => o[1]).sort().join('-')))
  assert.equal(pairs.size, 10)
  const counts: Record<string, number> = {}
  for (const q of LOVELANG_QUESTIONS) for (const [, tag] of q.options) counts[tag] = (counts[tag] ?? 0) + 1
  assert.deepEqual(Object.values(counts), [4, 4, 4, 4, 4])
})

test('truth or dare has enough cards per level and type', () => {
  for (const level of ['SWEET', 'FUN', 'SPICY']) {
    for (const type of ['TRUTH', 'DARE']) {
      const n = TOD_CARDS.filter((c) => c.level === level && c.type === type).length
      assert.ok(n >= 8, `${level} ${type} has only ${n}`)
    }
  }
  assert.equal(new Set(TOD_CARDS.map((c) => c.id)).size, TOD_CARDS.length)
})

test('deep talk decks, dates, coupons and badges are populated', () => {
  assert.equal(DECKS.SET1.cards.length + DECKS.SET2.cards.length + DECKS.SET3.cards.length, 36)
  assert.ok(DATE_IDEAS.length >= 30 && COUPON_TEMPLATES.length >= 12)
  assert.equal(new Set(BADGES.map((b) => b.id)).size, BADGES.length)
  assert.equal(new Set(GIFT_TYPES.map((g) => g.id)).size, GIFT_TYPES.length)
})

test('registry games are unique', () => {
  assert.equal(new Set(GAMES.map((g) => g.id)).size, GAMES.length)
  assert.ok(GAMES.length >= 12)
})

test('menu sections: every game is in a known section; the new layout leads with play & compete', () => {
  assert.deepEqual([...GROUP_ORDER], ['Play & compete', 'Think alike', 'Party time', 'Get closer'])
  for (const g of GAMES) assert.ok(GROUP_ORDER.includes(g.group), `${g.id} has unknown section ${g.group}`)
  const by = (grp: string) => GAMES.filter((g) => g.group === grp).map((g) => g.id).sort()
  assert.deepEqual(by('Play & compete'), ['c4', 'doodle', 'emoji', 'hunt', 'lie', 'memory', 'ttt'])
  assert.deepEqual(by('Think alike'), ['meld', 'quiz', 'rank', 'tunein'])
  assert.deepEqual(by('Party time'), ['likely', 'nhie', 'tod', 'wyr'])
  assert.deepEqual(by('Get closer'), ['deep', 'knowme', 'lovelang', 'sentence', 'story'])
  assert.deepEqual(GAMES.filter((g) => g.featured).map((g) => g.id).sort(), ['c4', 'doodle', 'hunt', 'tod', 'tunein'])
})
