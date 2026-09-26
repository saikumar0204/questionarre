import type { Engine, GameEvent, Reduced } from '../types.ts'
import { fill, playerVars } from '../text.ts'
import { DECKS, type DeckId } from '../content/deep.ts'

/** Deep Talk: conversation cards. One partner reads, BOTH answer out loud, then both tap "next". */
export type CardsState = { engine: 'cards'; deck: DeckId; idx: number; ready: string[]; finished: boolean }
export type CardsOptions = { deck?: DeckId }

const CARD_POINTS = 10
const FINISH_POINTS = 20

export type CardsView = {
  engine: 'cards'
  deck: DeckId
  deckName: string
  deckEmoji: string
  total: number
  index: number
  text: string
  reader: { name: string; isMe: boolean }
  me: { ready: boolean }
  partner: { name: string; ready: boolean }
  finished: boolean
}

const isDeck = (v: unknown): v is DeckId => typeof v === 'string' && v in DECKS

export const cardsEngine: Engine<CardsState, CardsView, CardsOptions> = {
  init(_players, options) {
    return { engine: 'cards', deck: options.deck && isDeck(options.deck) ? options.deck : 'SET1', idx: 0, ready: [], finished: false }
  },

  reduce(state, event: GameEvent, actor, players): Reduced<CardsState> {
    if (state.finished) return { state, error: 'This deck is finished.' }
    if (!players.some((p) => p.id === actor)) return { state, error: 'Not a player.' }
    if (event.type !== 'next') return { state, error: 'Unknown action.' }

    const ready = state.ready.includes(actor) ? state.ready : [...state.ready, actor]
    if (ready.length < players.length) return { state: { ...state, ready } }

    const idx = state.idx + 1
    const points: Record<string, number> = {}
    for (const p of players) points[p.id] = CARD_POINTS
    const cards = DECKS[state.deck].cards
    if (idx >= cards.length) {
      for (const p of players) points[p.id] += FINISH_POINTS
      return { state: { ...state, idx, ready: [], finished: true }, points, stats: { deepCards: 1, gamesFinished: 1 } }
    }
    return { state: { ...state, idx, ready: [] }, points, stats: { deepCards: 1 } }
  },

  view(state, viewer, players): CardsView {
    const deck = DECKS[state.deck]
    const partner = players.find((p) => p.id !== viewer)
    const reader = players[state.idx % 2] ?? players[0]
    const idx = Math.min(state.idx, deck.cards.length - 1)
    return {
      engine: 'cards',
      deck: state.deck,
      deckName: deck.name,
      deckEmoji: deck.emoji,
      total: deck.cards.length,
      index: state.idx,
      text: fill(deck.cards[idx], playerVars(players)),
      reader: { name: reader.name, isMe: reader.id === viewer },
      me: { ready: state.ready.includes(viewer) },
      partner: { name: partner?.name ?? 'Partner', ready: partner ? state.ready.includes(partner.id) : false },
      finished: state.finished,
    }
  },
}
